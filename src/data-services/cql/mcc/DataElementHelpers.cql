library DataElementHelpers version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include FHIRCommon version '4.0.1' called FC

codesystem "LOINC": 'http://loinc.org'
code "Blood pressure": '85354-9' from "LOINC" display 'Blood pressure systolic and diastolic'
code "Systolic blood pressure": '8480-6' from "LOINC" display 'Systolic blood pressure'
code "Diastolic blood pressure": '8462-4' from "LOINC" display 'Diastolic blood pressure'

parameter AsOf DateTime default Now()

/*
 * Report summary helpers
 */

// displayName: Patient-friendly name for display, usually based on value set classifier.
define function DataElementSummary(resource Resource, displayName String): 
  if (resource is null) then null
  else
  {
    DisplayName: Coalesce(displayName, DisplayName(resource)),   
    ConceptName: DisplayName(resource),
    SortDate: SortDate(resource),
    Resource: resource
  }

define function DataElement(resource Resource): 
  if (resource is null) then null
  else
  {  
    DisplayName: DisplayName(resource)
    // Resource: resource
  }

// Returns a list of data element summaries for these resources.
define function DataElements(resources List<FHIR.Resource>):
  resources R
    return DataElement(R)

// Returns a plain text display name for this FHIR resource.
define function DisplayName(resource Resource):
  Coalesce(
    Coalesce(
      // Coalesce is limited to 5 arguments
      ConceptText((resource as Condition).code),
      ConceptText((resource as Goal).description),
      ConceptText((resource as MedicationRequest).medication as CodeableConcept),
      ConceptText((resource as Observation).code),
      ConceptText((resource as Procedure).code)
    ),
    ConceptText((resource as ServiceRequest).code)
  )

// Returns a list of display names for these resources, for simple reporting and test logging.
define function DisplayNames(resources List<FHIR.Resource>):
  resources R
    return DisplayName(R)

// Returns a default sort date for this FHIR resource.
define function SortDate(resource Resource):
  Coalesce(
    Coalesce(
      FindOnsetDate(resource as Condition), (resource as Condition).recordedDate),
      (resource as MedicationRequest).authoredOn,
      FindDate(resource as Observation)
  )

// Returns a list of Provenance for a resource
define function ProvenanceOf(resource Resource):
  [Provenance] P
    where exists(P.target target
      where resource.id = GetId(target.reference))

// Fix issue when Provenance from Cerner FHIR sandbox omits transmitter from Provenance
define function ReportProvenance(resource Resource):
  (ProvenanceOf(resource)) P
    where ProvenanceTransmitter(P) is not null 
      return {
        Transmitter: ProvenanceTransmitter(P),
        Author: ProvenanceAuthor(P)
      }

define function ProvenanceTransmitter(provenance Provenance):
  First((provenance.agent) A
    where A.type.coding[0].code = 'transmitter'
    return A.who.display.value)

define function ProvenanceAuthor(provenance Provenance):
  First((provenance.agent) A
    where A.type.coding[0].code = 'author'
    return A.who.display.value)

define function ReportConditions(conditions List<Condition>, category String, commonName String):
  conditions C
    return ReportCondition(C, category, commonName)
  
define function ReportCondition(condition Condition, category String, commonName String):
  {
    id: condition.id.value,
    Category: category,
    CommonName: Coalesce(commonName, ConceptText(condition.code)),
    ConceptName: ConceptText(condition.code),
    CodeableConcept: condition.code,
    RecordedDate: ToString(condition.recordedDate),
    AssertedDate: null, // TODO get date from extention; see US Core profile
    // http://hl7.org/fhir/StructureDefinition/condition-assertedDate (dateTime type)
    OnsetDate: ToString(FindOnsetDate(condition)),
    Recorder: condition.recorder.display.value,
    Asserter: condition.asserter.display.value,
    Notes: ToString(condition.note),
    Provenance: ReportProvenance(condition),
    LearnMore: LearnMoreURL(condition.code)
  }

// Returns a list of Goals that address this Condition
define function HasGoals(condition Condition):
  [Goal] goal
    where exists(goal.addresses GA
      where condition.id = GetId(GA.reference))

define function ReportMedications(medRequests List<MedicationRequest>, category String):
  medRequests M
    return ReportMedication(M, category)

define function ReportMedication(medReq MedicationRequest, category String):
  {
    // TODO: support Medication reference
    Category: category,
    ConceptName: Coalesce(ConceptText(medReq.medication as CodeableConcept), (medReq.medication as Reference).display.value),
    AuthoredOn: ToString(medReq.authoredOn),
    Requester: medReq.requester.display.value,
    // DosageInstruction: Coalesce(First(medReq.dosageInstruction).text.value, First(medReq.dosageInstruction).patientInstruction.value),
    DosageInstruction: First(medReq.dosageInstruction).patientInstruction.value,
    Notes: ToString(medReq.note),
    Provenance: ReportProvenance(medReq),
    LearnMore: LearnMoreURL(medReq.medication as CodeableConcept)
  }

