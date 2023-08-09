library MCCMedications version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for each MedicationRequest data element.
define MedicationSummary:
  DE.ReportMedications(ActiveMedications, 'Active Medications')

// View summary tuple for each MedicationRequest data element, grouped by MCC value sets.
define MCCMedicationSummary:
  flatten {
    DE.ReportMedications("ACEis and ARBs", 'ACEis and ARBs'),
    DE.ReportMedications("Erythropoiesis Stimulating Agent", 'Erythropoiesis Stimulating Agent'),
    DE.ReportMedications("Iron Supplement", 'IronSupplement'),
    DE.ReportMedications("Phosphate Binders", 'Phosphate Binders'),
    DE.ReportMedications("Vitamin D", 'Vitamin D')
  }

define ActiveMedications:
  (DE.SelectActiveMedications([MedicationRequest])) M
    sort by authoredOn.value descending

// FHIR MedicationRequest resources with active status.

define "ACEis and ARBs":
  DE.SelectActiveMedications([MedicationRequest: Cx."ACEis and ARBs"])

define "Erythropoiesis Stimulating Agent":
  DE.SelectActiveMedications([MedicationRequest: Cx."Erythropoiesis Stimulating Agent"])

define "Iron Supplement":
  DE.SelectActiveMedications([MedicationRequest: Cx."Iron Supplement"])

define "Phosphate Binders":
  DE.SelectActiveMedications([MedicationRequest: Cx."Phosphate Binders"])

define "Vitamin D":
  DE.SelectActiveMedications([MedicationRequest: Cx."Vitamin D"])
