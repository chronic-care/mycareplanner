import '../Patient.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Observation } from '../../fhir-types/fhir-r4';

interface ObservationListProps {
    history?: any,
}

interface ObservationListState {
  observations?: [Observation]
}

export class ObservationList extends React.Component<ObservationListProps, ObservationListState> {

  constructor(props: ObservationListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let observations = this.state.observations

    return (
      <div className="patient-view">
        <h3>Test Results</h3>

        <ul>
          {observations?.map((obs, idx) => (
            <li key={idx.toString()}><Link to={{
              pathname: '/observation',
              state: { observation: obs }
            }}>{obs.code.text}</Link>
            </li>))}
        </ul>
      </div>
    )
  }

}
