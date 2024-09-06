// import { fhirclient } from 'fhirclient/lib/types';
import { CarePlan, CareTeam, Condition, DiagnosticReport, Goal, Immunization, MedicationRequest, ServiceRequest,
  Observation, Patient, Practitioner, Procedure, Provenance, RelatedPerson, CodeableConcept, Period, Timing, TimingRepeat } from '../fhir-types/fhir-r4';

export interface FHIRData {
  serverName? : string,
  serverUrl?: string,
  isSDS: boolean, // tracks if this set of data is from a supplemental data store or not
  clientScope?: string,
  fhirUser?: Practitioner | Patient | RelatedPerson | undefined,
  caregiverName?: String,
  patient?: Patient,
  patientPCP?: Practitioner,
  carePlans?: CarePlan[],
  careTeams?: CareTeam[],
  careTeamMembers?: Map<string,Practitioner>,
  // careTeamPhotos?: Binary[],
  conditions?: Condition[],
  diagnosticReports?: DiagnosticReport[],
  goals?: Goal[],
  immunizations?: Immunization[],
  medications?: MedicationRequest[],
  serviceRequests?: ServiceRequest[],
  procedures?: Procedure[],
  labResults?: Observation[],
  vitalSigns?: Observation[],
  socialHistory?: Observation[],
  surveyResults?: Observation[],

  // key = Resource.id, values = 0..* Provenance
  provenanceMap?: Map<string,Provenance[]>,
  provenance?: Provenance[],
}

export function hasScope(clientScope: string | undefined, resourceType: string) {
  // Use lower case for compare - Epic returns, e.g. Condition.Read
  return clientScope?.toLowerCase().includes(resourceType.toLowerCase())
    || (clientScope?.toLowerCase().includes('*.read') && resourceType.toLowerCase() !== 'servicerequest.read')
    // TODO generalize the second condition to allow only USCDI resources with wildcard scope
}


export function displayDate(dateString?: string): string | undefined {
  if (dateString === undefined || dateString === null) {
    return undefined
  }
  else {
    // If time is not included, then parse only Year Month Day parts
    // In JavaScript, January is 0. Subtract 1 from month Int.
    var parts = dateString!.split('-');
    var jsDate: Date = (dateString?.includes('T'))
      ? new Date(dateString!)
      : new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

    return jsDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
      })
  }
}

export function displayDateTime(dateString?: string): string | undefined {
  if (dateString === undefined || dateString === null) {
    return undefined
  }
  else {
    // If time is not included, then parse only Year Month Day parts
    // In JavaScript, January is 0. Subtract 1 from month Int.
    var parts = dateString!.split('-');
    var jsDate: Date = (dateString?.includes('T'))
      ? new Date(dateString!)
      : new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

    return jsDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
  }
}

export function displayConcept(codeable: CodeableConcept | undefined): string | undefined {
  if (codeable?.text !== undefined) {
    return codeable?.text
  }
  else {
    // use the first codeing.display that has a value
    return codeable?.coding?.filter((c) => c.display !== undefined)?.[0]?.display
  }
}

export function displayTiming(timing: Timing | undefined): string | undefined {
  let boundsPeriod = (timing?.repeat as TimingRepeat)?.boundsPeriod
  let startDate = displayDate(boundsPeriod?.start)
  let endDate = displayDate(boundsPeriod?.end)

  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

export function displayPeriod(period: Period | undefined): string | undefined {
  let startDate = displayDate(period?.start)
  let endDate = displayDate(period?.end)

  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
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

export function displayTransmitter(prov: Provenance | undefined): string | undefined {
  var display: string | undefined

  prov?.agent?.forEach( agent => {
    agent.type?.coding?.forEach( coding => {
      if (coding.code === 'transmitter') {
        display = agent.who?.display
      }
    })
  })

  return display
}
