import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';

interface MedicationListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface MedicationListState {
}

export class MedicationList extends React.Component<MedicationListProps, MedicationListState> {

  constructor(props: MedicationListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let medications = this.props.fhirData?.medications

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Medications</h4>

          <table><tbody>
            {medications?.map((med, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr><td colSpan={2}><b>{med.medicationCodeableConcept?.text ?? med.medicationReference?.display ?? "No text"}</b></td></tr>
                <tr><td>{displayDate(med.authoredOn)}</td><td>By: {med.requester?.display ?? med.recorder?.display ?? 'Unknown'}</td></tr>
                <tr><td colSpan={2}>{med.dosageInstruction?.[0].text}</td></tr>
                {med.note?.map((note, idx) => (
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
