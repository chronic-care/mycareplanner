import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, hasScope , displayDate} from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary, ConditionSummary } from '../../models/cqlSummary';
import { getConditionSummary } from '../../service/mccCqlService';

interface ConditionListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface ConditionListState {
  conditionsSummary?: [ConditionSummary]
}

export class ConditionList extends React.Component<ConditionListProps, ConditionListState> {

  constructor(props: ConditionListProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    console.time('getConditionSummary()')
    this.setState({ conditionsSummary: getConditionSummary(this.props.fhirData) })
    console.timeEnd('getConditionSummary()')
  }

  public render(): JSX.Element {
    let conditions = this.state.conditionsSummary

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Current Health Issues</h4>
          {hasScope(this.props.fhirData?.clientScope, 'Goal.write') 
            ? <p><Link to={{ pathname: '/condition-edit', state: { fhirData: this.props.fhirData }}}>Add a Health Concern</Link></p>
            : <p/>} 

          {conditions === undefined ? <p>No records found.</p> :
          <table><tbody>
            {conditions?.map((cond, idx) => (
              <tr key={idx}><td>
              <table><tbody>
                <tr>
                  <td colSpan={4}><b>{cond.ConceptName}</b></td>
                </tr>
                <tr>
                  <td colSpan={3}>Author: {cond.Recorder ?? cond.Asserter ?? 'Unknown'}</td>
                  <td align="right">{cond.LearnMore === undefined || cond.LearnMore === null ? '' :
                    <Link to="route" target="_blank" onClick={(event) => {event.preventDefault(); window.open(cond.LearnMore);}}><i>Learn&nbsp;More</i></Link>}</td>
                </tr>
                  {(cond.RecordedDate === null && cond.AssertedDate === null) ? <tr/> :
                    <tr>
                      <td colSpan={2}>{cond.RecordedDate === null ? '' : 'Recorded: ' + displayDate(cond.RecordedDate)}</td>
                      <td colSpan={2}>{cond.AssertedDate === null ? '' : 'Asserted: ' + displayDate(cond.AssertedDate)}</td>
                    </tr>}
                <tr>
                  <td colSpan={4}>{cond.OnsetDate === null ? '' : 'When it started: ' + displayDate(cond.OnsetDate)}</td>
                </tr>
                {cond.Notes?.map((note) => (
                  <tr><td colSpan={4}>Note: {note}</td></tr>
                ))}
              </tbody></table>
              </td></tr>
              ))}
          </tbody></table>
          }
        </div>
      </div>
    )
  }

}
