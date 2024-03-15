import FHIR from 'fhirclient'
import { fhirclient } from 'fhirclient/lib/types'
import {
  Resource, Patient, Practitioner, RelatedPerson, CarePlan, CareTeam, Condition, DiagnosticReport, Goal,
  Observation, Procedure, Immunization, MedicationRequest, ServiceRequest, Provenance, Reference
} from './fhir-types/fhir-r4'
import { FHIRData, hasScope } from './models/fhirResources'
import { format } from 'date-fns'
import Client from 'fhirclient/lib/Client'
import {
  persistFHIRAccessData, extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint,
  persistLauncherData
} from './persistenceService'
import { doLog } from '../log';

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

const provenanceSearch = '&_revinclude=Provenance:target'

/// Epic category codes
// const carePlanPath = 'CarePlan?status=active&category=38717003,736271009,assess-plan' + provenanceSearch

// 'assess-plan' returns Longitudinal Care Plan in both Cerner and Epic.
// Cerner throws an error when including other category codes
const carePlanPath = 'CarePlan?status=active&category=assess-plan' + provenanceSearch

// Allscripts and Cerner throws error with _include arg for participants.
const careTeamPath = 'CareTeam?category=longitudinal' + provenanceSearch
const careTeamPath_include = 'CareTeam?_include=CareTeam:participant' + provenanceSearch

const goalsPath = 'Goal?lifecycle-status=planned,accepted,active,on-hold' + provenanceSearch

/// Epic allows multiple category codes only >= Aug 2021 release
// const conditionsPath = 'Condition?category=problem-list-item,health-concern,LG41762-2&clinical-status=active';
const problemListPath = 'Condition?category=problem-list-item&clinical-status=active' + provenanceSearch
const healthConcernPath = 'Condition?category=health-concern&clinical-status=active' + provenanceSearch

const immunizationsPath = 'Immunization?status=completed' + provenanceSearch
// date parameter not supported by NextGen (or likely the ge comparator)
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
const surveyResultsPath = 'Observation?category=survey,functional-mental-status' + provenanceSearch

const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
}

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
  await doLog({
    level: 'debug',
    event: 'getConditions',
    page: 'get Conditions',
    message: `getConditions: success`
  })
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
  await doLog({
    level: 'debug',
    event: 'getVitalSigns',
    page: 'get Vital Signs',
    message: `getVitalSigns: success`
  })
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

/*
* TODO: enhance this to verify current access token for SDS.
*/
export const supplementalDataIsAvailable = (): Boolean => {
  const authURL = process.env.REACT_APP_SHARED_DATA_AUTH_ENDPOINT
  const sdsURL = process.env.REACT_APP_SHARED_DATA_ENDPOINT
  const sdsScope = process.env.REACT_APP_SHARED_DATA_SCOPE

  return authURL !== undefined && authURL?.length > 0
    && sdsURL !== undefined && sdsURL?.length > 0
    && sdsScope !== undefined && sdsScope?.length > 0
}

// Original
// export const getSupplementalDataClient = async (): Promise<Client | undefined> => {
export const getSupplementalDataClient = async (patientId: string | null): Promise<Client | undefined> => {
  let sdsClient: Client | undefined
  const authURL = process.env.REACT_APP_SHARED_DATA_AUTH_ENDPOINT
  const sdsURL = process.env.REACT_APP_SHARED_DATA_ENDPOINT
  const sdsScope = process.env.REACT_APP_SHARED_DATA_SCOPE
  const sdsClientId = process.env.REACT_APP_SHARED_DATA_CLIENT_ID

  if (sdsClientId && sdsURL) {
    const sdsFhirAccessDataObject: fhirclient.ClientState | undefined =
      await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(sdsURL)
    if (sdsFhirAccessDataObject) {
      sdsClient = FHIR.client(sdsFhirAccessDataObject)
    }
  }
  else if (authURL && sdsURL && sdsScope) {
  console.log('authURL: ', authURL)
  console.log('sdsURL: ', sdsURL)
  console.log('sdsScope: ', sdsScope)

    const authFhirAccessDataObject: fhirclient.ClientState | undefined =
      await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(authURL)
    if (authFhirAccessDataObject) {
      console.log("authFhirAccessDataObject is truthy")
      // Replace the serverURL and client scope with Shared Data endpoint and scope
      var sdsFhirAccessDataObject = authFhirAccessDataObject
      sdsFhirAccessDataObject.serverUrl = sdsURL
      sdsFhirAccessDataObject.scope = sdsScope
      if (sdsFhirAccessDataObject.tokenResponse) {
        sdsFhirAccessDataObject.tokenResponse.scope = sdsScope
      }
      console.log("getSupplementalDataClient() sdsFhirAccessDataObject = ", sdsFhirAccessDataObject)
      // Connect to the client
      sdsClient = FHIR.client(sdsFhirAccessDataObject)
      console.log("FHIR.client(sdsFhirAccessDataObject) sdsClient = ", sdsClient)
    }
    else {
      console.warn("getSupplementalDataClient() authFhirAccessDataObject is null, cannot connect to client")
    }
  }

  return sdsClient
}

