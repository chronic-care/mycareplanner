import '../../Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate, displayValue } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary, ObservationSummary } from '../../models/cqlSummary';
import { getVitalSignSummary } from '../../service/mccCqlService';

interface VitalsListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface VitalsListState {
  vitalSignSummary?: ObservationSummary[]
}

export class VitalsList extends React.Component<VitalsListProps, VitalsListState> {

  constructor(props: VitalsListProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    console.time('getVitalSignSummary()')
    this.setState({ vitalSignSummary: getVitalSignSummary(this.props.fhirData) })
    console.timeEnd('getVitalSignSummary()')
  }

  public render(): JSX.Element {
    let observations = this.state.vitalSignSummary

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Vitals</h4>

            {observations === undefined || observations?.length === 0 ? <p>No records found.</p> :
            <table><tbody>
            {observations?.map((obs, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr>
                  <td colSpan={2}><b>{obs.DisplayName}</b></td>
                </tr>
                <tr>
                  <td colSpan={1} align="left">{obs.ResultText}</td>
                  <td colSpan={1} align="right">{displayDate(obs.Date)}</td>
                </tr>
                <tr><td colSpan={2}>Performed by: {obs.Performer ?? 'Unknown'}</td></tr>
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
