import { FHIRData } from './fhirResources';

export interface CQLLibrary {
  // cql.Library reference
  library: any,
  // cql.CodeService reference
  codeService: any
}

export interface EditFormData {
  fhirDataCollection?: FHIRData[],
  patientSummaries?: PatientSummary[]
}

export interface SummaryData {
  patient?: PatientSummary,
  screening?: [ScreeningSummary],
}

export interface PatientSummary {
  patientId: string,
  givenName: string,
  fullName: string,
  age: string,
  gender: string,
  birthSex?: string,
  race?: string,
  pcpName?: string,
}

export interface ScreeningSummary {
  notifyPatient: boolean,
  recommendScreening: boolean,
  name: string,
  title: string,
  information: string[],
  decision: string[],
  recommendation: string[],
  questionnaire: string[],
}

export interface DataElementSummary {
  DisplayName?: string,
  // Resource?: Resource,
}

export interface ProvenanceSummary {
  Transmitter?: string,
  Author?: string,
}

export interface ConditionSummary {
  id?: string,
  Category?: string,
  CommonName?: string,
  ConceptName: string,
  RecordedDate?: string,
  AssertedDate?: string,
  OnsetDate?: string,
  Recorder?: string,
  Asserter?: string,
  Notes?: string[],
  HasGoal?: GoalSummary[],
  Provenance?: ProvenanceSummary[],
  LearnMore?: string
}

export interface GoalSummary {
  Category?: string,
  Description: string,
  ExpressedBy?: string,
  StartDate?: string,
  Target?: GoalTarget[],
  Addresses?: DataElementSummary[],
  Notes?: string[],
  Provenance?: ProvenanceSummary[],
  LearnMore?: string
}

export interface GoalTarget {
  DueDate?: string,
  DisplayName?: string,
  TargetValue?: string,
  LastResult?: ObservationSummary,
}

export interface MedicationSummary {
  Category?: string,
  ConceptName: string,
  AuthoredOn?: string,
  Requester?: string,
  DosageInstruction?: string,
  Notes?: string[],
  Provenance?: ProvenanceSummary[],
  LearnMore?: string
}

export interface ObservationSummary {
  DisplayName: string,
  ConceptName: string,
  Date?: string,
  ResultText: string,
  ResultValue?: number,
  ResultUnits?: string,
  ReferenceRange?: string,
  Interpretation?: string,
  Flag?: boolean,
  Performer?: string,
  Notes?: string[],
  Provenance?: ProvenanceSummary[],
  LearnMore?: string
}
