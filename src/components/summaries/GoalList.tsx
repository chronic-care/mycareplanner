import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, GoalSummary } from '../../models/cqlSummary';
import { getGoalSummary } from '../../service/mccCqlService';

interface GoalListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary
}

interface GoalListState {
  goalSummary?: GoalSummary[]
}

export class GoalList extends React.Component<GoalListProps, GoalListState> {

  constructor(props: GoalListProps) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    console.time('getGoalSummary()')
    this.setState({ goalSummary: getGoalSummary(this.props.fhirData) })
    console.timeEnd('getGoalSummary()')
  }

  public render(): JSX.Element {
    let goals = this.state.goalSummary

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Health Goals</h4>

          {goals === undefined || goals?.length === 0 ? <p>No records found.</p> :
          <table><tbody>
            {goals?.map((goal, idx) => (
              <tr key={idx}>
              <td>
              <table>
                <tbody>
                <tr>
                  <td colSpan={2}><b>{goal.Description}</b></td>
                </tr>
                <tr>
                  <td>{goal.ExpressedBy}</td>
                  <td>Start: {displayDate(goal.StartDate)}</td>
                </tr>
                </tbody>

                {goal.Target?.map((target, idx) => (
                <tbody>
                  {(target.DueDate === null && target.TargetValue === null) ? <tr key={idx}/> :
                    <tr key={idx}>
                      <td>{target.TargetValue === null ? '' : 'Target: ' + target.TargetValue}</td>
                      <td>{target.DueDate === null ? '' : 'Due: ' + displayDate(target?.DueDate)}</td>
                    </tr>}

                  {(target.LastResult === null) ? <tr key={idx}/> :
                    <tr key={idx}>
                      <td colSpan={2}>Last Value: {target.LastResult?.ResultText ?? '?'} on {displayDate(target.LastResult?.Date)}</td>
                    </tr>}
                </tbody>
                ))}

                <tbody>
                {goal.LearnMore === null ? <tr/> :
                  <tr><td colSpan={2}><Link to="route" target="_blank" onClick={(event) => {event.preventDefault(); window.open(goal.LearnMore);}}><i>Learn&nbsp;More</i></Link></td></tr>}
                {goal.Notes?.map((note, idx) => (
                  <tr key={idx}><td colSpan={2}>Note: {note}</td></tr>
                ))}
               </tbody>
              </table>
              
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
