import './Home.css';
import React from 'react';
import { Link } from "react-router-dom";
import { FHIRData } from './data-services/models/fhirResources';
import { PatientSummary, ScreeningSummary } from './data-services/models/cqlSummary';
// import { Task } from './data-services/fhir-types/fhir-r4';
// import { BusySpinner } from './components/busy-spinner/BusySpinner';
//import { styled } from '@mui/material';
import { Button, CircularProgress } from '@mui/material';
import { DeterminateProgress } from './components/determinate-progress/DeterminateProgress';
import { ErrorMessage } from './components/error-message/ErrorMessage';
import Modal from './components/modal/modal';
import { deleteAllDataFromLocalForage } from './data-services/persistenceService';
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
  canShareData?: boolean,
  isLogout: boolean,
}

interface HomeState {
  isModalVisible: boolean;
  isLogout: boolean;
  isLoggedOut: boolean;
}

const IS_DISPLAY_SDS_IN_ENDPOINT_CONNECTION_LIST: boolean = false

export default class Home extends React.Component<HomeProps, HomeState> {

  constructor(props: HomeProps) {
    super(props);
    this.state = {
      // isModalVisible: true
      isModalVisible: !sessionStorage.getItem('hasSeenModal'),
      isLogout: this.props.isLogout,
      isLoggedOut: false,
    };
    console.log('Initial isModalVisible:', this.state.isModalVisible);
  }

  closeModal = () => {
    // Set isModalVisible to true when the user clicks the X button
    console.log("closing modal here ....", this.state.isModalVisible)
    this.setState({ isModalVisible: false });
  };

  handleLogout = async () => {
    if (!this.state.isLogout) {
      this.setState({ isLogout: true });
      sessionStorage.clear();
      await deleteAllDataFromLocalForage();
      this.setState({ isLoggedOut: true });
    }
  };

