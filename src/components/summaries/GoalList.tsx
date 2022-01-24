import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Goal } from '../../fhir-types/fhir-r4';
import { First } from 'react-bootstrap/esm/PageItem';

interface GoalListProps {
  history?: any,
}

interface GoalListState {
  fhirData?: FHIRData
}

export class GoalList extends React.Component<GoalListProps, GoalListState> {

  constructor(props: GoalListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let goals = this.state.fhirData?.goals

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Health Goals</h4>

          <table>
            {goals?.map((goal, idx) => (
              <tr>
              <td>
              <table>
                <tr><td colSpan={2}>{goal.description?.text}</td></tr>
                <tr><td>Start: {goal.startDate}</td><td>Due: {goal.target?.[0].dueDate}</td></tr>
                <tr><td colSpan={2}>Author: {goal.expressedBy?.display}</td></tr>
                {goal.note?.map((note, idx) => (
                  <tr><td colSpan={2}>Note: {note.text}</td></tr>
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
