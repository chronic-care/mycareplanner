import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import MenuComponent from './MenuComponent';
import { FHIRData } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { MedicationRequest } from '../../fhir-types/fhir-r4';

interface MedicationListProps {
  history?: any,
}

interface MedicationListState {
  fhirData?: FHIRData
}

export class MedicationList extends React.Component<MedicationListProps, MedicationListState> {

  constructor(props: MedicationListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let medications = this.state.fhirData?.medications

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Medications</h4>

          <table>
            {medications?.map((med, idx) => (
              <tr>
              <td>
              <table>
                <tr><td colSpan={2}>{med.medicationCodeableConcept?.text ?? med.medicationReference?.display ?? "No text"}</td></tr>
                <tr><td>Authored on: {med.authoredOn}</td><td>By: {med.requester?.display}</td></tr>
                <tr><td colSpan={2}>{med.dosageInstruction?.[0].text}</td></tr>
                {med.note?.map((note, idx) => (
                  <td colSpan={2}>Note: {note.text}</td>
                ))}
              </table>
              </td>
              </tr>
              ))}
          </table>
        </div>
      </div>
    )
  }

}
