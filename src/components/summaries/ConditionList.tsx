import '../../Home.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData , displayDate} from '../../models/fhirResources';
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

          <table><tbody>
            {conditions?.map((cond, idx) => (
              <tr key={idx}><td>
              <table><tbody>
                <tr>
                  <td colSpan={3}><b>{cond.code?.text}</b></td>
                  {/* <td align="right"><i>Learn&nbsp;More</i></td> */}
                </tr>
                <tr><td colSpan={3}>Added on: {displayDate(cond.recordedDate) 
                        ?? displayDate(cond.onsetDateTime) ?? displayDate(cond.onsetPeriod?.start)}</td></tr>
                {cond.note?.map((note) => (
                  <tr><td colSpan={3}>Note: {note.text}</td></tr>
                ))}
              </tbody></table>
              </td></tr>
              ))}
          </tbody></table>
        </div>
      </div>
    )
  }

}
