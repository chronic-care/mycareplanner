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
  goalSummary?: [GoalSummary]
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

          <table><tbody>
            {goals?.map((goal, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr>
                  <td colSpan={3}><b>{goal.Description}</b></td>
                  <td align="right">{goal.LearnMore === null ? '' :
                    <Link to="route" target="_blank" onClick={(event) => {event.preventDefault(); window.open(goal.LearnMore);}}><i>Learn&nbsp;More</i></Link>}</td>
                </tr>
                <tr>
                  <td colSpan={2}>Start: {displayDate(goal.StartDate)}</td>
                  <td colSpan={2}>{goal.Target === null || goal.Target?.[0]?.DueDate === null ? '' : 'Due: ' + displayDate(goal.Target?.[0]?.DueDate)}</td>
                </tr>
                <tr><td colSpan={4}>Author: {goal.ExpressedBy}</td></tr>
                {goal.Notes?.map((note, idx) => (
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
