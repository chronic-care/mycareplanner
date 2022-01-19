import './Patient.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { PatientSummary, ScreeningSummary } from '../../models/cqlSummary';
import { Questionnaire } from '../../fhir-types/fhir-r4';

interface ScreeningDecisionProps {
    history?: any,
}

interface ScreeningDecisionState {
  patientSummary?: PatientSummary,
  screening?: ScreeningSummary,
  questionnaire?: Questionnaire
}

export class ScreeningDecision extends React.Component<ScreeningDecisionProps, ScreeningDecisionState> {

  constructor(props: ScreeningDecisionProps) {
    super(props);
    this.state = {
      ...this.props.history.location.state
    };
  }

  public render(): JSX.Element {
    let patient = this.state.patientSummary
    let screening = this.state.screening

    return (
      <div className="patient-view">
        <h3>Get Ready for Your Visit</h3>
        <h4>{screening?.title}</h4>
        <p/>
        <h5>Your Information</h5>
        {screening?.information.map((info, idx) => 
          <p key={idx.toString()}>{info}</p>
        )}
        
        <h5>The Decision</h5>
        {screening?.decision.map((info, idx) => 
          <p key={idx.toString()}>{info}</p>
        )}

        <h5>Your Recommendations</h5>
        {screening?.recommendation.map((info, idx) => 
          <p key={idx.toString()}>{info}</p>
        )}
        
        {screening?.recommendScreening === true  ?
          <div>
          <p>Review the information on the next couple of pages. 
          Then answer a few questions. This will help you and {patient?.pcpName} prepare to decide what 
          is right for you at your next visit.</p>

          <Link to={{pathname: '/questionnaire', 
                      state: { patientSummary: this.state.patientSummary, questionnaireId: screening?.questionnaire }
                    }} className='btn btn-primary plan-button'><strong>Make Your Care Plan</strong></Link>
          </div>
          :
          <div>
            <Link className='btn btn-primary plan-button' to='/'>Return to Home</Link>
          </div>
        }
      </div>
    )
  }

}
