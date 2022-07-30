library PreventiveCareConcepts version '1.0.0'

// ## Code Systems ##

codesystem "LOINC": 'http://loinc.org'
codesystem "SNOMED-CT": 'http://snomed.info/sct'
codesystem "Race": 'urn:oid:2.16.840.1.113883.6.238'

// ## Value sets ##

// Value sets from VSAC
valueset "Prostate Specific Antigen Test": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.2.215'

// Value sets not available in VSAC, included via expanded FHIR ValueSet resources


// ## Individual codes ##

// list individual codes from code systems used directly in the CQL logic. Individual codes are used when there is
// a single code from a particular vocabulary standard used to represent a clinical concept. It is considered
// best-practice not to create value sets containing a single code.

code "Black or African American": '2054-5' from "Race" display 'Black or African American'
code "White": '2106-3' from "Race" display 'White'

// TODO investigate value sets for these terms
code "Prostate cancer": '254900004' from "SNOMED-CT" display 'Carcinoma of prostate (disorder)'
code "Family history of prostate cancer": '414205003' from "SNOMED-CT" display 'Family history of prostate cancer (situation)'
