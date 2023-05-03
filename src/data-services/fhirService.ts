import FHIR from 'fhirclient'
import { fhirclient } from 'fhirclient/lib/types'
import {
  Resource, Patient, Practitioner, RelatedPerson, CarePlan, CareTeam, Condition, DiagnosticReport, Goal,
  Observation, Procedure, Immunization, MedicationRequest, ServiceRequest, Provenance, Reference
} from './fhir-types/fhir-r4'
import { FHIRData, hasScope } from './models/fhirResources'
import { format } from 'date-fns'
import Client from 'fhirclient/lib/Client'
import { responseToJSON } from 'fhirclient/lib/lib'
import {
  persistFHIRAccessData, extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint
} from './persistenceService'

const resourcesFrom = (response: fhirclient.JsonObject): Resource[] => {
  const entries = (response[0] as fhirclient.JsonObject)?.entry as [fhirclient.JsonObject];
  return entries?.map((entry: fhirclient.JsonObject) => entry.resource as any)
    .filter((resource: Resource) => resource.resourceType !== 'OperationOutcome');
};

// TODO full date argument does not work correctly in Logica?  Use only yyyy-MM for now.
// export const getDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM-dd')}`;
export const getDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM')}`;
const today: Date = new Date()
const oneDay = 24 * 3600 * 1000
// const threeMonthsAgo = new Date(today.getTime() - (365/4 * oneDay))
// const sixMonthsAgo = new Date(today.getTime() - (365/2 * oneDay))
// const oneYearAgo = new Date(today.getTime() - (365 * oneDay))
const threeYearsAgo = new Date(today.getTime() - (365 * oneDay * 3))
// const fiveYearsAgo = new Date(today.getTime() - (365 * oneDay * 5))

const provenanceSearch = '&_revInclude=Provenance:target'

/// Epic category codes
// const carePlanPath = 'CarePlan?status=active&category=38717003,736271009,assess-plan' + provenanceSearch

// 'assess-plan' returns Longitudinal Care Plan in both Cerner and Epic.
// Cerner throws an error when including other category codes
const carePlanPath = 'CarePlan?status=active&category=assess-plan' + provenanceSearch

// Allscripts and Cerner throws error with _include arg for participants.
const careTeamPath = 'CareTeam?category=longitudinal' + provenanceSearch
const careTeamPath_include = 'CareTeam?_include=CareTeam:participant' + provenanceSearch

const goalsPath = 'Goal?lifecycle-status=active' + provenanceSearch

/// Epic allows multiple category codes only >= Aug 2021 release
// const conditionsPath = 'Condition?category=problem-list-item,health-concern,LG41762-2&clinical-status=active';
const problemListPath = 'Condition?category=problem-list-item&clinical-status=active' + provenanceSearch
const healthConcernPath = 'Condition?category=health-concern&clinical-status=active' + provenanceSearch

const immunizationsPath = 'Immunization?status=completed' + provenanceSearch
// date parameter not supported by NexGen (or likely the ge comparator)
// const labResultsPath = 'Observation?category=laboratory&date=' + getDateParameter(fiveYearsAgo) + provenanceSearch
const labResultsPath = 'Observation?category=laboratory&_count=500' + provenanceSearch

// Allscripts does not support both status and authoredon args
// const medicationRequestPath = 'MedicationRequest?status=active&authoredon=' + getDateParameter(threeYearsAgo) + provenanceSearch
const medicationRequestActivePath = 'MedicationRequest?status=active' + provenanceSearch
const medicationRequestInactivePath = 'MedicationRequest?status=on-hold,cancelled,completed,stopped&_count=10' + provenanceSearch

const serviceRequestPath = 'ServiceRequest?status=active' + provenanceSearch
const proceduresTimePath = 'Procedure?date=' + getDateParameter(threeYearsAgo) + provenanceSearch
const proceduresCountPath = 'Procedure?_count=100' + provenanceSearch
const diagnosticReportPath = 'DiagnosticReport?date=' + getDateParameter(threeYearsAgo) + provenanceSearch
const socialHistoryPath = 'Observation?category=social-history' + provenanceSearch

