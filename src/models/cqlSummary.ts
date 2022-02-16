
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

export interface ConditionSummary {
  Category?: String,
  ConceptName: String,
  RecordedDate?: string,
  AssertedDate?: string,
  OnsetDate?: string,
  Notes?: String[],
  HasGoal?: GoalSummary[],
  LearnMore?: string
}

export interface GoalSummary {
  Category?: string | undefined,
  Description: string,
  ExpressedBy?: string | undefined,
  StartDate?: string | undefined,
  Target?: GoalTarget[] | undefined,
  Addresses?: ConditionSummary[] | undefined,
  Notes?: string[] | undefined,
  LearnMore?: string | undefined
}

export interface GoalTarget {
  DueDate?: string | undefined,
  DisplayName?: string | undefined,
  Value?: string | undefined,
  LastResult?: ObservationSummary | undefined,
}

export interface MedicationSummary {
  Category?: string | undefined,
  ConceptName: string,
  AuthoredOn?: string | undefined,
  Requester?: string | undefined,
  DosageInstruction?: string | undefined,
  Notes?: String[] | undefined,
  LearnMore?: string | undefined
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
  Notes?: String[],
  LearnMore?: string
}