// BUG: this works in VSCode but returns null in JavaScript execution.
// define function SelectActiveConditions(conditions List<Condition>):
//   conditions Cond
//     where (Cond.clinicalStatus ~ FC."active"
//           or Cond.clinicalStatus ~ FC."relapse"
//           or Cond.clinicalStatus ~ FC."recurrence")
//       and Cond.verificationStatus ~ FC."confirmed"
//     sort by recordedDate.value descending

define function SelectActiveMedications(medRequests List<MedicationRequest>):
  medRequests MedReq
    where MedReq.status in {'active'}

define function MostRecentProcedure(procedures List<Procedure>):
  First(
    procedures P
      sort by start of FC.ToInterval(performed) descending
  )

define function PerformedWithin(procedures List<Procedure>, lookback System.Quantity):
  procedures P
    where end of FC.ToInterval(P.performed) on or after day of AsOf - lookback

/*
 * Helpers for Observation data elements.
 */

/// Tests only the first Coding in given CodeableConcept
define function FindObservations(code FHIR.CodeableConcept):
  if code is null or code.coding is null then null
  else
    [Observation] o
      where o.code ~ FHIRHelpers.ToCode(code.coding[0])
        or exists o.component c
          where c.code ~ FHIRHelpers.ToCode(code.coding[0])

define function ReportHistory(observations List<Observation>, displayName String):
  if not exists observations then null
  else
    ReportObservations(MostRecent(observations), SortDescending(observations), displayName)

define function ReportObservations(o Observation, history List<Observation>, displayName String):
  {
    DisplayName: displayName,                                   // patient-friendly display name
    ConceptName:   ConceptText(o.code),                         // display nanme from code
    Date:   ToString(FindDate(o)),
    ResultText: ResultText(o),         // result value with units
    ResultValue: if (o.value as FHIR.Quantity) is not null then System.Quantity { value: (o.value as FHIR.Quantity).value}.value else null,
    ResultUnits: (o.value as FHIR.Quantity).unit.value,
    ReferenceRange: ReferenceRange(o),
    Interpretation: Interpretation(o),
    Flag: if (o.value is FHIR.Quantity) then ReferenceRangeFlag(o) else null,   // true if value out of range, else false
    Performer: First(o.performer).display.value,
    Notes: ToString(o.note),
    Provenance: ReportProvenance(o),
    LearnMore: LearnMoreURL(o.code),
    History: ReportObservationHistory(history except {o})
  }

define function ReportObservationHistory(observations List<Observation>):
  observations obs
    return {
      Date: ToString(FindDate(obs)),
      ResultText: ResultText(obs)
    }

define function ResultText(o Observation):
  // If Blood pressure observation, then extract component values.
  if o.code ~ "Blood pressure" then
    ToString(((singleton from (o.component C where (C.code ~ "Systolic blood pressure"))).value as FHIR.Quantity).value)
     + '/' + ToString(((singleton from (o.component C where (C.code ~ "Diastolic blood pressure"))).value as FHIR.Quantity).value) + ' mmHg'
  else
    Coalesce(
      QuantityText(o.value as FHIR.Quantity),
      ConceptText(o.value as CodeableConcept),
      o.value as FHIR.string
    )

define function SelectByStatus(observations List<Observation>):
  observations Obs
	where Obs.status in {'final', 'amended', 'corrected', 'preliminary'}

define function MostRecent(observations List<Observation>):
  First(SortDescending(observations))

define function SortDescending(observations List<Observation>):
  observations O
    // Note: Cannot use FindDate() because execution engine cannot sort by result of a function.
    sort by Coalesce(
      (effective as FHIR.dateTime).value,
      (effective as FHIR.instant).value,
      (effective as FHIR.Period)."end".value,
      (effective as FHIR.Period)."start".value,
      issued.value) descending

define function IssuedWithin(observations List<Observation>, lookback System.Quantity):
  observations O
    where O.issued on or after day of AsOf - lookback

define function ReferenceRange(o FHIR.Observation):
  if (o is null or o.referenceRange is null) then null
  else
    Coalesce(First(o.referenceRange.text),
      ToString(ReferenceRangeLow(o)) + ' - ' + ToString(ReferenceRangeHigh(o))
    )

define function ReferenceRangeLow(o FHIR.Observation):
  First(o.referenceRange).low.value

define function ReferenceRangeHigh(o FHIR.Observation):
  First(o.referenceRange).high.value

define function ReferenceRangeFlag(o FHIR.Observation):
  if (o.value.value < ReferenceRangeLow(o)
      or o.value.value > ReferenceRangeHigh(o)) then true
  else false

define function Interpretation(o FHIR.Observation):
  if (o.interpretation is not null) then
    Coalesce(First(o.interpretation.text), First(First(o.interpretation).coding.display))
  else if o.referenceRange is not null and (o.value is FHIR.Quantity) then
    // Derive interpretation from the reference range, return null if within normal range.
    if o.value.value < ReferenceRangeLow(o) then 'Low'
    else if o.value.value > ReferenceRangeHigh(o) then 'High'
    else null
  else
    null