/// category=survey returns 400 error from Epic, so include another category recognized by Epic
// const surveyResultsPath = 'Observation?category=survey,functional-mental-status' + provenanceSearch

const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

/// key = Resource.id  value = Provenance[]
var provenanceMap = new Map<string, Provenance[]>()

var provenance: Provenance[] = []

function recordProvenance(resources: Resource[] | undefined) {
  const provResources = resources?.filter((item: any) => item?.resourceType === 'Provenance') as Provenance[]

  provResources?.forEach((prov: Provenance) => {
    prov.target.forEach((ref: Reference) => {
      let resourceId = ref.reference
      if (resourceId !== undefined) {
        var provList: Provenance[] = provenanceMap.get(resourceId) ?? []
        provList = provList.concat([prov])
        provenanceMap.set(resourceId!, provList)
      }
    })
  })

  if (provResources !== undefined) {
    provenance = provenance.concat(provResources!)
  }
}

export async function getConditions(client: Client): Promise<Condition[]> {
  var resources: Resource[] = []
  // workaround for Allscripts lack of support for both category and status args
  if (client.state.serverUrl.includes('allscripts.com')) {
    const conditionsPath = 'Condition?category=problem-list-item,health-concern' + provenanceSearch
    resources = resources.concat(resourcesFrom(await client.patient.request(conditionsPath, fhirOptions) as fhirclient.JsonObject))
  }
  else {
    // Epic allows multiple category codes in one query only >= Aug 2021 release
    resources = resources.concat(resourcesFrom(await client.patient.request(problemListPath, fhirOptions) as fhirclient.JsonObject))
    resources = resources.concat(resourcesFrom(await client.patient.request(healthConcernPath, fhirOptions) as fhirclient.JsonObject))
  }

  const conditions = resources.filter((item: any) => item?.resourceType === 'Condition') as Condition[]
  recordProvenance(resources)

  return conditions
}

export async function getVitalSigns(client: Client): Promise<Observation[]> {
  // Workaround for Cerner and Epic Sandbox that takes many minutes to request vital-signs, or times out completely
  if (client.state.serverUrl === 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
    || client.state.serverUrl.includes('cerner.com')) {
    return []
  }

  var resources: Resource[] = []
  // codes are ordered by preference for presentation: BP, Heart rate, O2 sat, temp, weight, height, BMI
  // const vitalsCodes = ['85354-9', '8867-4', '59408-5', '2708-6', '8310-5', '29463-7', '8302-2', '39156-5']
  // codes are ordered by preference for presentation: BP, O2 sat, temp, weight, height
  const vitalsCodes = ['85354-9', '59408-5', '8310-5', '29463-7', '8302-2']
  const queryPaths = vitalsCodes.map(code => {
    // Issue: UCHealth returns 400 error if include both category and code.
    // return 'Observation?category=vital-signs&code=http://loinc.org|' + code + '&_sort:desc=date&_count=1'
    // return 'Observation?code=http://loinc.org|' + code + '&_sort:desc=date&_count=1' + provenanceSearch
    return 'Observation?code=http://loinc.org|' + code + '&_count=1' + provenanceSearch
  })

  // await can be used only at top-level within a function, cannot use queryPaths.forEach()
  resources = resources.concat(resourcesFrom(await client.patient.request(queryPaths[0], fhirOptions) as fhirclient.JsonObject) as Observation[])
  resources = resources.concat(resourcesFrom(await client.patient.request(queryPaths[1], fhirOptions) as fhirclient.JsonObject) as Observation[])
  resources = resources.concat(resourcesFrom(await client.patient.request(queryPaths[2], fhirOptions) as fhirclient.JsonObject) as Observation[])
  resources = resources.concat(resourcesFrom(await client.patient.request(queryPaths[3], fhirOptions) as fhirclient.JsonObject) as Observation[])
  resources = resources.concat(resourcesFrom(await client.patient.request(queryPaths[4], fhirOptions) as fhirclient.JsonObject) as Observation[])
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[5], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[6], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[7], fhirOptions) as fhirclient.JsonObject) as Observation[] )

  resources = resources.filter(v => v !== undefined)
  const vitals = resources.filter((item: any) => item?.resourceType === 'Observation') as Observation[]
  recordProvenance(resources)

  return vitals
}

