library MCCVitalSigns version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for each vital sign data element
define VitalSignsSummary: 
  (List {
    DE.ReportHistory("Blood pressure", 'Blood Pressure'),
    ReportHomeBP,
    DE.ReportHistory("Body Height Observations", 'Height'),
    DE.ReportHistory("Body Weight Observations", 'Weight'),
    DE.ReportHistory("Body Mass Index Observations", 'BMI'),
    DE.ReportHistory("Body Temperature Observations", 'Temperature'),
    DE.ReportHistory("Heart Rate Observations", 'Heart Rate'),
    DE.ReportHistory("Oxygen Saturation Observations", 'Oxygen Saturation'),
    DE.ReportHistory("Respiratory Rate Observations", 'Respiratory Rate')
  }) Result where Result is not null

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
  DE.SortDescending( [Observation: Cx."Systolic blood pressure"]
    union [Observation: Cx."Epic POC Home Systolic blood pressure"]
    union [Observation: Cx."Epic PROD Home Systolic blood pressure"])

define "Diastolic Blood Pressure":
  DE.SortDescending([Observation: Cx."Diastolic blood pressure"]
    union [Observation: Cx."Epic POC Home Diastolic blood pressure"]
    union [Observation: Cx."Epic PROD Home Diastolic blood pressure"])

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

define ReportHomeBP:
  FirstHomeBP bp
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
      LearnMore: null,
      History: HomeBPHistory
    }

define HomeBPHistory:
  RemainingHomeBP bp
    return {
      Date: ToString(bp.Date),
      ResultText: bp.Display
    }

define FirstHomeBP:
  First("Combined Blood Pressure Observations")

define RemainingHomeBP:
  "Combined Blood Pressure Observations" bp
    where bp.Date != FirstHomeBP.Date