import FHIR from 'fhirclient';
import { fhirclient } from 'fhirclient/lib/types';
import { Resource, Patient, Practitioner, CarePlan, Condition, DiagnosticReport, Goal, Observation,
        Procedure, Immunization, MedicationRequest, ServiceRequest } from '../fhir-types/fhir-r4';
import { FHIRData } from '../models/fhirResources';
import { format } from 'date-fns';

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
const threeMonthsAgo = new Date(today.getTime() - (365/4 * oneDay))
const sixMonthsAgo = new Date(today.getTime() - (365/2 * oneDay))
const oneYearAgo = new Date(today.getTime() - (365 * oneDay))
const fiveYearsAgo = new Date(today.getTime() - (365 * oneDay * 5))

// const carePlanPath = 'CarePlan?category=38717003,assess-plan';  // Epic or Cerner category
const carePlanPath = 'CarePlan?category=38717003,736271009,assess-plan';
const goalsPath = 'Goal?lifecycle-status=active';
const conditionsPath = 'Condition?category=problem-list-item,health-concern,LG41762-2&clinical-status=active';
const immunizationsPath = 'Immunization';
const labResultsPath = 'Observation?category=laboratory';
const medicationRequestPath = 'MedicationRequest?status=active&authoredon=' + getDateParameter(fiveYearsAgo);
// const serviceRequestPath = 'ServiceRequest?status=active&authored=' + getDateParameter(fiveYearsAgo);
const serviceRequestPath = 'ServiceRequest?status=active';
const proceduresPath = 'Procedure';
const diagnosticReportPath = 'DiagnosticReport';
// const vitalSignsPath = 'Observation?category=vital-signs&date=' + getDateParameter(sixMonthsAgo);
const vitalSignsPath = 'Observation?category=vital-signs&_count=100';
const socialHistoryPath = 'Observation?category=social-history';

// category=survey returns 400 error from Epic, so include another category recognized by Epic
const surveyResultsPath = 'Observation?category=survey,functional-mental-status';

const fhirOptions: fhirclient.FhirOptions = {
  pageLimit: 0,
};

export const getFHIRData = async (): Promise<FHIRData> => {
  const client = await FHIR.oauth2.ready();

  function hasScope(resourceType: string) {
    // Use lower case for compare - Epic returns, e.g. Condition.Read
    return client?.state.tokenResponse?.scope?.toLowerCase().includes(resourceType.toLowerCase())
  }

  const patient: Patient = await client.patient.read() as Patient;
  const pcpPath = patient.generalPractitioner ? patient.generalPractitioner?.[0]?.reference : undefined;
  const practitioner: Practitioner | undefined = pcpPath ? await client.request(pcpPath) : undefined;

  // Authentication form allows patient to un-select individual types from allowed scope
  const carePlans = (hasScope('CarePlan.read')
    ? resourcesFrom(await client.patient.request(carePlanPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [CarePlan];
  const goals = (hasScope('Goal.read')
    ? resourcesFrom(await client.patient.request(goalsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [Goal];
  const conditions = (hasScope('Condition.read')
    ? resourcesFrom(await client.patient.request(conditionsPath, fhirOptions) as fhirclient.JsonObject)
    : undefined) as [Condition];
  const procedures = (hasScope('Procedure.read')
    ? resourcesFrom(await client.patient.request(proceduresPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Procedure];
  const diagnosticReports = (hasScope('DiagnosticReport.read')
    ? resourcesFrom(await client.patient.request(diagnosticReportPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [DiagnosticReport];
  const immunizations = (hasScope('Immunization.read')
    ? resourcesFrom(await client.patient.request(immunizationsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Immunization];
  const labResults = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(labResultsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];
  const medications = (hasScope('MedicationRequest.read')
    ? resourcesFrom(await client.patient.request(medicationRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [MedicationRequest];
  const serviceRequests = (hasScope('ServiceRequest.read')
    ? resourcesFrom(await client.patient.request(serviceRequestPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [ServiceRequest];
  const vitalSigns = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(vitalSignsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];
  const socialHistory = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(socialHistoryPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];
  const surveyResults = (hasScope('Observation.read')
    ? resourcesFrom(await client.patient.request(surveyResultsPath, fhirOptions) as fhirclient.JsonObject) 
    : undefined) as [Observation];

  // console.log("FHIRData Patient: " + JSON.stringify(patient));
  // console.log("FHIRData social history: ");
  // socialHistory?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource));
  // });
  // console.log("FHIRData goals: ");
  // goals?.forEach(function (resource) {
  //   console.log(JSON.stringify(resource));
  // });

  return {
    patient,
    practitioner,
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
