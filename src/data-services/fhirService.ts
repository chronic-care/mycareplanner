import FHIR from 'fhirclient';
import { fhirclient } from 'fhirclient/lib/types';
import { Resource, Patient, Practitioner, RelatedPerson, CarePlan, CareTeam, Condition, DiagnosticReport, Goal, Observation,
        Procedure, Immunization, MedicationRequest, ServiceRequest, Provenance, Reference } from './fhir-types/fhir-r4';
import { FHIRData, hasScope } from './models/fhirResources';
import { format } from 'date-fns';
import Client from 'fhirclient/lib/Client';
import { responseToJSON } from 'fhirclient/lib/lib';

const resourcesFrom = (response: fhirclient.JsonObject): Resource[] => {
  const entries = (response[0] as fhirclient.JsonObject)?.entry as [fhirclient.JsonObject];
  return entries?.map((entry: fhirclient.JsonObject) => entry.resource as any)
                .filter((resource: Resource) => resource.resourceType !== 'OperationOutcome');
};

// TODO full date argument does not work correctly in Logica?  Use only yyyy-MM for now.
// export const getDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM-dd')}`;
export const getDateParameter = (d: Date): string => `ge${format(d, 'yyyy-MM')}`;
const today: Date = new Date()
const oneDay = 24*3600*1000
// const threeMonthsAgo = new Date(today.getTime() - (365/4 * oneDay))
// const sixMonthsAgo = new Date(today.getTime() - (365/2 * oneDay))
// const oneYearAgo = new Date(today.getTime() - (365 * oneDay))
const threeYearsAgo = new Date(today.getTime() - (365 * oneDay * 3))
const fiveYearsAgo = new Date(today.getTime() - (365 * oneDay * 5))

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
const labResultsPath = 'Observation?category=laboratory&date=' + getDateParameter(fiveYearsAgo) + provenanceSearch

// Allscripts does not support both status and authoredon args
// const medicationRequestPath = 'MedicationRequest?status=active&authoredon=' + getDateParameter(threeYearsAgo) + provenanceSearch
const medicationRequestPath = 'MedicationRequest?authoredon=' + getDateParameter(threeYearsAgo) + provenanceSearch

const serviceRequestPath = 'ServiceRequest?status=active' + provenanceSearch
const proceduresPath = 'Procedure?date=' + getDateParameter(threeYearsAgo) + provenanceSearch
const diagnosticReportPath = 'DiagnosticReport?date=' + getDateParameter(threeYearsAgo) + provenanceSearch
const socialHistoryPath = 'Observation?category=social-history' + provenanceSearch

/// category=survey returns 400 error from Epic, so include another category recognized by Epic
// const surveyResultsPath = 'Observation?category=survey,functional-mental-status' + provenanceSearch

const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

/// key = Resource.id  value = Provenance[]
var provenanceMap = new Map<string,Provenance[]>()

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
    resources = resources.concat( resourcesFrom(await client.patient.request(conditionsPath, fhirOptions) as fhirclient.JsonObject) )
  }
  else {
    // Epic allows multiple category codes in one query only >= Aug 2021 release
    resources = resources.concat( resourcesFrom(await client.patient.request(problemListPath, fhirOptions) as fhirclient.JsonObject) )
    resources = resources.concat( resourcesFrom(await client.patient.request(healthConcernPath, fhirOptions) as fhirclient.JsonObject) )
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
  resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[0], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[1], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[2], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[3], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[4], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[5], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[6], fhirOptions) as fhirclient.JsonObject) as Observation[] )
  // resources = resources.concat( resourcesFrom(await client.patient.request(queryPaths[7], fhirOptions) as fhirclient.JsonObject) as Observation[] )

  resources = resources.filter(v => v!== undefined)
  const vitals = resources.filter((item: any) => item?.resourceType === 'Observation') as Observation[]
  recordProvenance(resources)

  return vitals
}

