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
  BloodPressure: DE.MostRecent("Blood Pressure Observations"),
  BodyHeight: DE.MostRecent("Body Height Observations"),
  BodyWeight: DE.MostRecent("Body Weight Observations"),
  BodyMassIndex: DE.MostRecent("Body Mass Index Observations"),
  BodyTemperature: DE.MostRecent("Body Temperature Observations"),
  HeartRate: DE.MostRecent("Heart Rate Observations"),
  OxygenSaturation: DE.MostRecent("Oxygen Saturation Observations"),
  RespiratoryRate: DE.MostRecent("Respiratory Rate Observations")
}

// Vital Sign FHIR Observations sorted in descending order by issue date.

define "Blood Pressure Observations":
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
