import '../../Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate, displayValue } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary, ObservationSummary } from '../../models/cqlSummary';
import { getLabResultSummary } from '../../service/mccCqlService';

interface LabResultListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface LabResultListState {
  labResultSummary?: [ObservationSummary]
}

export class LabResultList extends React.Component<LabResultListProps, LabResultListState> {

  constructor(props: LabResultListProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    console.time('getLabResultSummary()')
    this.setState({ labResultSummary: getLabResultSummary(this.props.fhirData) })
    console.timeEnd('getLabResultSummary()')
  }

  public render(): JSX.Element {
    let observations = this.state.labResultSummary

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Lab Results</h4>

            <table><tbody>
            {observations?.map((obs, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr>
                  <td colSpan={3}><b>{obs.DisplayName}</b></td>
                  <td align="right">{obs.LearnMore === undefined ? '' :
                    <Link to="route" target="_blank" onClick={(event) => {event.preventDefault(); window.open(obs.LearnMore);}}><i>Learn&nbsp;More</i></Link>}</td>
                </tr>
                <tr>
                  <td colSpan={2} align="left">{obs.ResultText}</td>
                  <td colSpan={2} align="right">{displayDate(obs.Date)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>{obs.ReferenceRange === null ? '' : 'Range: ' + obs.ReferenceRange}</td>
                  <td align="right">{obs.Interpretation}</td>
                </tr>
                {/* {obs.Notes?.map((note, idx) => (
                  <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
                ))} */}
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
