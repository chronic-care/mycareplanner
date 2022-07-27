/*
  The Preventive Care logic library supports decision-making on preventive care screening for Prostate Cancer.
*/

library ProstateCancerScreening version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include CDSConnectCommons version '1.0.0' called C3F
include PreventiveCareConcepts version '1.0.0' called PCC
include PreventiveCareData version '1.0.0' called Data

context Patient

/* Data Elements */

// TOOD For Hx, this should not be limited to active conditions
define "Prostate cancer conditions":
  Data."All active conditions" C
    where C.code ~ PCC."Prostate cancer"

define "Has family history of prostate cancer":
  /* exists([FamilyMemberHistory.condition.code: PCC."Prostate cancer"]) */
  exists([Condition: PCC."Family history of prostate cancer"])

define "PSA Observations":
  C3F.Verified([Observation: PCC."Prostate Specific Antigen Test"])

/* Intermediate Data Elements */

define "Has prostate cancer Hx":
  exists( "Prostate cancer conditions" )

define "Last PSA":
  C3F.MostRecent("PSA Observations")

define "Last PSA value":
  C3F.QuantityValue("Last PSA").value

define "Last PSA date":
  C3F.FindDate("Last PSA")

define "Has PSA test":
  exists("PSA Observations")

define "No PSA test results":
  not exists("PSA Observations")

define "Has PSA within one year":
  exists(C3F.ObservationLookBack("PSA Observations", 1 year))

define "Has PSA within two years":
  exists(C3F.ObservationLookBack("PSA Observations", 2 year))

define "Has high PSA value":
  exists("PSA Observations" C
    where C3F.QuantityValue(C).value > 4.0)

define "Last PSA value is high":
  "Last PSA value" > 4.0

/* Inclusion Criteria */

define "Who to Alert?":
  Data."Patient is male"
    and AgeInYears() between 55 and 70
    and not "Has prostate cancer Hx"

define "Recommend Screening?":
  "Who to Alert?"
    and ("No PSA test results"
      or not "Has PSA within two years"
    )

/* Screening Summary */

define ScreeningSummary: {
  notifyPatient: "Who to Alert?",
  recommendScreening: "Recommend Screening?",
  name: 'Prostate Cancer Screening',
  title: 'Decide If Prostate Cancer Screening Is Right for You',
  information: "Patient Information",
  decision: "Patient Decision",
  recommendation: "Patient Recommendation",
  questionnaire: 'mpc-prostate-cancer'
}

define "Patient Information":
  (List{
    if "No PSA test results"
      then 'You have never had a PSA test'
    else
      'Your last PSA value was ' + ToString("Last PSA value") + ' on ' + ToString("Last PSA date")
  }) Text where Text is not null

define "Patient Decision":
  (List{
    'Screening for prostate cancer has both potential benefits and harms. Whether you should be screened for prostate cancer is a personal decision. It depends on how worried you are about prostate cancer versus how worried you are about the harms of testing.'
  }) Text where Text is not null

define "Patient Recommendation":
  (List{
    'Guidelines say that men aged 55 to 69 years should talk with their doctor every 2 years and decide if they want to be screened.'
  }) Text where Text is not null