// TODO: MULTI-PROVIDER: Call this with getFHIRData/remove duplicate code there. Or, have this be called first.
// Due to the eventual merge of code, I have left in the majority of the dead code which will be live after the merge
// That dead code is everything within authorizedAndInLocalStorage === true because we won't have it in local storage until after we call this
export const createAndPersistClientForSavedOrNewProvider = async (authorizedAndInLocalStorage: boolean,
  serverUrl: string | null): Promise<void> => {
  console.log("createAndPersistClient()")

  try {
    let client: Client
    if (authorizedAndInLocalStorage) {
      console.log("Known to be authorized and previously stored in fhir-client-states-array, " +
        "reconnecting to given, prior - authorized client, and reloading data")
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
          // !FUNCTION DIFF! Commented out the following line
          // setAndLogProgressState("Connecting to FHIR client (for prior authorized client)", 5)
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
      // !FUNCTION DIFF! Commented out the following line
      // setAndLogProgressState("Connecting to FHIR client", 10)
      client = await FHIR.oauth2.ready();
      console.log('Executed: client = await FHIR.oauth2.ready()')
    }

    // !FUNCTION DIFF! Commented out the following line
    // setAndLogProgressState("Verifying connection data and state", 15)
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

  } catch (err) {
    throw (err)
  }
}

export const createAndPersistClientForNewProvider = async (serverUrl: string | undefined): Promise<boolean> => {
  console.log("createAndPersistClientForNewProvider()")

  try {
    let client: Client
    console.log('Starting default OAuth2 authentication')
    // !FUNCTION DIFF! Commented out the following line
    // setAndLogProgressState("Connecting to FHIR client", 10)
    client = await FHIR.oauth2.ready()
    console.log('Executed: client = await FHIR.oauth2.ready()')
    // !FUNCTION DIFF! Commented out the following line
    // setAndLogProgressState("Verifying connection data and state", 15)
    if (!client) {
      throw new Error("client isn't truthy, cannot connect to client or load FHIR data")
    }
    process.env.REACT_APP_DEBUG_LOG === 'true' && console.log("client: ", JSON.stringify(client))

    // We have a connected/populated client now, get and store the state, but don't load the data (FHIRData, CQL, etc.)
    const clientState: fhirclient.ClientState = client?.state
    if (clientState) {
      await persistFHIRAccessData(clientState)
    } else {
      console.log("Unable to persist data as no client?.state<fhirclient.ClientState> is available")
    }
    return true
  } catch (err) {
    throw (err)
  }
}

