import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Condition } from '../../fhir-types/fhir-r4';

interface ConditionListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface ConditionListState {
}

export class ConditionList extends React.Component<ConditionListProps, ConditionListState> {

  constructor(props: ConditionListProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let conditions = this.props.fhirData?.conditions

    return (
      <div className="home-view">
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
