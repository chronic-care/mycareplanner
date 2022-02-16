import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate, displayValue } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';

interface VitalsListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface VitalsListState {
}

export class VitalsList extends React.Component<VitalsListProps, VitalsListState> {

  constructor(props: VitalsListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let observations = this.props.fhirData?.vitalSigns

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Vitals</h4>

            <table><tbody>
            {observations?.map((obs, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr><td colSpan={2}><b>{obs.code?.text ?? obs.code?.coding?.[0]?.display ?? "No text"}</b></td></tr>
                <tr>
                  {/* <td align="left">{obs.valueQuantity?.value ?? obs.valueString} {obs.valueQuantity?.unit}</td> */}
                  <td align="left">{displayValue(obs) ?? 'No value'}</td>
                  <td align="right">{displayDate(obs.effectiveDateTime) ?? displayDate(obs.issued)}</td>
                </tr>
                <tr><td colSpan={2}>Performed by: {obs.performer?.[0]?.display ?? 'Unknown'}</td></tr>
                {obs.note?.map((note) => (
                  <tr><td colSpan={2}>Note: {note.text}</td></tr>
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
