import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Observation } from '../../fhir-types/fhir-r4';

interface ObservationListProps {
    history?: any,
}

interface ObservationListState {
  fhirData?: FHIRData
}

export class ObservationList extends React.Component<ObservationListProps, ObservationListState> {

  constructor(props: ObservationListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let observations = this.state.fhirData?.labResults

    return (
      <div className="home-view">
        <div className="welcome">
          <h4 className="title">Test Results</h4>

          <ul>
            {observations?.map((obs, idx) => (
              <li key={idx.toString()}><Link to={{
                pathname: '/observation',
                state: { observation: obs }
              }}>{obs.code.text ?? obs.code.coding![0].display}</Link>
              </li>))}
            </ul>
        </div>
      </div>
    )
  }

}