export const getFHIRData = async (authorized: boolean, serverUrl: string | null,
  setProgressMessageState: (message: string) => void): Promise<FHIRData> => {
  console.log("Enter getFHIRData()")

  try {

    if (process.env.REACT_APP_LOAD_MELD_ON_STARTUP === 'true') {
      // TODO: Implement when time
      console.log('Attempting to load meld sandbox automatically w/o a user-provided launcher and on startup')
      // { iss: process.env.REACT_APP_MELD_SANDBOX_ENDPOINT_ISS,
      //   redirectUri: "./index.html",
      //   clientId: process.env.REACT_APP_CLIENT_ID_meld_mcc,
      //   scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE }
    }

    let client: Client
    if (authorized) {
      console.log("Known to be authorized, reconnecting to given, prior-authorized client, and reloading data")
      if (serverUrl) {
        console.log("serverUrl is truthy")
        const matchedFhirAccessDataObject: fhirclient.ClientState | undefined =
          await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(serverUrl)
        if (matchedFhirAccessDataObject) {
          console.log("matchedFhirAccessDataObject is truthy, we should have a valid endpoint to pass to the client and reauthorize without redirect")
          console.log("matchedFhirAccessDataObject", matchedFhirAccessDataObject)
          // FHIR.client is passed fhirclient.ClientState from localForage which allows for fetching data w/o an external redirect since already authorized
          // If for some reason we need an alternate impl to handle this, here are some options:
          // 1: Using the API, if possible, use fetch after some connection is made (with object or endpoint), or use ready in similar manner
          // 2: Store encrypted fhirData (actual patient data, hence encryption) in local storage and retrieve that
          // 3: Bypass authentication using the fakeTokenResponse/access_token or an access token directly
          // Note: Unfortunately, this is not an asynchronous operation
          setProgressMessageState("Connecting to FHIR Client (for prior authorized client)")
          client = FHIR.client(matchedFhirAccessDataObject)
          console.log('Executed: client = FHIR.client(matchedFhirAccessDataObject)')
        } else {
          throw new Error("A matching fhirAccessDataObject could not be found against the given serverUrl, cannot connect to client or load FHIR data")
        }
      } else {
        throw new Error("Given serverUrl is null, cannot connect to client or load FHIR data")
      }
    } else { // prior/default
      console.log("Not known to be authorized, but could be, either a launcher, app startup, or FHIR.oauth2.authorize was called due to expiration")
      console.log('Starting default OAuth2 authentication')
      setProgressMessageState("Connecting to FHIR Client")
      client = await FHIR.oauth2.ready();
      console.log('Executed: client = await FHIR.oauth2.ready()')
    }

    setProgressMessageState("Verifying connection data and state")
    if (!client) {
      throw new Error("client isn't truthy, cannot connect to client or load FHIR data")
    }

    process.env.REACT_APP_TEST_PERSISTENCE === 'true' && console.log("client: ", JSON.stringify(client))

    // We have a connected/populated client now, get the state/make use of the data
    const clientState: fhirclient.ClientState = client?.state
    if (clientState) {
      await persistFHIRAccessData(clientState)
    } else {
      console.log("Unable to persist data as no client?.state<fhirclient.ClientState> is available")
    }

    const clientScope = client?.state.tokenResponse?.scope
    const serverURL = client?.state.serverUrl

    // TODO design a way to move this into configuration settings, and/or check CapabilityStatement
    const supportsInclude = !(
      serverURL.includes('cerner.com') || serverURL.includes('allscripts.com')
    )
    console.log("Server URL = " + serverURL)
    console.log("Supports _include = " + supportsInclude)

    // console.log('OAuth2 scope authorized: ' + clientScope)
    console.log('Client JSON: ')
    console.log(console.log(JSON.stringify(client)))

    return await getFHIRResources(client, clientScope, supportsInclude, setProgressMessageState)
  } catch (err) {
    console.log(`Failure resolving FHIR.oath2.ready() promise in getFHIRData: ${err}`)
    throw (err)
  }

}

