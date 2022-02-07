
import { Observation } from '../fhir-types/fhir-r4';
import { ObservationSummary } from './cqlSummary';
import { displayDate, displayValue } from './fhirResources';

function mapObservations(observations: Observation[]): ObservationSummary[] {
    return observations.map(obs => {
        let name: String = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? "No text"
        return {
            DisplayName: name,
            ConceptName: name,
            Date: obs.effectiveDateTime ?? obs.issued,
            Performer: obs.performer?.[0]?.display,
            ResultText: displayValue(obs) ?? 'No value',
            Notes: obs.note,
        } as ObservationSummary
    })
}