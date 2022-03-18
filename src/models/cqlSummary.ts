
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

export interface ConditionSummary {
  Category?: string,
  ConceptName: string,
  RecordedDate?: string,
  AssertedDate?: string,
  OnsetDate?: string,
  Notes?: string[],
  HasGoal?: GoalSummary[],
  LearnMore?: string
}

export interface GoalSummary {
  Category?: string,
  Description: string,
  ExpressedBy?: string,
  StartDate?: string,
  Target?: GoalTarget[],
  Addresses?: ConditionSummary[],
  Notes?: string[],
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
  LearnMore?: string
}