export const getFHIRData = async (authorized: boolean, serverUrl: string | null, clientOverride: Client | null,
  setAndLogProgressState: (message: string, value: number) => void,
  setResourcesLoadedCountState: (count: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
  console.log("Enter getFHIRData()")

  try {
    if (process.env.REACT_APP_LOAD_MELD_ON_STARTUP === 'true') {
      // TODO: For testing, implement when time
      console.log('Load Meld Sandbox automatically w/o a user-provided launcher and on startup')
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
        setAndLogProgressState("Connecting to FHIR client (for prior authorized client)", 5)
        if (!clientOverride) {
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
            client = FHIR.client(matchedFhirAccessDataObject)
            console.log('Executed: client = FHIR.client(matchedFhirAccessDataObject)')
          } else {
            throw new Error("A matching fhirAccessDataObject could not be found against the given serverUrl, cannot connect to client or load FHIR data")
          }
        } else {
          console.log('Overriding client...')
          client = clientOverride
          console.log('Overridden: client.state', client.state)
          console.log('Overridden: client.state.tokenResponse', client.state.tokenResponse)
          console.log('Overridden: client.state.tokenResponse.patient', client.state.tokenResponse?.patient)
        }
      } else {
        throw new Error("Given serverUrl is null, cannot connect to client or load FHIR data")
      }
    } else { // prior/default
      console.log("Not known to be authorized, but could be, either a launcher, app startup, " +
        "or FHIR.oauth2.authorize was called due to expiration")
      console.log('Starting default OAuth2 authentication')
      setAndLogProgressState("Connecting to FHIR client", 10)
      client = await FHIR.oauth2.ready()
      console.log('Executed: client = await FHIR.oauth2.ready()')
    }

    setAndLogProgressState("Verifying connection data and state", 15)
    if (!client) {
      throw new Error("client isn't truthy, cannot connect to client or load FHIR data")
    }

    if (process.env.REACT_APP_DEBUG_LOG === 'true') {
      console.log('client: ', client)
      console.log('Client JSON: ', JSON.stringify(client))
      console.log('client.state', client.state)
      console.log('client.state.tokenResponse', client.state.tokenResponse)
      console.log('client.state.tokenResponse.patient', client.state.tokenResponse?.patient)
    }

    // We have a connected/populated client now, get the state/make use of the data
    const clientState: fhirclient.ClientState = client?.state
    if (clientState) {
      await persistFHIRAccessData(clientState)
      if (!authorized && !serverUrl) {
        // Likely a launcher ***TODO: May need further identification***
        await persistLauncherData(clientState)
      }
    } else {
      console.log("Unable to persist data as no client?.state<fhirclient.ClientState> is available")
    }

    const clientScope = client?.state.tokenResponse?.scope
    const serverURL = client?.state.serverUrl

    // TODO design a way to move this into configuration settings, and/or check CapabilityStatement
    const supportsInclude = !(
      serverURL.includes('cerner.com') || serverURL.includes('allscripts.com')
    )
    console.log("Server URL: " + serverURL)
    console.log("Supports _include: " + supportsInclude)
    console.log('clientScope: ' + clientScope)

    // return await getFHIRResources(client, clientScope, supportsInclude,
    //   setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)
    const getFHIRDataResult: FHIRData = await getFHIRResources(client, clientScope, supportsInclude,
      setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)
    if (clientOverride) { 
      getFHIRDataResult.isSDS = true
      getFHIRDataResult.serverName = "SDS"
    }

    return getFHIRDataResult

  } catch (err) {
    // setAndLogErrorMessageState('Terminating',
    //   process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT ? process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT : UNSET_MESSAGE,
    //   'Failure in getFHIRData either asynchronously resolving FHIR.oath2.ready() promise or synchronously creating a new client.', err)
    // Error is thrown so will be caught and set by the whatever calls this getFHIRData function instead of here which will allow for speceficity in the error.
    // It must be thorwn Since getFHIRData guarantees a promise of type FHIRData
    throw (err)
  }

}

