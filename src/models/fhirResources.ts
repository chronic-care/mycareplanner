// import { fhirclient } from 'fhirclient/lib/types';
import { CarePlan, Condition, DiagnosticReport, Goal, Immunization, MedicationRequest, ServiceRequest,
  Observation, Patient, Practitioner, Procedure, RelatedPerson } from '../fhir-types/fhir-r4';

export interface FHIRData {
  fhirUser?: Practitioner | Patient | RelatedPerson | undefined,
  caregiverName?: String,
  patient: Patient,
  patientPCP?: Practitioner,
  carePlans?: [CarePlan],
  conditions?: [Condition],
  diagnosticReports?: [DiagnosticReport],
  goals?: [Goal],
  immunizations?: [Immunization],
  medications?: [MedicationRequest],
  serviceRequests?: [ServiceRequest],
  procedures?: [Procedure],
  labResults?: [Observation],
  vitalSigns?: [Observation],
  socialHistory?: [Observation],
  surveyResults?: [Observation],
}


export function displayDate(dateString?: string): string | undefined {
  let date = dateString === undefined ? undefined
    : new Date(dateString!) as Date
  return date === undefined ? undefined :
    date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
      })
}

export function displayValue(obs: Observation): string | undefined {
  // Use the first LOINC code
  let loincCode = obs.code?.coding?.filter((c) => c.system === 'http://loinc.org')?.[0]?.code
  var systolic: string | undefined = undefined
  var diastolic: string | undefined = undefined
  var display: string | undefined = undefined

  // If Blood Pressure observation, use its components
  if (loincCode === '85354-9' || loincCode === '55284-4') {
    obs.component?.forEach( comp => {
        let compCode = comp.code?.coding?.filter((c) => c.system === 'http://loinc.org')?.[0]?.code
        if (compCode === '8480-6') { 
          systolic = comp.valueQuantity?.value?.toString() }
        else if (compCode === '8462-4') { 
          diastolic = comp.valueQuantity?.value?.toString() }
        else { }
    })
    display = (systolic ?? '') + '/' + (diastolic ?? '') + ' mmHg'
  }
  else {
    let valueString = obs.valueQuantity?.value 
        ?? obs.valueCodeableConcept?.text ?? obs.valueCodeableConcept?.coding?.[0]?.display
        ?? obs.valueString
        ?? ''
    display = valueString + ' ' + (obs.valueQuantity?.unit ?? '')
  }

  return display
}