/**
 * Finds the first non-null meaningful date that can be associated with this Observation.  This will look through the
 * following fields in the following order: effectiveDateTime, effectiveInstant, effectivePeriod.end,
 * effectivePeriod.start, issued.
 * @param Obs - an Observation
 * @returns {System.DateTime} the first non-null meaningful date, or null if non is found
 */
define function FindDate(Obs Observation):
  Coalesce(
    (Obs.effective as FHIR.dateTime).value,
    (Obs.effective as FHIR.instant).value,
    (Obs.effective as FHIR.Period)."end".value,
    (Obs.effective as FHIR.Period)."start".value,
    Obs.issued.value
  )

define function FindOnsetDate(Cond Condition):
  Coalesce(
    (Cond.onset as FHIR.dateTime).value,
    (Cond.onset as FHIR.Period)."end".value,
    (Cond.onset as FHIR.Period)."start".value
  )

/*
 * General FHIR data helpers.
 */

define function GetId(uri String ):
  Last(Split(uri, '/'))

/// Returns an array of strings
define function ToString(notes List<Annotation>):
  notes N 
    where N.text is not null
    return N.text.value

// Returns the first-found display text for a CodeableConcept, looking first at the `text` attribute, then the
// `display` on each `coding` until it finds a non-null value.
// @param c - a FHIR CodeableConcept to get text from
// @returns {System.String} the display text or null if none is found
define function ConceptText(c FHIR.CodeableConcept):
  Coalesce(c.text.value, Coalesce((c.coding) c2 return c2.display.value), Coalesce((c.coding) c3 return c3.code.value))

// Returns a text representation of a Quantity with the Quantity's value and unit.
// If the unit is {score}, then omit it (as it is not useful to display)
// @param q - a FHIR Quantity to get text for
// @returns {System.String} the text representation of the Quantity
define function QuantityText(q FHIR.Quantity):
  if (q is null) then null
  else if (q.unit is not null and q.unit.value != '{score}') then ToString(q.value.value) + ' ' + q.unit.value
  else if (q.code is not null and q.code.value != '{score}') then ToString(q.value.value) + ' ' + q.code.value
  else ToString(q.value.value)

define function QuantityTextWithComparator(q FHIR.Quantity):
  if (q is null) then null
  else if (q.comparator is not null) then q.comparator.value + ' ' + QuantityText(q)
  else QuantityText(q)

define function RangeText(r FHIR.Range):
  if (r is null) then null
  else if (r.low is not null and r.high is not null) then 'between ' + ToString(r.low.value.value) + ' and ' + ToString(r.high.value.value)
  else if (r.low is not null and r.high is null) then 'above ' + ToString(r.low.value.value)
  else if (r.low is null and r.high is not null) then 'below ' + ToString(r.high.value.value)
  else null

/*
  Helper functions to construct URLs for MedLindPlus content.
*/

/// Returns web URL for MedlinePlus content using resource system/code
define function LearnMoreURL(concept FHIR.CodeableConcept):
  if LearnMoreCode(concept) is not null then
    'https://connect.medlineplus.gov/application?'
      + 'mainSearchCriteria.v.cs=' + LearnMoreCode(concept).system
      + '&mainSearchCriteria.v.c=' + LearnMoreCode(concept).code
  else
    null

// Returns a System.Code with sytem and code parameters for querying MedlinePlus
define function LearnMoreCode(concept FHIR.CodeableConcept):
  First(
    concept.coding c
      let medlineCode: MedlinePlusCode(c)
      where medlineCode is not null
      return medlineCode
  )

define function MedlinePlusCode(c FHIR.Coding):
  case
    when c.system.value = 'http://loinc.org' or c.system.value = 'urn:oid:2.16.840.1.113883.6.1' then
      System.Code { system: '2.16.840.1.113883.6.1', code: c.code.value, display: c.display.value }
    when c.system.value = 'http://snomed.info/sct' or c.system.value = 'urn:oid:2.16.840.1.113883.6.96' then
      System.Code { system: '2.16.840.1.113883.6.96', code: c.code.value, display: c.display.value }
    when c.system.value = 'http://hl7.org/fhir/sid/icd-10-cm' or c.system.value = 'urn:oid:2.16.840.1.113883.6.90' then
      System.Code { system: '2.16.840.1.113883.6.90', code: c.code.value, display: c.display.value }
    when c.system.value = 'http://www.nlm.nih.gov/research/umls/rxnorm' or c.system.value = 'urn:oid:2.16.840.1.113883.6.88' then
      System.Code { system: '2.16.840.1.113883.6.88', code: c.code.value, display: c.display.value }
    when c.system.value = 'http://hl7.org/fhir/sid/ndc' or c.system.value = 'urn:oid:2.16.840.1.113883.6.69' then
      System.Code { system: '2.16.840.1.113883.6.69', code: c.code.value, display: c.display.value }
    when c.system.value = 'http://www.ama-assn.org/go/cpt' or c.system.value = 'urn:oid:2.16.840.1.113883.6.12' then
      System.Code { system: '2.16.840.1.113883.6.12', code: c.code.value, display: c.display.value }
    else
      null
  end
