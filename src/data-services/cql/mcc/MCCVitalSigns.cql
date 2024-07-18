library MCCVitalSigns version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for each vital sign data element
define VitalSignsSummary: 
  (List {
    DE.ReportObservation(VitalSigns.BloodPressure, 'Blood Pressure'),
    First(ReportHomeBP()),
    DE.ReportObservation(VitalSigns.BodyHeight, 'Height'),
    DE.ReportObservation(VitalSigns.BodyWeight, 'Weight'),
    DE.ReportObservation(VitalSigns.BodyMassIndex, 'BMI'),
    DE.ReportObservation(VitalSigns.BodyTemperature, 'Temperature'),
    DE.ReportObservation(VitalSigns.HeartRate, 'Heart Rate'),
    DE.ReportObservation(VitalSigns.OxygenSaturation, 'Oxygen Saturation'),
    DE.ReportObservation(VitalSigns.RespiratoryRate, 'Respiratory Rate')
  }) Result where Result is not null

// Most recent FHIR Observation for each vital sign data element.
define VitalSigns: {
  BloodPressure: DE.MostRecent("Blood pressure"),
  BodyHeight: DE.MostRecent("Body Height Observations"),
  BodyWeight: DE.MostRecent("Body Weight Observations"),
  BodyMassIndex: DE.MostRecent("Body Mass Index Observations"),
  BodyTemperature: DE.MostRecent("Body Temperature Observations"),
  HeartRate: DE.MostRecent("Heart Rate Observations"),
  OxygenSaturation: DE.MostRecent("Oxygen Saturation Observations"),
  RespiratoryRate: DE.MostRecent("Respiratory Rate Observations")
}

// Vital Sign FHIR Observations sorted in descending order by issue date.

define "Blood pressure":
  DE.SelectByStatus([Observation: Cx."Blood pressure"])

define "Body Temperature Observations":
  DE.SelectByStatus([Observation: Cx."Body temperature"])

define "Body Height Observations":
  DE.SelectByStatus([Observation: Cx."Body height"])

define "Body Weight Observations":
  DE.SelectByStatus([Observation: Cx."Body weight"])

define "Body Mass Index Observations":
  DE.SelectByStatus([Observation: Cx."Body mass index"])

define "Heart Rate Observations":
  DE.SelectByStatus([Observation: Cx."Heart rate"])

define "Oxygen Saturation Observations":
  DE.SelectByStatus([Observation: Cx."Oxygen saturation"])

define "Respiratory Rate Observations":
  DE.SelectByStatus([Observation: Cx."Respiratory rate"])

/*
The following functions were added to support OHSU Epic data for Home Blood Pressure
that are returned as separate observations.
*/

define "Systolic Blood Pressure":
  SortDescending( [Observation: Cx."Systolic blood pressure"]
    union [Observation: Cx."Epic Systolic blood pressure"])

define "Diastolic Blood Pressure":
  SortDescending([Observation: Cx."Diastolic blood pressure"]
    union [Observation: Cx."Epic Diastolic blood pressure"])

// Use when Systolic and Diastolic BP are reported as an independent Observations (not recommended)
define "Combined Blood Pressure Observations":
  "Systolic Blood Pressure" systolicBP
      let DiastolicObs: MatchingDiastolic(systolicBP),
          SystolicValue: Round((systolicBP.value as FHIR.Quantity).value),
          DiastolicValue: Round((MatchingDiastolic(systolicBP).value as FHIR.Quantity).value),
          ResultDate: DE.FindDate(systolicBP)
    return {
      "Date": ResultDate,
      "Systolic": SystolicValue,
      "Diastolic": DiastolicValue,
      "Display": Coalesce(ToString(SystolicValue), '-') + '/' + Coalesce(ToString(DiastolicValue), '-') + ' mmHg',
      "Performer": First(systolicBP.performer).display.value,
      "Notes": DE.ToString(systolicBP.note) union DE.ToString(DiastolicObs.note),
      "Provenance": DE.ReportProvenance(systolicBP)
    }

define function MatchingDiastolic(systolicBP FHIR.Observation):
  First(
    "Diastolic Blood Pressure" diastolicBP
      where (diastolicBP.effective as FHIR.dateTime) = (systolicBP.effective as FHIR.dateTime)
  )

define function SortDescending(observations List<Observation>):
  observations O
    // Note: Cannot use FindDate() because execution engine cannot sort by result of a function.
    sort by Coalesce(
      (effective as FHIR.dateTime).value,
      (effective as FHIR.instant).value,
      (effective as FHIR.Period)."end".value,
      (effective as FHIR.Period)."start".value) descending

define function ReportHomeBP():
  "Combined Blood Pressure Observations" bp
    return {
      DisplayName: 'Home Blood Pressure',
      ConceptName: null,
      Date: ToString(bp.Date),
      ResultText: bp.Display,
      ResultValue: null,
      ResultUnits: null,
      ReferenceRange: null,
      Interpretation: null,
      Flag: null,
      Performer: bp.Performer,
      Notes: bp.Notes,
      Provenance: bp.Provenance,
      LearnMore: null
    }
