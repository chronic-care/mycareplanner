import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';

interface ImmunizationListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface ImmunizationListState {
}

export class ImmunizationList extends React.Component<ImmunizationListProps, ImmunizationListState> {

  constructor(props: ImmunizationListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let immunizations = this.props.fhirData?.immunizations
    // TODO sort by descending date

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Immunizations</h4>

          {immunizations === undefined ? <p>No records found.</p> :
          <table><tbody>
            {immunizations?.map((med, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr><td><b>{med.vaccineCode?.text ?? "No text"}</b></td></tr>
                <tr><td>Administered on: {displayDate(med.occurrenceDateTime)}</td></tr>
                {(med.location === undefined) ? '' :
                  <tr><td>Location: {med.location?.display}</td></tr>
                }
                {med.note?.map((note, idx) => (
                  <tr key={idx}><td>Note: {note.text}</td></tr>
                ))}
              </tbody></table>
              </td>
              </tr>
              ))}
          </tbody></table>
          }
        </div>
      </div>
    )
  }

}
