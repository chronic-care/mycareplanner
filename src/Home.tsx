import './Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData } from './models/fhirResources';
import { PatientSummary, ScreeningSummary } from './models/cqlSummary';
import { Task } from './fhir-types/fhir-r4';
import BusySpinner from './components/busy-spinner/BusySpinner';
// import BusyGroup from './components/busy-spinner/BusyGroup';

interface HomeProps {
    fhirData?: FHIRData,
    patientSummary?: PatientSummary,
    screenings?: [ScreeningSummary],
    tasks?: [Task] | undefined
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
    let fhirData = this.props.fhirData
    let patient = this.props.patientSummary;
    let screenings = this.props.screenings?.filter(s => s.notifyPatient);
    let tasks = this.props.tasks;

    return (
      <div className="home-view">
        <div className="welcome">
            <h4 className="title">Welcome to My Care Planner!</h4>
            <p>My Care Planner is a tool to help you and your care team work together to keep you healthy. It is a completely personalized way to see what steps you’ve already taken and what else you can do to check for and prevent illnesses.</p>
            
            {(fhirData?.caregiverName === undefined) ? '' :
                <p className="subheadline">Caregiver <b>{fhirData?.caregiverName}</b></p>
            }
            {(patient === undefined) ? '' :
                <p className="subheadline">
                  {(fhirData?.caregiverName === undefined) ? '' : 'for '}
                  <b>{patient?.fullName}</b> ({patient?.gender}) Age {patient?.age}
                </p>
            }
        </div>
        {(this.props.fhirData === undefined)
            ? <div className="welcome">
                <p>Reading your clinical records...</p>
                <BusySpinner busy={this.props.fhirData === undefined} />
            </div>
        : <div>

            <h5>My Tasks</h5>
            <p>You have no tasks today!</p>

            <h5>Preventive Care</h5>
            {(screenings !== undefined && screenings.length === 0)
                ? <p>You have no screenings due!</p>
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

          <h5>Health Record</h5>
          <p>Select one of the tabs above to review your health records.</p>

          Health Goals [{this.props.fhirData?.goals?.length ?? '?'} records]<br/>
          Health Concerns [{this.props.fhirData?.conditions?.length ?? '?'}]<br/>
          Medications [{this.props.fhirData?.medications?.length ?? '?'}]<br/>
          Immunizations [{this.props.fhirData?.immunizations?.length ?? '?'}]<br/>
          Lab Results [{this.props.fhirData?.labResults?.length ?? '?'}]<br/>
          Vitals [{this.props.fhirData?.vitalSigns?.length ?? '?'}]<br/>
          Treatment Plan [{this.props.fhirData?.serviceRequests?.length ?? '?'}]<br/>

          {/*
          <Link to={{ pathname: '/goals', state: { fhirData: this.props.fhirData }}}>Health Goals </Link> 
            [{this.props.fhirData?.goals?.length ?? 0}]<br/>
          <Link to={{ pathname: '/conditions', state: { fhirData: this.props.fhirData }}}>Health Issues </Link> 
            [{this.props.fhirData?.conditions?.length ?? 0}]<br/>
          <Link to={{ pathname: '/immunizations', state: { fhirData: this.props.fhirData }}}>Immunizations </Link> 
            [{(this.props.fhirData?.immunizations?.length ?? 0)}]<br/>
          <Link to={{ pathname: '/medications', state: { fhirData: this.props.fhirData }}}>Medications </Link> 
            [{(this.props.fhirData?.medications?.length ?? 0)}]<br/>

          Care Plan Activities [{this.props.fhirData?.serviceRequests?.length ?? 0}]<br/>

          Assessment Responses [{this.props.fhirData?.surveyResults?.length ?? 0}]<br/>
          <Link to={{ pathname: '/observations', state: { fhirData: this.props.fhirData }}}>Lab Results </Link>
            [{(this.props.fhirData?.labResults?.length ?? 0)}]<br/>
          Vital Signs [{this.props.fhirData?.vitalSigns?.length ?? 0}] (last 100)<br/>
          */ }
          
          {/* {this.props.fhirData?.carePlans?.length ?? 0} Care Plans<br/> */}
          {/* {this.props.fhirData?.socialHistory?.length ?? 0} Social History<br/> */}
          {/* {this.props.fhirData?.procedures?.length ?? 0} Procedures<br/> */}
          {/* {this.props.fhirData?.diagnosticReports?.length ?? 0} Diagnostic Reports<br/> */}
          
        </div>
        }
      </div>
    );
  }


}