const getFHIRResources = async (client: Client, clientScope: string | undefined,
  supportsInclude: boolean, setProgressMessageState: (message: string) => void): Promise<FHIRData> => {
  /*
   *  Allscripts does not return patient, so also try user if patient is missing.
   */
  // const patient: Patient = await client.patient.read() as Patient
  // TODO: Analaysze/consider if we end up with persistence that can retain patient data for a longer period of time,
  // such as session storage, or a secure back end, or use or have a local storage endpoint with an active auth:
  // We could consider that if something is null, to grab from one of these locations (needs reauth required if local),
  // so it's not null, and can be populated in most cases
  setProgressMessageState("Reading Patient data")
  const patient: Patient = client.patient.id !== null
    ? await client.patient.read() as Patient
    : await client.user.read() as Patient

  // console.log('Patient resource:')
  // console.log(JSON.stringify(patient))

  var pcpPath = patient.generalPractitioner ? patient.generalPractitioner?.[0]?.reference : undefined

  // workaround for Allscripts bug
  pcpPath = pcpPath?.replace('R4/fhir', 'R4/open')
  // console.log('PCP path = ' + pcpPath)

  const patientPCP: Practitioner | undefined = pcpPath ? await client.request(pcpPath) : undefined;

  setProgressMessageState("Reading User data")
  const patientPath = 'Patient/' + client.getPatientId();
  const fhirUserPath = client.getFhirUser();
  const fhirUser: Practitioner | Patient | RelatedPerson | undefined =
    fhirUserPath ? await client.request(fhirUserPath) : undefined;
  const caregiverName: String | undefined =
    (patientPath === fhirUserPath) ? undefined : fhirUser?.name?.[0]?.text ?? fhirUser?.name?.[0]?.family


  let fhirQueries = {} // empty object for speed of development/testing purposes, remains empty if env var is false
  const getFhirQuereiesEnvVar = process.env.REACT_APP_GET_FHIR_QUERIES
  console.log('process.env.REACT_APP_GET_FHIR_QUERIES', getFhirQuereiesEnvVar)
  if (getFhirQuereiesEnvVar === undefined || getFhirQuereiesEnvVar === 'true') {
    // we allow undefined or true as we want the default to always be to load the queries
    setProgressMessageState("Retrieving FHIR Queries")
    fhirQueries = await getFHIRQueries(client, clientScope, supportsInclude, patientPCP, setProgressMessageState)
  }

  return {
    clientScope,
    fhirUser,
    caregiverName,
    patient,
    patientPCP,
    ...fhirQueries
  }
}

