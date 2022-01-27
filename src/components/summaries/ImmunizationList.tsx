import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Immunization } from '../../fhir-types/fhir-r4';

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

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Immunizations</h4>

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
