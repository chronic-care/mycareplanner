// # Introduction

// The Preventive Care Data logic library supports data retrieval for decision support.

library PreventiveCareData version '1.0.0'

// # Data model #

using FHIR version '4.0.1'

// # Referenced libraries #

// The FHIRHelpers library provides common functions for simplifying interaction w/ the FHIR R4 data model.
include FHIRHelpers version '4.0.1' called FHIRHelpers
// The CDS Connect Commons for FHIRv400 library provides functions representing commonly used CDS logic and patterns.
include CDSConnectCommons version '1.0.0' called C3F
// The PreventiveCareConcepts library provides terminology concepts used to identify data elements throughout the artifact.
include PreventiveCareConcepts version '1.0.0' called PCC

// # CDS logic #

context Patient

/* Data Elements */

// Returns full name preferring 'official' use, if available.
define "Patient Full Name":
  ( Coalesce(GetPatientName('official'),
    GetPatientName('usual'),
    Patient.name[0]) ) Name
  return Coalesce(Name.text.value,
   (Combine(Name.given G return G.value, ' ') + ' ' + Name.family.value)
  )
  /* First((Patient.name N where N.use.value = 'official') Name
    return Coalesce(Name.text.value,
     (Combine(Name.given G return G.value, ' ') + ' ' + Name.family.value)
    )
  ) */

// Returns the first Given name, used for informal patient greeting.
define "Patient Given Name":
  Coalesce(GetPatientName('usual').given[0].value,
    GetPatientName('official').given[0].value,
    Patient.name[0].given[0].value
  )

define function GetPatientName(use String):
  First((Patient.name N where N.use.value = use) Name
    return Name
  )

define "Patient age in years based on date of birth":
  AgeInYears()

define "Patient administrative gender":
  Patient.gender.value

define "Patient birth sex":
  First(Patient.extension e
      where e.url = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex'
  ).value.value

define "Patient Race":
  (flatten (
    Patient.extension Extension
      where Extension.url = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race'
        return Extension.extension
  )) E
    where E.url = 'ombCategory'
      or E.url = 'detailed'
    return E.value as Coding

define "Patient Race Text":
  First((flatten (
    Patient.extension Extension
      where Extension.url = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race'
        return Extension.extension
  )) E
    where E.url = 'text'
    return (E.value as FHIR.string)).value

/* Intermediate Data Elements */

define "Patient is female":
  case
    when "Patient birth sex" = 'F' then true
    when "Patient birth sex" = 'M' then false
    // if birth sex is UNK or not available, then use Administrative Gender
    when "Patient administrative gender" = 'female' then true
    when "Patient administrative gender" = 'male' then false
    else null
  end

define "Patient is male":
  case
    when "Patient birth sex" = 'F' then false
    when "Patient birth sex" = 'M' then true
    // if birth sex is UNK or not available, then use Administrative Gender
    when "Patient administrative gender" = 'female' then false
    when "Patient administrative gender" = 'male' then true
    else null
  end

define "Race is African American":
  "Patient Race" contains PCC."Black or African American"

define "Patient is 40 or older":
  AgeInYears() >= 40

// Returns a FHIR.Reference, or null if not present.
define "Patient PCP":
  First(Patient.generalPractitioner)

// Reference to a Practitioner resource
// TODO Resolve Practitioner reference if display value is missing
define "Patient PCP name":
  Coalesce({"Patient PCP".display.value, 'Your Doctor'})

// # Patient diagnoses

define "All active conditions":
  C3F.Confirmed(C3F.ActiveOrRecurring([Condition]))
