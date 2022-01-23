import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Condition } from '../../fhir-types/fhir-r4';

interface ConditionListProps {
  history?: any,
}

interface ConditionListState {
  fhirData?: FHIRData
}

export class ConditionList extends React.Component<ConditionListProps, ConditionListState> {

  constructor(props: ConditionListProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let conditions = this.state.fhirData?.conditions

    return (
      <div className="home-view">
        <table className="menu"><tr>
          <td className="menu"><Link to='/'>Home</Link></td>
          <td className="menu"><Link to={{ pathname: '/goals', state: { fhirData: this.state.fhirData }}}>Goals</Link></td>
          <td className="menu">Health Issues</td>
          <td className="menu"><Link to={{ pathname: '/medications', state: { fhirData: this.state.fhirData }}}>Medications</Link></td>
          <td className="menu"><Link to={{ pathname: '/observations', state: { fhirData: this.state.fhirData }}}>Health Status</Link></td>
        </tr></table>

        <div className="welcome">
          <h4 className="title">Health Issues</h4>

          <table>
            {conditions?.map((cond, idx) => (
              <tr><td>{cond.code?.text}</td><td>&nbsp;</td><td><i>Learn&nbsp;More</i></td></tr>
              ))}
          </table>
        </div>
      </div>
    )
  }

}
