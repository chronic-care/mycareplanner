import '../Patient.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Condition } from '../../fhir-types/fhir-r4';

interface ConditionListProps {
    history?: any,
}

interface ConditionListState {
  conditions?: [Condition]
}

export class ConditionList extends React.Component<ConditionListProps, ConditionListState> {

  constructor(props: ConditionListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let conditions = this.state.conditions

    return (
      <div className="patient-view">
        <h3>Health Issues</h3>

        <ul>
          {conditions?.map((cond, idx) => (
            <li key={idx.toString()}><Link to={{
              pathname: '/condition',
              state: { condition: cond }
            }}>{cond.code?.text}</Link>
            </li>))}
        </ul>
      </div>
    )
  }

}
