import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary, MedicationSummary } from '../../models/cqlSummary';
import { getMedicationSummary } from '../../service/mccCqlService';

interface MedicationListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface MedicationListState {
  medicationSummary?: [MedicationSummary]
}

export class MedicationList extends React.Component<MedicationListProps, MedicationListState> {

  constructor(props: MedicationListProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    console.time('getMedicationSummary()')
    this.setState({ medicationSummary: getMedicationSummary(this.props.fhirData) })
    console.timeEnd('getMedicationSummary()')
  }

  public render(): JSX.Element {
    let medications = this.state.medicationSummary

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Medications</h4>

          <table><tbody>
            {medications?.map((med, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr>
                  <td colSpan={3}><b>{med.ConceptName ?? "No text"}</b></td>
                  <td align="right">{med.LearnMore === undefined || med.LearnMore === null ? '' :
                    <Link to="route" target="_blank" onClick={(event) => {event.preventDefault(); window.open(med.LearnMore);}}><i>Learn&nbsp;More</i></Link>}</td>
                </tr>
                <tr><td colSpan={2}>{displayDate(med.AuthoredOn)}</td><td colSpan={2}>By: {med.Requester ?? 'Unknown'}</td></tr>
                <tr><td colSpan={4}>{med.DosageInstruction}</td></tr>
                {med.Notes?.map((note, idx) => (
                  <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
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
