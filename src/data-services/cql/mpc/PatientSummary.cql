library PatientSummary

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "Race": 'urn:oid:2.16.840.1.113883.6.238'
code "Black or African American": '2054-5' from "Race" display 'Black or African American'
code "White": '2106-3' from "Race" display 'White'

context Patient

// Returns full name preferring 'official' use, if available.
define "Patient Full Name":
  ( Coalesce(GetPatientName('official'),
    GetPatientName('usual'),
    Patient.name[0]) ) Name
  return Coalesce(Name.text.value,
   (Combine(Name.given G return G.value, ' ') + ' ' + Name.family.value)
  )

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
  "Patient Race" contains "Black or African American"

// Returns a FHIR.Reference, or null if not present.
define "Patient PCP":
  First(Patient.generalPractitioner)

// Reference to a Practitioner resource
// TODO Resolve Practitioner reference if display value is missing
define "Patient PCP name":
  Coalesce({"Patient PCP".display.value, 'Your Doctor'})