export const getFHIRData = async (): Promise<FHIRData> => {
  console.log('Starting OAuth2 authentication')
  const client = await FHIR.oauth2.ready();
  console.log('Finished OAuth2 authentication')

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

  /*
   *  Allscripts does not return patient, so also try user if patient is missing.
   */
  // const patient: Patient = await client.patient.read() as Patient
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

  const patientPath = 'Patient/' + client.getPatientId();
  const fhirUserPath = client.getFhirUser();
  const fhirUser: Practitioner | Patient | RelatedPerson | undefined = fhirUserPath ? await client.request(fhirUserPath) : undefined;
  const caregiverName: String | undefined = (patientPath === fhirUserPath) ? undefined : fhirUser?.name?.[0]?.text ?? fhirUser?.name?.[0]?.family

  console.time('FHIR queries')

  var careTeamMembers = new Map<string,Practitioner>()

  if (patientPCP?.id !== undefined) {
    careTeamMembers.set(patientPCP?.id!, patientPCP!)
  }

  // Authentication form allows patient to un-select individual types from allowed scope
  console.log('CarePlan request: ' + new Date().toLocaleTimeString())
  const carePlanData = (hasScope(clientScope, 'CarePlan.read')
    ? resourcesFrom(await client.patient.request(carePlanPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const carePlans = carePlanData?.filter((item: any) => item.resourceType === 'CarePlan') as CarePlan[]
  recordProvenance(carePlanData)

  console.log('CareTeam request: ' + new Date().toLocaleTimeString())
  const _careTeamPath = supportsInclude ? careTeamPath_include : careTeamPath
  // console.log('CareTeam path: ' + _careTeamPath)
  const careTeamData = (hasScope(clientScope, 'CareTeam.read')
    ? resourcesFrom(await client.patient.request(_careTeamPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const careTeams = careTeamData?.filter((item: any) => item.resourceType === 'CareTeam') as CareTeam[]
  const careTeamPractitioners = careTeamData?.filter((item: any) => item.resourceType === 'Practitioner') as Practitioner[]
  careTeamPractitioners?.forEach((pract: Practitioner) => {
    if (pract.id !== undefined && careTeamMembers.get(pract.id!) === undefined) {
      careTeamMembers.set(pract.id!, pract)
    }
  })
  recordProvenance(careTeamData)

  console.log('Goal request: ' + new Date().toLocaleTimeString())
  const goalData = (hasScope(clientScope, 'Goal.read')
    ? resourcesFrom(await client.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined)
  const goals = goalData?.filter((item: any) => item.resourceType === 'Goal') as Goal[]
  recordProvenance(goalData)

  console.log('Condition request: ' + new Date().toLocaleTimeString())
  const conditions = (hasScope(clientScope, 'Condition.read')
    ? await getConditions(client)
    : undefined)
  
  console.log('Procedure request: ' + new Date().toLocaleTimeString())
  const procedureData = (hasScope(clientScope, 'Procedure.read')
    ? resourcesFrom(await client.patient.request(proceduresPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const procedures = procedureData?.filter((item: any) => item.resourceType === 'Procedure') as Procedure[]
  recordProvenance(procedureData)

  console.log('DiagnosticReport request: ' + new Date().toLocaleTimeString())
  const diagnosticReportData = (hasScope(clientScope, 'DiagnosticReport.read')
    ? resourcesFrom(await client.patient.request(diagnosticReportPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const diagnosticReports = diagnosticReportData?.filter((item: any) => item.resourceType === 'DiagnosticReport') as DiagnosticReport[]
  recordProvenance(diagnosticReportData)

  console.log('Immunization request: ' + new Date().toLocaleTimeString())
  const immunizationData = (hasScope(clientScope, 'Immunization.read')
    ? resourcesFrom(await client.patient.request(immunizationsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const immunizations = immunizationData?.filter((item: any) => item.resourceType === 'Immunization') as Immunization[]
  recordProvenance(immunizationData)

  console.log('LabResult request: ' + new Date().toLocaleTimeString())
  const labResultData = (hasScope(clientScope, 'Observation.read')
    ? resourcesFrom(await client.patient.request(labResultsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const labResults = labResultData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  recordProvenance(labResultData)

  console.log('MedicationRequest request: ' + new Date().toLocaleTimeString())
  const medicationRequestData = (hasScope(clientScope, 'MedicationRequest.read')
    ? resourcesFrom(await client.patient.request(medicationRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const medications = medicationRequestData?.filter((item: any) => item.resourceType === 'MedicationRequest') as MedicationRequest[]
  recordProvenance(medicationRequestData)

  console.log('ServiceRequest request: ' + new Date().toLocaleTimeString())
  const serviceRequestData = (hasScope(clientScope, 'ServiceRequest.read')
    ? resourcesFrom(await client.patient.request(serviceRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const serviceRequests = serviceRequestData?.filter((item: any) => item.resourceType === 'ServiceRequest') as ServiceRequest[]
  recordProvenance(serviceRequestData)

  console.log('Social History request: ' + new Date().toLocaleTimeString())
  const socialHistoryData = (hasScope(clientScope, 'Observation.read')
    ? resourcesFrom(await client.patient.request(socialHistoryPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined)
  const socialHistory = socialHistoryData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  recordProvenance(socialHistoryData)

  // console.log('Obs Survey request: ' + new Date().toLocaleTimeString())
  // const surveyResultData = (hasScope(clientScope, 'Observation.read')
  //   ? resourcesFrom(await client.patient.request(surveyResultsPath, fhirOptions) as fhirclient.JsonObject) 
  //   : undefined)
  // const surveyResults = surveyResultData?.filter((item: any) => item.resourceType === 'Observation') as Observation[]
  // recordProvenance(surveyResultData)
  const surveyResults = undefined

  console.log('Vitals request: ' + new Date().toLocaleTimeString())
  const vitalSigns = (hasScope(clientScope, 'Observation.read')
    // ? resourcesFrom(await client.patient.request(vitalSignsPath, fhirOptions) as fhirclient.JsonObject) 
    ? await getVitalSigns(client)
    : undefined)

  console.log('All FHIR requests finished: ' + new Date().toLocaleTimeString())
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
    clientScope,
    fhirUser,
    caregiverName,
    patient,
    patientPCP,
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