const getFHIRQueries = async (client: Client, clientScope: string | undefined, supportsInclude: boolean,
  patientPCP: Practitioner | undefined, setProgressMessageState: (message: string) => void): Promise<FHIRData> => {
  console.time('FHIR queries')

  var careTeamMembers = new Map<string, Practitioner>()

  if (patientPCP?.id !== undefined) {
    careTeamMembers.set(patientPCP?.id!, patientPCP!)
  }

  // Authentication form allows patient to un-select individual types from allowed scope
  setProgressMessageState('CarePlan request: ' + new Date().toLocaleTimeString())
  const carePlanData = (hasScope(clientScope, 'CarePlan.read')
    ? resourcesFrom(await client.patient.request(carePlanPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const carePlans = carePlanData?.filter((item: any) => item.resourceType === 'CarePlan') as CarePlan[]
  recordProvenance(carePlanData)

  setProgressMessageState('CareTeam request: ' + new Date().toLocaleTimeString())
  const _careTeamPath = supportsInclude ? careTeamPath_include : careTeamPath
  // console.log('CareTeam path: ' + _careTeamPath)
  const careTeamData = (hasScope(clientScope, 'CareTeam.read')
    ? resourcesFrom(await client.patient.request(_careTeamPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const careTeams = careTeamData?.filter((item: any) => item.resourceType === 'CareTeam') as CareTeam[]
  const careTeamPractitioners =
    careTeamData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
  careTeamPractitioners?.forEach((pract: Practitioner) => {
    if (pract.id !== undefined && careTeamMembers.get(pract.id!) === undefined) {
      careTeamMembers.set(pract.id!, pract)
    }
  })
  recordProvenance(careTeamData)

  setProgressMessageState('Goal request: ' + new Date().toLocaleTimeString())
  const goalData = (hasScope(clientScope, 'Goal.read')
    ? resourcesFrom(await client.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const goals = goalData?.filter((item: any) => item.resourceType === 'Goal') as Goal[]
  recordProvenance(goalData)

  setProgressMessageState('Condition request: ' + new Date().toLocaleTimeString())
  const conditions = (hasScope(clientScope, 'Condition.read')
    ? await getConditions(client)
    : undefined)

  setProgressMessageState('Procedure request: ' + new Date().toLocaleTimeString())
  var procedureData = (hasScope(clientScope, 'Procedure.read')
    ? resourcesFrom(await client.patient.request(proceduresTimePath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  // if no procedures found in past 3 years, get _count=100
  if (procedureData === undefined || procedureData.entries?.length === 0) {
    procedureData = (hasScope(clientScope, 'Procedure.read')
      ? resourcesFrom(await client.patient.request(proceduresCountPath, fhirOptions) as fhirclient.JsonObject)
      : undefined)
  }
  const procedures = procedureData?.filter((item: any) => item.resourceType === 'Procedure') as Procedure[]
  recordProvenance(procedureData)

  setProgressMessageState('DiagnosticReport request: ' + new Date().toLocaleTimeString())
  const diagnosticReportData = (hasScope(clientScope, 'DiagnosticReport.read')
    ? resourcesFrom(await client.patient.request(diagnosticReportPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const diagnosticReports =
    diagnosticReportData?.filter((item: any) => item.resourceType === 'DiagnosticReport') as DiagnosticReport[]
  recordProvenance(diagnosticReportData)

  setProgressMessageState('Immunization request: ' + new Date().toLocaleTimeString())
  const immunizationData = (hasScope(clientScope, 'Immunization.read')
    ? resourcesFrom(await client.patient.request(immunizationsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const immunizations =
    immunizationData?.filter((item: any) => item.resourceType === 'Immunization') as Immunization[]
  recordProvenance(immunizationData)

  setProgressMessageState('LabResult request: ' + new Date().toLocaleTimeString())
  const labResultData = (hasScope(clientScope, 'Observation.read')
    ? resourcesFrom(await client.patient.request(labResultsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const labResults = labResultData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  recordProvenance(labResultData)

  setProgressMessageState('MedicationRequest request: ' + new Date().toLocaleTimeString())
  var medications = undefined
  if (hasScope(clientScope, 'MedicationRequest.read')) {
    var medicationRequestData: Resource[] = []
    // fetch all active meds
    medicationRequestData = resourcesFrom(await client.patient.request(medicationRequestActivePath, fhirOptions) as fhirclient.JsonObject)
    setProgressMessageState('Found ' + (medicationRequestData?.length ?? 0) + ' active medication requests.')

    // also fetch the last 10 inactive meds
    var inactiveMeds = resourcesFrom(await client.patient.request(medicationRequestInactivePath, fhirOptions) as fhirclient.JsonObject)
    // remove any inactive meds also in the active list (VA does not support the status parameter)
    setProgressMessageState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (before filtering).')
    inactiveMeds = inactiveMeds?.filter((item: any) => medicationRequestData?.find((resource: Resource) => resource.id === item.id) === undefined)
    setProgressMessageState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (after removing duplicates).')
    medicationRequestData = (medicationRequestData ?? []).concat(inactiveMeds ?? [])

    medications = medicationRequestData?.filter((item: any) => item.resourceType === 'MedicationRequest') as MedicationRequest[]
    recordProvenance(medicationRequestData)
  }
  else {
    medications = undefined
  }

  setProgressMessageState('ServiceRequest request: ' + new Date().toLocaleTimeString())
  const serviceRequestData = (hasScope(clientScope, 'ServiceRequest.read')
    ? resourcesFrom(await client.patient.request(serviceRequestPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const serviceRequests =
    serviceRequestData?.filter((item: any) => item.resourceType === 'ServiceRequest') as ServiceRequest[]
  recordProvenance(serviceRequestData)

  setProgressMessageState('Social History request: ' + new Date().toLocaleTimeString())
  const socialHistoryData = (hasScope(clientScope, 'Observation.read')
    ? resourcesFrom(await client.patient.request(socialHistoryPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const socialHistory =
    socialHistoryData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  recordProvenance(socialHistoryData)

  // setProgressMessageState('Obs Survey request: ' + new Date().toLocaleTimeString())
  // const surveyResultData = (hasScope(clientScope, 'Observation.read')
  //   ? resourcesFrom(await client.patient.request(surveyResultsPath, fhirOptions) as fhirclient.JsonObject)
  //   : undefined)
  // const surveyResults =
  //  surveyResultData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  // recordProvenance(surveyResultData)
  const surveyResults = undefined

  setProgressMessageState('Vitals request: ' + new Date().toLocaleTimeString())
  const vitalSigns = (hasScope(clientScope, 'Observation.read')
    // ? resourcesFrom(await client.patient.request(vitalSignsPath, fhirOptions) as fhirclient.JsonObject)
    ? await getVitalSigns(client)
    : undefined)

  setProgressMessageState('All FHIR requests finished: ' + new Date().toLocaleTimeString())
  console.timeEnd('FHIR queries')


  console.log("Provenance resources: " + provenance?.length ?? 0)
  // provenance?.forEach((resource) => {
  //   console.log(JSON.stringify(resource))
  // })

  // console.log("Provenance dictionary values: " + provenanceMap?.size ?? 0)
  // provenanceMap?.forEach((provenanceList, refId) => {
  //   console.log("Provenance for: " + refId)
  //   console.log(JSON.stringify(provenanceList))
  // })

  // console.log("FHIRData Patient: " + JSON.stringify(patient))
  // console.log("FHIRData social history: ")
  // socialHistory?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })
  // console.log("FHIRData goals: ")
  // goals?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })
  // console.log("FHIRData Service Request: ")
  // serviceRequests?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })
  // console.log("FHIRData Immunization: ")
  // immunizations?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })

  // console.log("LabResults Bundle: ")
  // console.log(JSON.stringify(await client.patient.request(labResultsPath, fhirOptions)))

  // console.log("FHIRData CarePlan: ")
  // carePlans?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })

  // console.log("FHIRData MedicationRequest: ")
  // medications?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource))
  // })

  /*
  console.log("FHIRData CareTeam: ")
  careTeams?.forEach(function (resource) {
    console.log(JSON.stringify(resource))
  })

  console.log("FHIRData CareTeam practitioners: ")
  careTeamPractitioners?.forEach(function (resource) {
    console.log(JSON.stringify(resource))
  })

  console.log("CareTeam member dictionary values: " + careTeamMembers?.size ?? 0)
  careTeamMembers?.forEach((practitioner, id) =>
    console.log(JSON.stringify(practitioner))
  )
  */

  return {
    carePlans,
    careTeams,
    careTeamMembers,
    conditions,
    diagnosticReports,
    goals,
    immunizations,
    medications,
    serviceRequests,
    labResults,
    procedures,
    vitalSigns,
    socialHistory,
    surveyResults,
    provenanceMap,
    provenance,
  }
}

export function createResource(resource: Resource) {
  return FHIR.oauth2.ready()
    .then((client: Client) => {
      return client.create(resource as fhirclient.FHIR.Resource)
    })
    .then((response) => {
      console.log('Created new resource: ' + responseToJSON)
      return response
    }).catch(error => {
      console.log('Cannot create new resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
      return
    })
}

export function updateResource(resource: Resource) {
  return FHIR.oauth2.ready()
    .then((client: Client) => {
      return client.update(resource as fhirclient.FHIR.Resource)
    })
    .then((response) => {
      return response
    }).catch(error => {
      console.log('Cannot update resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
      return
    })
}
