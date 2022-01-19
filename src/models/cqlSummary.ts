
import { Patient } from '../fhir-types/fhir-r4';

export interface CQLLibrary {
  // cql.Library reference
  library: any,
  // cql.CodeService reference
  codeService: any
}

export interface SummaryData {
  patient?: PatientSummary,
  screening?: [ScreeningSummary],
}

export interface PatientSummary {
  patientId: String,
  givenName: String,
  fullName: String,
  age: String,
  gender: String,
  birthSex: String,
  race: String,
  pcpName: String,
}

export interface ScreeningSummary {
  notifyPatient: Boolean,
  recommendScreening: Boolean,
  name: String,
  title: String,
  information: [String],
  decision: [String],
  recommendation: [String],
  questionnaire: String,
}

export interface NextStepsSummary {
  nextSteps: [String],
}
