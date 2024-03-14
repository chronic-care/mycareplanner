import './Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData } from './data-services/models/fhirResources';
import { PatientSummary, ScreeningSummary } from './data-services/models/cqlSummary';
// import { Task } from './data-services/fhir-types/fhir-r4';
// import { BusySpinner } from './components/busy-spinner/BusySpinner';
import { CircularProgress } from '@mui/material';
import { DeterminateProgress } from './components/determinate-progress/DeterminateProgress';
import { ErrorMessage } from './components/error-message/ErrorMessage';
// import BusyGroup from './components/busy-spinner/BusyGroup';

interface HomeProps {
  fhirDataCollection?: FHIRData[],
  patientSummaries?: PatientSummary[],
  screenings?: [ScreeningSummary],
  // tasks?: [Task] | undefined,

  progressMessage: string,
  progressValue: number,
  resourcesLoadedCount: number,

  errorType: string | undefined,
  userErrorMessage: string | undefined,
  developerErrorMessage: string | undefined,
  errorCaught: Error | string | unknown,
}

interface HomeState {
}

export default class Home extends React.Component<HomeProps, HomeState> {

  constructor(props: HomeProps) {
    super(props);
    this.state = {
    };
  }

  // TODO:MULTI-PROVIDER: Update view to itterate fhirDataCollection if needed
  // TODO:MULTI-PROVIDER: Change patient name list to provider name and display single patient name at top
  public render(): JSX.Element {

    const sdsurl = process.env.REACT_APP_SHARED_DATA_ENDPOINT;
  

    let fhirDataCollection = this.props.fhirDataCollection
    let patients = this.props.patientSummaries;
    let screenings = this.props.screenings?.filter(s => s.notifyPatient);
    // let tasks = this.props.tasks;

    return (
      <div className="home-view">
        <div className="welcome">

          {
            (this.props.errorType !== 'Terminating') &&
            <>
              <h4 className="title" style={{ textAlign: 'center' }}>Welcome to My Care Planner!</h4>
              <p>My Care Planner is a tool to help you and your care team work together to keep you healthy. It is a completely personalized way to see what steps you’ve already taken and what else you can do to check for and prevent illnesses.</p>
            </>
          }

          {!fhirDataCollection || (fhirDataCollection && (fhirDataCollection[0]?.caregiverName === undefined)) ? '' :
            <p className="subheadline">Caregiver <b>{fhirDataCollection && fhirDataCollection[0]?.caregiverName}</b></p>
          }
          {(patients === undefined) ? '' :
            <div className="subheadline">
              {!fhirDataCollection || (fhirDataCollection && (fhirDataCollection[0]?.caregiverName === undefined)) ? '' : 'for '}
              {/* <b>{patient?.fullName}</b> ({patient?.gender}) Age {patient?.age} */}
              {
                (fhirDataCollection && fhirDataCollection.length > 0) &&

                  fhirDataCollection.length === 1
                  ?
                  <><b>{patients[0]?.fullName}</b> <span>(age {patients[0]?.age})</span></>
                  :
                  <ol>
                    {patients.map((curPatient, index) => {
                      // only display (unique) patients that aren't from SDS
                      // if (fhirDataCollection && (!fhirDataCollection[index].isSDS)) {
                      return (
                        <li key={index}>
                          {
                            fhirDataCollection && fhirDataCollection[index].isSDS ?
                              <><b>SDS for {curPatient?.fullName}</b> (age {curPatient?.age}) {fhirDataCollection[index].serverName} </> :
                              <><b>{curPatient?.fullName}</b> (age {curPatient?.age}) {fhirDataCollection![index].serverName} </>
                            // TODO: Consider adding an isLauncher option (need to add to datatype first)
                          }
                        </li>
                      )
                      // }
                    })}
                  </ol>
              }
            </div>
          }
        </div>

        {(fhirDataCollection === undefined)
          ? <div className="welcome">

            {
              (!this.props.userErrorMessage || (this.props.userErrorMessage && this.props.errorType !== 'Terminating')) &&
              <>
                <h6>Reading your clinical records: </h6>
                {/* // Display realtime loading data to visually determine progress: e.g. FHIR resource Query Type and Load Time */}
                <DeterminateProgress progressValue={this.props.progressValue} />
                <p>{this.props.progressMessage}...<span style={{ paddingLeft: '10px' }}><CircularProgress size="1rem" /></span></p>
                <p>Resources loaded: {this.props.resourcesLoadedCount}</p>
              </>
            }
            <ErrorMessage fhirDataCollection={this.props.fhirDataCollection}
              progressMessage={this.props.progressMessage} progressValue={this.props.progressValue}
              resourcesLoadedCount={this.props.resourcesLoadedCount}
              errorType={this.props.errorType} userErrorMessage={this.props.userErrorMessage}
              developerErrorMessage={this.props.developerErrorMessage} errorCaught={this.props.errorCaught} />

          </div>
          : <div>

            <h5 style={{ marginTop: '20px' }}>My Tasks</h5>

            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'PROMIS-29-questionnaire' }
            }} ><strong>General Health Assessment</strong></Link><br />
            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'PRAPARE-questionnaire' }
            }} ><strong>Social Support Assessment</strong></Link><br />
            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'caregiver-strain-questionnaire' }
            }} ><strong>Caregiver Strain Assessment</strong></Link><br />
            {/* <Link to={{pathname: '/questionnaire',
                      state: { patientSummary: this.props.patientSummary, questionnaireId: 'mypain-questionnaire' }
                    }} ><strong>My Pain Assessment</strong></Link><br/> */}

            <p />

            {/* {(tasks === undefined)
                ? <p>You have no tasks today!</p>
                : <ul>
                    {tasks?.map((task, idx) => (
                    <li key={idx.toString()}><Link to={{
                            pathname: '/task',
                            state: { patientSummary: this.props.patientSummary, task: task }
                        }}>{task.description}</Link>
                    </li>))}
                </ul>
            } */}

            <h5 style={{ paddingTop: '20px' }}>Preventive Care</h5>
            {(screenings !== undefined && screenings.length === 0)
              ? <p>You have no screenings due.</p>
              : <ul>
                {screenings?.map((s, idx) => (
                  <li key={idx.toString()}><Link to={{
                    pathname: '/decision',
                    state: { patientSummaries: this.props.patientSummaries, screening: s }
                  }}>{s.name}</Link>
                    <ul><li>{s.title}</li></ul>
                  </li>))}
              </ul>
            }



            <div>
             
                <p>
                  <h5 style={{ paddingTop: '20px' }}>Shared Health Records</h5>
                  <Link to={{ pathname: '/provider-login', state: { fhirDataCollection: this.props.fhirDataCollection } }}>Retrieve records from additional healthcare providers</Link>
                </p>
             
            </div>

            <div>
              {typeof sdsurl !== 'undefined' ? (
                <p>
                  <h5 style={{ paddingTop: '20px' }}>Share your health data</h5>
                  <Link to={{ pathname: '/share-data' }}>Share your health data</Link></p>
              ) : (<p></p>)}
            </div>











            <h5 style={{ paddingTop: '20px' }}>Disclaimer</h5>
            <p>This application is provided for informational purposes only and does not constitute medical advice or professional services. The information provided should not be used for diagnosing or treating a health problem or disease, and those seeking personal medical advice should consult with a licensed physician. Always seek the advice of your doctor or other qualified health provider regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this application. If you think you may have a medical emergency, call 911 or go to the nearest emergency room immediately. No physician-patient relationship is created by this application or its use. Neither OHSU, nor its employees, nor any contributor to this application, makes any representations, express or implied, with respect to the information herein or to its use.</p>
          </div>
        }
      </div>
    );
  }


}
