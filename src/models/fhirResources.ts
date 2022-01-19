// import { fhirclient } from 'fhirclient/lib/types';
import { Resource, CarePlan, Condition, DiagnosticReport, Goal, Immunization, MedicationRequest, ServiceRequest,
  Observation, Patient, Practitioner, Procedure } from '../fhir-types/fhir-r4';

export interface FHIRData {
  // patient: fhirclient.FHIR.Patient,
  // practitioner?: fhirclient.FHIR.Practitioner,
  patient: Patient,
  practitioner?: Practitioner,
  carePlans?: [CarePlan],
  conditions?: [Condition],
  diagnosticReports?: [DiagnosticReport],
  goals?: [Goal],
  immunizations?: [Immunization],
  medications?: [MedicationRequest],
  serviceRequests?: [ServiceRequest],
  procedures?: [Procedure],
  labResults?: [Observation],
  vitalSigns?: [Observation],
  socialHistory?: [Observation],
  surveyResults?: [Observation],
}
