library LungCancerSummary version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include FHIRCommon version '4.0.1' called FC
include PatientSummary called PS
include LungCancerScreening called LCS

codesystem "SNOMED": 'http://snomed.info/sct'
code "Never Smoker": '266919005' from "SNOMED"

context Patient

define ScreeningSummary: {
  notifyPatient: "Notify Patient?",
  recommendScreening: "Recommend Screening?",
  name: 'Lung Cancer Screening',
  title: 'Should You Be Screened for Lung Cancer?',
  information: "Patient Information",
  decision: "Patient Decision",
  recommendation: "Patient Recommendation",
  questionnaire: 'mpc-lung-cancer'
}

define "Notify Patient?":
  LCS."50 through 80"
    and (LCS."Is current smoker" or "Is former smoker")
    and not LCS."Has lung cancer"

define "Recommend Screening?":
  LCS."Inclusion Criteria"

define "Is former smoker":
  LCS."Former smoker observation" is not null

define "Is former smoker who quit more than 15 years ago":
  (LCS."Former smoker observation" O
    where O.effective ends more than 15 years before Today()
  ) is not null

define "Never smoker observation":
  LCS."Most recent smoking status observation" O
    where (O.value as CodeableConcept) ~ "Never Smoker"

define "Is never smoker":
  "Never smoker observation" is not null

define "Most recent chest CT procedure":
  Last(LCS."Chest CT procedure" P
    sort by (FHIRHelpers.ToDateTime(performed))
  )

define "Smoking history in years":
  Round(duration in days of LCS."Smoking Period" / 365.25)

define "Has less than 20 pack-year smoking history":
  LCS."Pack-years" < 20 '{Pack-years}'

define "Packs per day":
  LCS."Most recent smoking status observation" O
    return singleton from (O.component C where C.code ~ LCS."PACKS A DAY").value.value as FHIR.decimal

define "Smoking Status":
  if LCS."Is current smoker"
    then 'You are a current smoker.'
  else if LCS."Is former smoker who quit within past 15 years"
    then 'You are a former smoker who quit within the past 15 years.'
  else if "Is former smoker who quit more than 15 years ago"
    then 'You are a former smoker who quit more than 15 years ago.'
  else if "Is former smoker"
    then 'You are a former smoker with an unknown quit date.'
  else if "Is never smoker"
    then 'You have never smoked.'
  else
    'Unknown smoking history.'

/* define "Smoking History":
  if LCS."Pack-years" is not null
    then 'You have ' + ToString(LCS."Pack-years".value) + ' pack-years'
      + ' from ' + ToString(start of LCS."Smoking Period")
      + ' to ' + ToString(end of LCS."Smoking Period") + '.'
    else null */

define "Smoking History":
  if LCS."Pack-years" is not null
    then 'You smoked ' + ToString("Packs per day") + ' packs/day'
      + ' for ' + ToString("Smoking history in years") + ' years'
      + (if "Is former smoker" then ' ending in ' + ToString(year from end of LCS."Smoking Period") else '')
      + ', which equals ' + ToString(LCS."Pack-years".value) + ' pack years.'
    else null

define "Patient Information":
  (List{
    "Smoking Status",
    "Smoking History",
    (if exists LCS."Chest CT procedure"
      then 'Your last chest CT was on ' + ToString("Most recent chest CT procedure".performed)
    else
      null)
  }) Text where Text is not null

define "Patient Decision":
  (List{
    'The guidelines recommend a low dose CT scan for people who currently smoke or are within 15 years of quitting smoking and have smoked for at least 20 pack years.'
  }) Text where Text is not null

define "Patient Recommendation":
  (List{
    (if "Recommend Screening?"
      then 'Consider Getting Screened for Lung Cancer'
    else if LCS."Pack-years" is null
      then 'Please complete your smoking history.'
    else
      'You Don’t Need Lung Cancer Screening'),
    (if "Is former smoker who quit more than 15 years ago"
      then 'It is good you quit smoking in ' + Coalesce(ToString(year from end of LCS."Smoking Period"), 'an unknown year') +'. Don’t start smoking again.'
    else
      null),
    (if "Is former smoker" and "Has less than 20 pack-year smoking history"
      then 'It is good you quit smoking in ' + Coalesce(ToString(year from end of LCS."Smoking Period"), 'an unknown year') + ' and that you only have ' + ToString(LCS."Pack-years".value) + ' pack years of smoking' + '. Don’t start smoking again.'
    else
      null),
    (if LCS."Is current smoker" and "Has less than 20 pack-year smoking history"
      then 'It is good you only have ' + ToString(LCS."Pack-years".value) + ' pack years of smoking. This means you do not need lung cancer screening. But you should quit smoking before you damage your lungs and heart more.'
    else
      null),
    (if (LCS."Is current smoker" or "Is former smoker who quit more than 15 years ago")
        and LCS."Has 20 pack-year smoking history"
      then 'Lung cancer screening saves lives. Lung cancer is the leading cause of cancer death in the US. Most cases of lung cancer are caused by smoking. Lung cancer has a generally poor prognosis but if found early can be cured.'
    else
      null),
    (if LCS."Is current smoker"
      then 'Talk with ' + PS."Patient PCP name" + ' about how to help you quit smoking.'
    else
      null)
  }) Text where Text is not null
