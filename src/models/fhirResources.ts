// import { fhirclient } from 'fhirclient/lib/types';
import { CarePlan, Condition, DiagnosticReport, Goal, Immunization, MedicationRequest, ServiceRequest,
  Observation, Patient, Practitioner, Procedure, RelatedPerson } from '../fhir-types/fhir-r4';

export interface FHIRData {
  fhirUser?: Practitioner | Patient | RelatedPerson | undefined,
  caregiverName?: String,
  patient: Patient,
  patientPCP?: Practitioner,
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
