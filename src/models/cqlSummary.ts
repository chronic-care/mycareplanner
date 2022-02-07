
import { Annotation, Patient } from '../fhir-types/fhir-r4';

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
  birthSex?: String | undefined,
  race?: String | undefined,
  pcpName?: String | undefined,
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

export interface ObservationSummary {
  DisplayName: String,
  ConceptName: String,
  Date?: string,
  ResultText: String,
  ResultValue?: number | undefined,
  ResultUnits?: String | undefined,
  ReferenceRange?: String | undefined,
  Interpretation?: String | undefined,
  Flag?: Boolean | undefined,
  Performer?: String | undefined,
  Notes?: Annotation[],
}
