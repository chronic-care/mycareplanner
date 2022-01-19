import './Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData } from './models/fhirResources';
import { PatientSummary, ScreeningSummary } from './models/cqlSummary';
import BusySpinner from './components/busy-spinner/BusySpinner';
// import BusyGroup from './components/busy-spinner/BusyGroup';

interface HomeProps {
    fhirData?: FHIRData,
    patientSummary?: PatientSummary,
    screenings?: [ScreeningSummary]
}

interface HomeState {
    
}

export default class Home extends React.Component<HomeProps, HomeState> {

  constructor(props: HomeProps) {
    super(props);
    this.state = {
    };
  }

  public render(): JSX.Element {
    let patient = this.props.patientSummary;
    let screenings = this.props.screenings?.filter(s => s.notifyPatient);

    return (
      <div className="home-view">
        <div className="welcome">
            <h4 className="title">Welcome to My Care Planner!</h4>
            <p>My Care Planner is a tool to help you and your care team work together to keep you healthy. It is a completely personalized way to see what steps you’ve already taken and what else you can do to check for and prevent illnesses.</p>
            <p>My Care Planner doesn’t just tell you what <i>people</i> should do to stay healthy – it is all about what <i>you</i> need to stay healthy.</p>
            {(patient === undefined) ? '' :
                <p className="subheadline">Recommendations for<br/><b>{patient?.fullName}</b> ({patient?.gender}) Age {patient?.age}</p>
            }
        </div>
        {(this.props.fhirData === undefined)
            ? <div className="welcome">
                <p>Reading your clinical records...</p>
                <BusySpinner busy={this.props.fhirData === undefined} />
            </div>
        : <div>

            <h5>My Tasks</h5>
            {(screenings !== undefined && screenings.length === 0)
                ? <p>You have no tasks today!</p>
                : <ul>
                    {screenings?.map((s, idx) => (
                    <li key={idx.toString()}><Link to={{
                            pathname: '/decision', 
                            state: { patientSummary: this.props.patientSummary, screening: s }
                        }}>{s.name}</Link>
                        <ul><li>{s.title}</li></ul>
                    </li>))}
                </ul>
            }

          <h5>My Clinical Data</h5>
          <ul>
          <li>{this.props.fhirData?.carePlans?.length ?? 0} Care Plans</li>
          <li>{this.props.fhirData?.goals?.length ?? 0} Health Goals</li>
          <li><Link to={{ pathname: '/conditions', state: { conditions: this.props.fhirData.conditions }
            }}>{(this.props.fhirData?.conditions?.length ?? 0) + ' Health Issues'}</Link>
          </li>
          <li>{this.props.fhirData?.medications?.length ?? 0} Medications (active, 5 years)</li>
          <li>{this.props.fhirData?.serviceRequests?.length ?? 0} Service Requests (active, 5 years)</li>
          <li>{this.props.fhirData?.immunizations?.length ?? 0} Immunizations</li>
          <li>{this.props.fhirData?.procedures?.length ?? 0} Procedures</li>
          <li>{this.props.fhirData?.diagnosticReports?.length ?? 0} Diagnostic Reports</li>
          <li>{this.props.fhirData?.vitalSigns?.length ?? 0} Vital Signs (1 year)</li>
          <li><Link to={{ pathname: '/observations', state: { observations: this.props.fhirData.labResults }
            }}>{(this.props.fhirData?.labResults?.length ?? 0) + ' Lab Results'}</Link>
          </li>
          <li>{this.props.fhirData?.socialHistory?.length ?? 0} Social History</li>
          <li>{this.props.fhirData?.surveyResults?.length ?? 0} Survey Results</li>
          </ul>
        </div>
        }
      </div>
    );
  }


}