const getFHIRResources = async (client: Client, clientScope: string | undefined, supportsInclude: boolean,
  setAndLogProgressState: (message: string, value: number) => void,
  setResourcesLoadedCountState: (count: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
  /*
   *  Allscripts does not return patient, so also try user if patient is missing.
   */
  // const patient: Patient = await client.patient.read() as Patient
  // TODO: Analaysze/consider if we end up with persistence that can retain patient data for a longer period of time,
  // such as session storage, or a secure back end, or use or have a local storage endpoint with an active auth:
  // We could consider that if something is null, to grab from one of these locations (needs reauth required if local),
  // so it's not null, and can be populated in most cases
  setAndLogProgressState("Reading patient data", 20)
  

  const patient: Patient = client.patient.id !== null
    ? await client.patient.read() as Patient
    : await client.user.read() as Patient
  console.log('Patient resource:', patient)

  var pcpPath = patient.generalPractitioner ? patient.generalPractitioner?.[0]?.reference : undefined
  // workaround for Allscripts bug
  pcpPath = pcpPath?.replace('R4/fhir', 'R4/open')
  // console.log('PCP path = ' + pcpPath)
  const patientPCP: Practitioner | undefined = pcpPath ? await client.request(pcpPath) : undefined;

  setAndLogProgressState("Reading User data", 30)
  const patientPath = 'Patient/' + client.getPatientId();
  const fhirUserPath = client.getFhirUser();
  const serverUrl = client.state.serverUrl;
  console.log('client.getFhirUser(): ', client.getFhirUser())
  const fhirUser: Practitioner | Patient | RelatedPerson | undefined =
    fhirUserPath ? await client.request(fhirUserPath) : undefined
  console.log('fhirUser: ', fhirUser)
  const caregiverName: String | undefined =
    (patientPath === fhirUserPath) ? undefined : fhirUser?.name?.[0]?.text ?? fhirUser?.name?.[0]?.family


  let fhirQueries = {} // empty object for speed of development/testing purposes, remains empty if env var is false
  const getFhirQueriesEnvVar = process.env.REACT_APP_GET_FHIR_QUERIES
  console.log('process.env.REACT_APP_GET_FHIR_QUERIES', getFhirQueriesEnvVar)
  if (getFhirQueriesEnvVar === undefined || getFhirQueriesEnvVar === 'true') {
    // we allow undefined or true as we want the default to always be to load the queries
    setAndLogProgressState("Retrieving FHIR queries", 35)
    fhirQueries = await getFHIRQueries(client, clientScope, supportsInclude, patientPCP,
      setAndLogProgressState, setResourcesLoadedCountState, setAndLogErrorMessageState)
  }

  return {
    serverUrl,
    isSDS: false,
    clientScope,
    fhirUser,
    caregiverName,
    patient,
    patientPCP,
    ...fhirQueries
  }
}

const getFHIRQueries = async (client: Client, clientScope: string | undefined,
  supportsInclude: boolean, patientPCP: Practitioner | undefined,
  setAndLogProgressState: (message: string, value: number) => void,
  setResourcesLoadedCountState: (count: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void): Promise<FHIRData> => {
  console.time('FHIR queries')

  let resourcesLoadedCount: number = 0
  let curResourceName: string = "Unknown"

  var careTeamMembers = new Map<string, Practitioner>()

  if (patientPCP?.id !== undefined) {
    careTeamMembers.set(patientPCP?.id!, patientPCP!)
  }

  // Load FHIR Queries...
  // Note: Authentication form allows patient to un-select individual types from allowed scope

  const carePlans: CarePlan[] | undefined = await loadFHIRQuery<CarePlan>('Care Plan', 'CarePlan',
    carePlanPath, true, client, clientScope, 40, setAndLogProgressState, setAndLogErrorMessageState)
  carePlans && setResourcesLoadedCountState(++resourcesLoadedCount)

  curResourceName = 'Care Team'
  let careTeams: CareTeam[] | undefined
  setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 45)
  try {
    const _careTeamPath = supportsInclude ? careTeamPath_include : careTeamPath
    let careTeamData: Resource[] | undefined = (hasScope(clientScope, 'CareTeam.read')
      ? resourcesFrom(await client.patient.request(_careTeamPath, fhirOptions) as fhirclient.JsonObject)
      : undefined)
    careTeams = careTeamData?.filter((item: any) => item.resourceType === 'CareTeam') as CareTeam[]
    const careTeamPractitioners =
      careTeamData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
    careTeamPractitioners?.forEach((pract: Practitioner) => {
      if (pract.id !== undefined && careTeamMembers.get(pract.id!) === undefined) {
        careTeamMembers.set(pract.id!, pract)
      }
    })
    recordProvenance(careTeamData)
  } catch (err) {
    setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
  } finally {
    careTeams && setResourcesLoadedCountState(++resourcesLoadedCount)
  }

  const goals: Goal[] | undefined = await loadFHIRQuery<Goal>('Goal', 'Goal',
    goalsPath, true, client, clientScope, 50, setAndLogProgressState, setAndLogErrorMessageState)
  goals && setResourcesLoadedCountState(++resourcesLoadedCount)

  curResourceName = 'Condition'
  let conditions: Condition[] | undefined
  setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 55)
  try {
    conditions = (hasScope(clientScope, `${curResourceName}.read`)
      ? await getConditions(client)
      : undefined)
  } catch (err) {
    setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
  } finally {
    conditions && setResourcesLoadedCountState(++resourcesLoadedCount)
  }

  curResourceName = 'Procedure'
  let procedures: Procedure[] | undefined
  setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 60)
  try {
    let procedureData: Resource[] | undefined = (hasScope(clientScope, `${curResourceName}.read`)
      ? resourcesFrom(await client.patient.request(proceduresTimePath, fhirOptions) as fhirclient.JsonObject)
      : undefined)
    // if no procedures found in past 3 years, get _count=100
    if (procedureData === undefined || procedureData.entries?.length === 0) {
      procedureData = (hasScope(clientScope, `${curResourceName}.read`)
        ? resourcesFrom(await client.patient.request(proceduresCountPath, fhirOptions) as fhirclient.JsonObject)
        : undefined)
    }
    procedures = procedureData?.filter((item: any) => item.resourceType === curResourceName) as Procedure[]
    recordProvenance(procedureData)
  } catch (err) {
    setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
  } finally {
    procedures && setResourcesLoadedCountState(++resourcesLoadedCount)
  }

  const diagnosticReports: DiagnosticReport[] | undefined = await loadFHIRQuery<DiagnosticReport>('DiagnosticReport', 'DiagnosticReport',
    diagnosticReportPath, true, client, clientScope, 65, setAndLogProgressState, setAndLogErrorMessageState)
  diagnosticReports && setResourcesLoadedCountState(++resourcesLoadedCount)

  const immunizations: Immunization[] | undefined = await loadFHIRQuery<Immunization>('Immunizations', 'Immunization',
    immunizationsPath, true, client, clientScope, 70, setAndLogProgressState, setAndLogErrorMessageState)
  immunizations && setResourcesLoadedCountState(++resourcesLoadedCount)

  const labResults: Observation[] | undefined = await loadFHIRQuery<Observation>('Lab Results', 'Observation',
    labResultsPath, true, client, clientScope, 75, setAndLogProgressState, setAndLogErrorMessageState)
  labResults && setResourcesLoadedCountState(++resourcesLoadedCount)

  curResourceName = 'Medication Request'
  let medications: MedicationRequest[] | undefined
  setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 80)
  try {
    if (hasScope(clientScope, 'MedicationRequest.read')) {
      // fetch all active meds
      let medicationRequestData: Resource[] | undefined =
        resourcesFrom(await client.patient.request(medicationRequestActivePath, fhirOptions) as fhirclient.JsonObject)
      setAndLogProgressState('Found ' + (medicationRequestData?.length ?? 0) + ' active medication requests.', 81)
      // medicationRequestData && setResourcesLoadedCountState(++resourcesLoadedCount)

      // also fetch the last 10 inactive meds
      let inactiveMeds = resourcesFrom(await client.patient.request(medicationRequestInactivePath, fhirOptions) as fhirclient.JsonObject)
      // remove any inactive meds also in the active list (VA does not support the status parameter)
      setAndLogProgressState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (before filtering).', 82)
      inactiveMeds = inactiveMeds?.filter((item: any) => medicationRequestData?.find((resource: Resource) => resource.id === item.id) === undefined)
      // inactiveMeds && setResourcesLoadedCountState(++resourcesLoadedCount)

      setAndLogProgressState('Found ' + (inactiveMeds?.length ?? 0) + ' inactive medication requests (after removing duplicates).', 83)
      medicationRequestData = (medicationRequestData ?? []).concat(inactiveMeds ?? [])

      medications = medicationRequestData?.filter((item: any) => item.resourceType === 'MedicationRequest') as MedicationRequest[]
      recordProvenance(medicationRequestData)
    } else {
      medications = undefined
    }
  } catch (err) {
    setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
  } finally {
    medications && setResourcesLoadedCountState(++resourcesLoadedCount)
  }

  const serviceRequests: ServiceRequest[] | undefined = await loadFHIRQuery<ServiceRequest>('ServiceRequest', 'ServiceRequest',
    serviceRequestPath, true, client, clientScope, 85, setAndLogProgressState, setAndLogErrorMessageState)
  serviceRequests && setResourcesLoadedCountState(++resourcesLoadedCount)

  const socialHistory: Observation[] | undefined = await loadFHIRQuery<Observation>('SocialHistory', 'Observation',
    socialHistoryPath, true, client, clientScope, 90, setAndLogProgressState, setAndLogErrorMessageState)
  socialHistory && setResourcesLoadedCountState(++resourcesLoadedCount)

  // We may need to comment this out due to a prior known issue of a 400 error from Epic.
  // However, the loadFHIRQuery function should handle it regardless via it's catch and non-terminating error reporting/continuation.
  // Thus, it has been converted and added back for testing purposes.
  const surveyResults: Observation[] | undefined = await loadFHIRQuery<Observation>('Obs Survey', 'Observation',
    surveyResultsPath, true, client, clientScope, 93, setAndLogProgressState, setAndLogErrorMessageState)
  surveyResults && setResourcesLoadedCountState(++resourcesLoadedCount)
  // const surveyResults = undefined // required if we decide not to use the above code as was the case prior

  curResourceName = 'Vitals'
  let vitalSigns: Observation[] | undefined
  setAndLogProgressState(`${curResourceName} request: ` + new Date().toLocaleTimeString(), 95)
  try {
    vitalSigns = (hasScope(clientScope, 'Observation.read')
      ? await getVitalSigns(client)
      : undefined)
  } catch (err) {
    setAndLogNonTerminatingErrorMessageStateForResource(curResourceName, err, setAndLogErrorMessageState)
  } finally {
    vitalSigns && setResourcesLoadedCountState(++resourcesLoadedCount)
  }

  setAndLogProgressState('All FHIR requests finished: ' + new Date().toLocaleTimeString(), 100)
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

  // Reset progress as sometimes React isn't fast enough on next load
  setAndLogProgressState('', 0)
  setResourcesLoadedCountState(0)

  return {
    isSDS: false,
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

const loadFHIRQuery = async <T extends Resource>(
  resourceCommonName: string, resourceSrcCodeName: string, resourcePath: string,
  isRecordProvenance: boolean, client: Client, clientScope: string | undefined, progressValue: number,
  setAndLogProgressState: (message: string, value: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void)
  : Promise<T[] | undefined> => {

  let resourceData: Resource[] | undefined
  let resources: T[] | undefined
  setAndLogProgressState(`${resourceCommonName} request: ` + new Date().toLocaleTimeString(), progressValue)
  try {
    resourceData = (hasScope(clientScope, `${resourceSrcCodeName}.read`)
      ? resourcesFrom(await client.patient.request(resourcePath, fhirOptions) as fhirclient.JsonObject)
      : undefined)
    console.log("resourceData:", resourceData)
    resources = resourceData?.filter((item: any) => item.resourceType === resourceSrcCodeName) as T[]
    console.log("resources:", resources)
    isRecordProvenance && recordProvenance(resourceData)
  } catch (err) {
    await setAndLogNonTerminatingErrorMessageStateForResource(resourceCommonName, err, setAndLogErrorMessageState)
  }
  return resources
}

const setAndLogNonTerminatingErrorMessageStateForResource = async (
  resourceName: string, errorCaught: Error | string | unknown,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void)
  : Promise<void> => {

  const message: string = process.env.REACT_APP_NT_USER_ERROR_MESSAGE_FAILED_RESOURCE ?
    process.env.REACT_APP_NT_USER_ERROR_MESSAGE_FAILED_RESOURCE : 'None: Environment variable for message not set.'

  setAndLogErrorMessageState('Non-terminating', message.replaceAll('<RESOURCE_NAME>', resourceName),
    `Failure in getFHIRData retrieving ${resourceName} data.`, errorCaught)
}

export function createSharedDataResource(resource: Resource) {
  return getSupplementalDataClient(null)
    .then((client: Client | undefined) => {
      // console.log('SDS client: ' + JSON.stringify(client))
      return client?.create(resource as fhirclient.FHIR.Resource)
    })
    .then((response) => {
      return response
    }).catch(error => {
      console.log('Cannot create shared data resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
      return undefined
    })
}


export function updateSharedDataResource(resource: Resource,serverUrl?: string ) {
  return getSupplementalDataClient(null)
    .then((client: Client | undefined) => {
      try {   
        if (serverUrl) {
          const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
          const fhirHeaders = new Headers(); //
          fhirHeaders.append('X-Partition-Name',serverUrl);
          fhirHeaderRequestOption.headers = fhirHeaders;
          return client?.update(resource as fhirclient.FHIR.Resource,fhirHeaderRequestOption)
        }  else {         
          return client?.update(resource as fhirclient.FHIR.Resource)
        }
      }
      catch (err) {
        console.error("Error updating shared data resource: " + JSON.stringify(resource))
        console.error("Error updating shared data resource: " + JSON.stringify(err))
      }
    })
    .then((response) => {
      return response
    }).catch(error => {
      console.log('Cannot update shared data resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
      return undefined
    })
}

export async function getSharedGoals(): Promise<Goal[]> {
  console.log("getSharedGoals()")
  var resources: Resource[] = []
  var client = await getSupplementalDataClient(null)
  // console.log("Patient.id = " + client?.patient.id)
  await client?.patient.read()
  try {
    resources = resources.concat(resourcesFrom(await client?.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject))
  }
  catch (err) {
    console.log("Error reading shared Goals: " + JSON.stringify(err))
  }

  let goals = resources.filter((item: any) => item?.resourceType === 'Goal') as Goal[]
  console.log("getSharedGoals() Goals:")
  goals?.forEach(function (resource) {
    console.log(JSON.stringify(resource))
  })

  return goals
}
