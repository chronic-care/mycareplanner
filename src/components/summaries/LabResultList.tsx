import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate, displayValue } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';

interface LabResultListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface LabResultListState {
}

export class LabResultList extends React.Component<LabResultListProps, LabResultListState> {

  constructor(props: LabResultListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let observations = this.props.fhirData?.labResults

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Lab Results</h4>

            <table><tbody>
            {observations?.map((obs, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr><td colSpan={2}><b>{obs.code?.text ?? obs.code?.coding?.[0]?.display ?? "No text"}</b></td></tr>
                <tr>
                  {/* <td align="left">{obs.valueQuantity?.value ?? obs.valueCodeableConcept?.text ?? obs.valueString} {obs.valueQuantity?.unit}</td> */}
                  <td align="left">{displayValue(obs) ?? 'No value'}</td>
                  <td align="right">{displayDate(obs.effectiveDateTime) ?? displayDate(obs.issued)}</td>
                </tr>
                <tr><td colSpan={2}>Ordered by: {obs.performer?.[0]?.display ?? 'Unknown'}</td></tr>
                {obs.note?.map((note, idx) => (
                  <tr key={idx}><td colSpan={2}>Note: {note.text}</td></tr>
                ))}
              </tbody></table>
              </td>
              </tr>
              ))}
          </tbody></table>
        </div>
      </div>
    )
  }

}
