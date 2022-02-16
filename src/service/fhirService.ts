import FHIR from 'fhirclient';
import { fhirclient } from 'fhirclient/lib/types';
import { Resource, Patient, Practitioner, RelatedPerson, CarePlan, Condition, DiagnosticReport, Goal, Observation,
        Procedure, Immunization, MedicationRequest, ServiceRequest } from '../fhir-types/fhir-r4';
import { FHIRData } from '../models/fhirResources';
import { format } from 'date-fns';
import Client from 'fhirclient/lib/Client';

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
const fiveYearsAgo = new Date(today.getTime() - (365 * oneDay * 5))

// const carePlanPath = 'CarePlan?category=38717003,assess-plan';  // Epic or Cerner category
const carePlanPath = 'CarePlan?category=38717003,736271009,assess-plan';
const goalsPath = 'Goal?lifecycle-status=active';

// Epic allows multiple category codes only >= Aug 2021 release
// const conditionsPath = 'Condition?category=problem-list-item,health-concern,LG41762-2&clinical-status=active';
const conditionsPath = 'Condition?category=problem-list-item&clinical-status=active';

const immunizationsPath = 'Immunization?status=completed';
const labResultsPath = 'Observation?category=laboratory';
const medicationRequestPath = 'MedicationRequest?status=active&authoredon=' + getDateParameter(fiveYearsAgo);
// const serviceRequestPath = 'ServiceRequest?status=active&authored=' + getDateParameter(fiveYearsAgo);
const serviceRequestPath = 'ServiceRequest?status=active';
const proceduresPath = 'Procedure';
const diagnosticReportPath = 'DiagnosticReport';
// const vitalSignsPath = 'Observation?category=vital-signs&date=' + getDateParameter(sixMonthsAgo);
const vitalSignsPath = 'Observation?category=vital-signs_count=500';  // Epic defaults to count=1000
const socialHistoryPath = 'Observation?category=social-history';

// category=survey returns 400 error from Epic, so include another category recognized by Epic
const surveyResultsPath = 'Observation?category=survey,functional-mental-status';

const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

export async function getVitalSigns(client: Client): Promise<Observation[]> {
  var vitals: Observation[] = []
  // codes are ordered by preference for presentation: BP, Heart rate, O2 sat, temp, weight, height, BMI
  const vitalsCodes = ['85354-9', '8867-4', '59408-5', '2708-6', '8310-5', '29463-7', '8302-2', '39156-5']
  const queryPaths = vitalsCodes.map(code => {
    return 'Observation?category=vital-signs&code=http://loinc.org|' + code + '&_count=1'
  })

  // await can be used only at top-level within a function, cannot use queryPaths.forEach()
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[0], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[1], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[2], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[3], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[4], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[5], fhirOptions) as fhirclient.JsonObject) as [Observation] )
  vitals = vitals.concat( resourcesFrom(await client.patient.request(queryPaths[6], fhirOptions) as fhirclient.JsonObject) as [Observation] )

  vitals = vitals.filter(v => v !== undefined)
  return vitals
}

export const getFHIRData = async (): Promise<FHIRData> => {
  const client = await FHIR.oauth2.ready();

  function hasScope(resourceType: string) {
    // Use lower case for compare - Epic returns, e.g. Condition.Read
    return client?.state.tokenResponse?.scope?.toLowerCase().includes(resourceType.toLowerCase())
  }

  const patient: Patient = await client.patient.read() as Patient;
  const pcpPath = patient.generalPractitioner ? patient.generalPractitioner?.[0]?.reference : undefined;
  const patientPCP: Practitioner | undefined = pcpPath ? await client.request(pcpPath) : undefined;

  const patientPath = 'Patient/' + client.getPatientId();
  const fhirUserPath = client.getFhirUser();
  const fhirUser: Practitioner | Patient | RelatedPerson | undefined = fhirUserPath ? await client.request(fhirUserPath) : undefined;
  const caregiverName: String | undefined = (patientPath === fhirUserPath) ? undefined : fhirUser?.name?.[0]?.text ?? fhirUser?.name?.[0]?.family

  console.time('Observation queries')

  // Authentication form allows patient to un-select individual types from allowed scope
  console.log('CarePlan request: ' + new Date().toLocaleTimeString())
  const carePlans = (hasScope('CarePlan.read')
    ? resourcesFrom(await client.patient.request(carePlanPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [CarePlan];
  console.log('Goal request: ' + new Date().toLocaleTimeString())
  const goals = (hasScope('Goal.read')
    ? resourcesFrom(await client.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [Goal];
  console.log('Condition request: ' + new Date().toLocaleTimeString())
  const conditions = (hasScope('Condition.read')
    ? resourcesFrom(await client.patient.request(conditionsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [Condition];
  console.log('Procedure request: ' + new Date().toLocaleTimeString())
  const procedures = (hasScope('Procedure.read')
    ? resourcesFrom(await client.patient.request(proceduresPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Procedure];
  console.log('DiagnosticReport request: ' + new Date().toLocaleTimeString())
  const diagnosticReports = (hasScope('DiagnosticReport.read')
    ? resourcesFrom(await client.patient.request(diagnosticReportPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [DiagnosticReport];
  console.log('Immunization request: ' + new Date().toLocaleTimeString())
  const immunizations = (hasScope('Immunization.read')
    ? resourcesFrom(await client.patient.request(immunizationsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Immunization];
  console.log('LabResult request: ' + new Date().toLocaleTimeString())
  const labResults = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(labResultsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];
  console.log('MedicationRequest request: ' + new Date().toLocaleTimeString())
  const medications = (hasScope('MedicationRequest.read')
    ? resourcesFrom(await client.patient.request(medicationRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [MedicationRequest];
  console.log('ServiceRequest request: ' + new Date().toLocaleTimeString())
  const serviceRequests = (hasScope('ServiceRequest.read')
    ? resourcesFrom(await client.patient.request(serviceRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [ServiceRequest];
  console.log('Social History request: ' + new Date().toLocaleTimeString())
  const socialHistory = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(socialHistoryPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];

  // console.log('Obs Survey request: ' + new Date().toLocaleTimeString())
  // const surveyResults = (hasScope('Observation.read')
  //   ? resourcesFrom(await client.patient.request(surveyResultsPath, fhirOptions) as fhirclient.JsonObject) 
  //   : undefined) as [Observation];
  const surveyResults = undefined

  // console.log('Vitals request: ' + new Date().toLocaleTimeString())
  // const vitalSigns = (hasScope('Observation.read')
  //   ? resourcesFrom(await client.patient.request(vitalSignsPath, fhirOptions) as fhirclient.JsonObject) 
  //   // ? await getVitalSigns(client)
  //   : undefined) as [Observation];
  const vitalSigns = undefined

  console.log('All Observation requests finished: ' + new Date().toLocaleTimeString())
  console.timeEnd('Observation queries')

  // console.log("FHIRData Patient: " + JSON.stringify(patient));
  // console.log("FHIRData social history: ");
  // socialHistory?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource));
  // });
  // console.log("FHIRData goals: ");
  // goals?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource));
  // });

  // console.log("LabResults Bundle: ");
  // console.log(JSON.stringify(await client.patient.request(labResultsPath, fhirOptions)))

  return {
    fhirUser,
    caregiverName,
    patient,
    patientPCP,
    carePlans,
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
  };
};
