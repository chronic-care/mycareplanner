import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';

interface GoalListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface GoalListState {
}

export class GoalList extends React.Component<GoalListProps, GoalListState> {

  constructor(props: GoalListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let goals = this.props.fhirData?.goals

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Health Goals</h4>

          <table><tbody>
            {goals?.map((goal, idx) => (
              <tr key={idx}>
              <td>
              <table><tbody>
                <tr><td colSpan={2}><b>{goal.description?.text}</b></td></tr>
                <tr>
                  <td>Start: {displayDate(goal.startDate)}</td>
                  {goal.target?.[0].dueDate === undefined ? '' : <td>Due: {displayDate(goal.target?.[0].dueDate)}</td>}
                </tr>
                <tr><td colSpan={2}>Author: {goal.expressedBy?.display}</td></tr>
                {goal.note?.map((note, idx) => (
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
