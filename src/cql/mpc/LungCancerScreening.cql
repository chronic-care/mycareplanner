/*
  Library created by University of Utah, see https://github.com/cqframework/lcs-cds
*/

library LungCancerScreening

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include FHIRCommon version '4.0.1' called FC

codesystem "SNOMED": 'http://snomed.info/sct'
codesystem "UTAH_EDU": 'http://utah.edu/epic/proc_code'
codesystem "LOINC": 'http://loinc.org'

valueset "Lung Cancer":  'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1116.89'
valueset "Smoking Status": 'http://hl7.org/fhir/us/core/ValueSet/us-core-observation-smokingstatus'
valueset "Current Smoker": 'http://fhir.org/guides/utah-edu/lcs-cds/ValueSet/currentsmoker'
valueset "Chest CT": 'http://fhir.org/guides/utah-edu/lcs-cds/ValueSet/chest-ct-proc-code'
valueset "Condition Clinical Status": 'http://fhir.org/guides/utah-edu/lcs-cds/ValueSet/conditionclinical'

code "Tobacco Smoking Status": '72166-2' from "LOINC"
code "Former Smoker": '8517006' from "SNOMED"
code "PACKS A DAY": '8663-7' from "LOINC" display 'packs per day'

context Patient

/* Data Elements */
define "Patient age in years based on date of birth":
  AgeInYears()

// When a tobacco smoking status is more than 10 years old, should that be a "warning" surfaced to the clinician in some way?
define "Smoking status observation":
  [Observation: "Tobacco Smoking Status"] O
    where O.status in { 'final', 'amended' }
      //and FHIRHelpers.ToDateTime(O.issued) 10 years or less before Today()

define "Lung cancer diagnosis":
  [Condition: "Lung Cancer"] C
    where C.clinicalStatus in "Condition Clinical Status"

define "Chest CT procedure":
  [Procedure: "Chest CT"] P
    where P.status = 'completed'

/* Intermediate Data Elements */
define "50 through 80":
  AgeInYears() >= 50 and AgeInYears() <= 80

define "Most recent smoking status observation":
  Last("Smoking status observation" O
    sort by (FHIRHelpers.ToDateTime(issued))
  )

define "Current smoker observation":
  "Most recent smoking status observation" O
    where (O.value as CodeableConcept) in "Current Smoker"

define "Former smoker observation":
  "Most recent smoking status observation" O
    where (O.value as CodeableConcept) ~ "Former Smoker"

define "Is current smoker":
  "Current smoker observation" is not null

define "Is former smoker who quit within past 15 years":
  ("Former smoker observation" O
    where O.effective ends 15 years or less before Today()
  ) is not null

define "Smoking Period":
  "Most recent smoking status observation" O
    let EffectivePeriod: O.effective as FHIR.Period,
    // ToDate() is needed for JavaScript execution due to bug with DateTime duration
    StartDate: ToDate(EffectivePeriod.start.value),
    EndDate: ToDate(Coalesce(EffectivePeriod.end.value, Today()))
    return if StartDate is not null then Interval[StartDate, EndDate] else null

define "Pack-years":
  "Most recent smoking status observation" O
    let PacksPerDay: singleton from (O.component C where C.code ~ "PACKS A DAY").value.value,
    EffectivePeriod: O.effective as FHIR.Period,
    StartDate: ToDate(EffectivePeriod.start.value),
    EndDate: ToDate(Coalesce(EffectivePeriod.end.value, Today())),
    // DateInterval is needed for JavaScript execution due to bug with DateTime duration
    DurationInDays: duration in days of Interval[StartDate, EndDate]
    return (if (PacksPerDay is not null and StartDate is not null and DurationInDays is not null)
      then System.Quantity { value: Round(PacksPerDay * (DurationInDays / 365.25)), unit: '{Pack-years}' }
    else
      null)

define "Has 20 pack-year smoking history":
  "Pack-years" >= 20 '{Pack-years}'

define "Has lung cancer":
  exists ("Lung cancer diagnosis")

define "Had chest CT in past year":
  exists ("Chest CT procedure" P
    where FC.ToInterval(P.performed) ends 1 year or less before Today()
  )

/* Inclusion Criteria */
define "Inclusion Criteria":
  "50 through 80"
    and ("Is current smoker" or "Is former smoker who quit within past 15 years")
    and "Has 20 pack-year smoking history"
    and not "Has lung cancer"
    and not "Had chest CT in past year"

define "Is Eligible Detail":
  if "Inclusion Criteria"
    then 'Potential eligible patient: ' + First(Patient.name).text +
      ': Born ' + ToString(Patient.birthDate) +
      ' (Age: ' + ToString(AgeInYears()) +
      '), Gender: ' + Patient.gender
  else null

define "Is Eligible Summary":
  if "Inclusion Criteria"
    then 'Recommend shared decision making for lung cancer screening'
  else null

define "Is Eligible Indicator":
  if "Inclusion Criteria"
    then 'info'
  else null

/* Exclusion Criteria */
define "Exclusion Criteria":
  (
    not ("Is current smoker" or "Is former smoker who quit within past 15 years")
      or "Has lung cancer"
  )

define "Exclusion Detail":
  if "Exclusion Criteria"
    then First(Patient.name).text +
      ': Born ' + ToString(Patient.birthDate) +
      ' (Age: ' + ToString(AgeInYears()) +
      '), Gender: ' + Patient.gender
    else null

define "Exclusion Summary":
  if "Exclusion Criteria"
    then 'Patient is not currently recommended for lung cancer screening'
  else null

define "Exclusion Indicator":
  if "Exclusion Criteria"
    then 'info'
  else null