  // TODO:MULTI-PROVIDER: Update view to itterate fhirDataCollection if needed
  // TODO:MULTI-PROVIDER: Change patient name list to provider name and display single patient name at top
  public render(): JSX.Element {

    //const sdsurl = process.env.REACT_APP_SHARED_DATA_ENDPOINT


    let fhirDataCollection = this.props.fhirDataCollection
    let patients = this.props.patientSummaries
    let screenings = this.props.screenings?.filter(s => s.notifyPatient)
    // let tasks = this.props.tasks;

    const hhsBanner = process.env.REACT_APP_HHS_BANNER === 'true'

    const unshare = process.env.REACT_APP_UNSHARE === 'true'

    const toupp = process.env.REACT_APP_TOUPP_URL
  
    return (
      <div className="home-view">
        {hhsBanner && (<Modal isVisible={this.state.isModalVisible} closeModal={this.closeModal} />)}
        <div className="welcome">
          {
            (this.props.errorType !== 'Terminating') &&
            <>
              <h4 className="title" style={{ textAlign: 'center' }}>Welcome to My Care Planner!</h4>        
              {(toupp) ? <a  style={{ textAlign: 'center' }} href={toupp}  target="_blank" rel="noopener noreferrer" >Terms of Use and Privacy Policy</a> : ''}
              <p>My Care Planner is a tool to help you and your care team work together to keep you healthy. It is a completely personalized way to see what steps you’ve already taken and what else you can do to check for and prevent illnesses.</p>
            </>
          }
          {!fhirDataCollection || (fhirDataCollection && (fhirDataCollection[0]?.caregiverName === undefined)) ? '' :
            <p className="subheadline">Caregiver <b>{fhirDataCollection && fhirDataCollection[0]?.caregiverName}</b></p>
          }
          {(!patients) ? '' :
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
                      // TODO: Consider adding an isLauncher option to identify launcher vs SDS (need to add to datatype first)

                      const fhirDataAtIndex = fhirDataCollection && fhirDataCollection[index]
                      const isSDS = fhirDataAtIndex?.isSDS

                      if (!IS_DISPLAY_SDS_IN_ENDPOINT_CONNECTION_LIST && fhirDataAtIndex && isSDS) {
                        // Log SDS info with index for debugging
                        console.log(`SDS for ${curPatient?.fullName} ${fhirDataAtIndex.serverName} at index ${index}`)
                        // Ensures no <li> is rendered for SDS when the flag is false
                        return null
                      }

                      return (
                        <li key={index}>
                          {
                            fhirDataAtIndex && (
                              isSDS
                                ? (
                                  IS_DISPLAY_SDS_IN_ENDPOINT_CONNECTION_LIST &&
                                  <>
                                    <b>SDS for {curPatient?.fullName}</b> {fhirDataAtIndex.serverName}
                                  </>
                                )
                                : (
                                  <>
                                    <b>{curPatient?.fullName}</b> (age {curPatient?.age}) {fhirDataAtIndex.serverName}
                                  </>
                                )
                            )
                          }
                        </li>
                      )
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

              <Link to="/logout" onClick={this.handleLogout} style={{ textDecoration: 'none', display: 'block' }}>
              <Button
                variant="contained"
                color="primary"
                style={{ width: '100%', padding: '15px', fontSize: '16px' }}
              >
                LOG OUT
              </Button>
            </Link>
          </div>
          : <div>

            <h5 style={{ marginTop: '20px' }}>My Tasks</h5>

            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'PROMIS-29-questionnaire' }
            }} ><strong>General Health Assessment</strong></Link><br />
            {/* <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'PRAPARE-questionnaire' }
            }} ><strong>Social Support Assessment</strong></Link><br /> */}
            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'AHC-questionnaire' }
            }} ><strong>Health-Related Social Needs</strong></Link><br />
            <Link to={{
              pathname: '/questionnaire',
              state: { patientSummaries: this.props.patientSummaries, questionnaireId: 'caregiver-strain-questionnaire' }
            }} ><strong>Caregiver Strain Assessment</strong></Link><br />

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

                <div>
                  <h5 style={{ paddingTop: '20px' }}>Add a health record account</h5>
                  <Link to={{ pathname: '/provider-login', state: { fhirDataCollection: this.props.fhirDataCollection } }}>Login to additional healthcare provider accounts</Link>
                </div>

            </div>
            <div>
            { this.props.canShareData  ? (
                <div>
                  <h5 style={{ paddingTop: '20px' }}>Share your health data</h5>
                  <Link to={{ pathname: '/share-data' }}>Share your health data</Link></div>
                ) : (<p></p>)}
            </div>


            <div>
              { this.props.canShareData  && unshare ? (
                <div>
                  <h5 style={{ paddingTop: '20px' }}>Withdraw your health data</h5>
                  <Link to={{ pathname: '/unshare-data' }}>Opt out of sharing your health data</Link></div>
              ) : (<p></p>)}
            </div>


            <h5 style={{ paddingTop: '20px' }}>Disclaimer</h5>
            <p>This application is provided for informational purposes only and does not constitute medical advice or professional services. The information provided should not be used for diagnosing or treating a health problem or disease, and those seeking personal medical advice should consult with a licensed physician. Always seek the advice of your doctor or other qualified health provider regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read in this application. If you think you may have a medical emergency, call 911 or go to the nearest emergency room immediately. No physician-patient relationship is created by this application or its use. Neither OHSU, nor its employees, nor any contributor to this application, makes any representations, express or implied, with respect to the information herein or to its use.</p>
            <br></br>
            <Link to="/logout" onClick={this.handleLogout} style={{ textDecoration: 'none', display: 'block' }}>
              <Button
                variant="contained"
                color="primary"
                style={{ width: '100%', padding: '15px', fontSize: '16px' }}
              >
                LOG OUT
              </Button>
            </Link>
          </div>
        }
      </div>
    );
  }


}
