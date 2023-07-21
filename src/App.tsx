import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import { Task } from 'fhir/r4';

import Home from "./Home";
import { FHIRData } from './data-services/models/fhirResources';
import { PatientSummary, ScreeningSummary, EditFormData } from './data-services/models/cqlSummary';
import { getFHIRData } from './data-services/fhirService';
import { getPatientSummary, executeScreenings } from './data-services/mpcCqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";
import { CareTeamList } from "./components/summaries/CareTeamList";
import { ConditionList } from "./components/summaries/ConditionList";
import { GoalList } from "./components/summaries/GoalList";
import { ImmunizationList } from "./components/summaries/ImmunizationList";
import { MedicationList } from "./components/summaries/MedicationList";
import { LabResultList } from "./components/summaries/LabResultList";
import { VitalsList } from "./components/summaries/VitalsList";
import { QuestionnaireHandler } from "./components/questionnaire/QuestionnaireHandler";
import { ConfirmationPage } from './components/confirmation-page/ConfirmationPage'
import { ErrorPage } from "./components/error-page/ErrorPage";

import ConditionEditForm from './components/edit-forms/ConditionEditForm';
import GoalEditForm from './components/edit-forms/GoalEditForm';
import SessionTimeOutHandler from './components/session-timeout/SessionTimeoutHandler';
import SessionExpiredHandler from './components/session-timeout/SessionExpiredHandler';

interface AppProps {

}

interface AppState {
    mainTabIndex: number,
    planTabIndex: number,
    statusTabIndex: number,
    fhirData?: FHIRData,
    patientSummary?: PatientSummary,
    screenings?: [ScreeningSummary],
    tasks?: [Task],
    ErrorMessage?: string,
    isActiveSession: boolean,
    isLogout: boolean,
}

export default class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            mainTabIndex: 0,
            planTabIndex: 0,
            statusTabIndex: 0,
            fhirData: undefined,
            isActiveSession: true,
            isLogout: false,
        }
    }

    componentDidMount() {
        getFHIRData().then((data: FHIRData) => {
            this.setState({ fhirData: data })
            this.setState({ patientSummary: getPatientSummary(data) })
            this.setState({ screenings: executeScreenings(data) })
            this.setState({ tasks: undefined })
        })
    }

    private handleLogout = () => {
        this.setState({ isLogout: true })
        sessionStorage.clear();
    }

    public render(): JSX.Element {
        let patient = this.state.patientSummary;
        let editFormData: EditFormData = {
            fhirData: this.state.fhirData,
            patientSummary: this.state.patientSummary
        }

        return (
            <div className="app">
                <SessionExpiredHandler
                    onLogout={this.handleLogout}
                    isLoggedOut={this.state.isLogout}
                />

                <SessionTimeOutHandler
                    onActive={() => { this.setState({ isActiveSession: true }) }}
                    onIdle={() => { this.setState({ isActiveSession: false }) }}
                    onLogout={this.handleLogout}
                    isLoggedOut={this.state.isLogout}
                    timeOutInterval={+process.env.REACT_APP_CLIENT_IDLE_TIMEOUT!}
                />
                <header className="app-header">
                    {/* <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/> */}
                    <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/ecareplan-logo.png`} alt="My Care Planner" />
                    {patient === undefined ? '' : <p>{patient?.fullName}</p>}
                    {this.state.isLogout ? <p className="app-header-right-text logout">Logged out</p> : this.state.isActiveSession ? <p className="app-header-right-text active">Active</p> : <p className="app-header-right-text inactive">Idle</p>}
                </header>

                {this.state.isLogout ? <div>Your session has expired, please login again using meld dashboard</div> : (
                    <Switch>
                        <Route path="/goals">
                            <GoalList {...this.state} />
                        </Route>
                        <Route path="/condition-edit">
                            <ConditionEditForm {...editFormData} />
                        </Route>
                        <Route path="/goal-edit">
                            <GoalEditForm {...editFormData} />
                        </Route>

                        <Route path="/decision" component={ScreeningDecision} />
                        <Route path="/questionnaire" component={QuestionnaireHandler} />
                        <Route path='/confirmation' component={ConfirmationPage} />
                        <Route path="/error" component={ErrorPage} />

                        <Route path="/">
                            <Tabs selectedIndex={this.state.mainTabIndex} onSelect={(index) => this.setState({ mainTabIndex: index })}>
                                <TabList>
                                    <Tab>Home</Tab>
                                    <Tab>Care Plan</Tab>
                                    <Tab>Health Status</Tab>
                                    <Tab>Team</Tab>
                                </TabList>

                                <TabPanel>
                                    <Home {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <Tabs selectedIndex={this.state.planTabIndex} onSelect={(index) => this.setState({ planTabIndex: index })}>
                                        <TabList>
                                            <Tab>Goals</Tab>
                                            <Tab>Concerns</Tab>
                                            <Tab>Medications</Tab>
                                            <Tab>Activities</Tab>
                                        </TabList>
                                        <TabPanel>
                                            <GoalList {...this.state} />
                                        </TabPanel>
                                        <TabPanel>
                                            <ConditionList {...this.state} />
                                        </TabPanel>
                                        <TabPanel>
                                            <MedicationList {...this.state} />
                                        </TabPanel>
                                        <TabPanel>
                                            <h4 className="title">Planned Activities (Interventions)</h4>
                                            <p>Coming soon...</p>
                                        </TabPanel>
                                    </Tabs>
                                </TabPanel>
                                <TabPanel>
                                    <Tabs selectedIndex={this.state.statusTabIndex} onSelect={(index) => this.setState({ statusTabIndex: index })}>
                                        <TabList>
                                            <Tab>Tests</Tab>
                                            <Tab>Vitals</Tab>
                                            {/* <Tab>Assessment</Tab> */}
                                            <Tab>Immunization</Tab>
                                        </TabList>
                                        <TabPanel>
                                            <LabResultList {...this.state} />
                                        </TabPanel>
                                        <TabPanel>
                                            <VitalsList {...this.state} />
                                        </TabPanel>
                                        {/* <TabPanel>
                                    <h4 className="title">Assessment Results</h4>
                                    <p>Coming soon...</p>
                                </TabPanel> */}
                                        <TabPanel>
                                            <ImmunizationList {...this.state} />
                                        </TabPanel>
                                    </Tabs>
                                </TabPanel>
                                <TabPanel>
                                    <CareTeamList {...this.state} />
                                </TabPanel>
                            </Tabs>
                        </Route>
                    </Switch>
                )}


                {/* 
            <Switch>
                <Route path="/decision" component= { ScreeningDecision }/>
                <Route path="/conditions" component= { ConditionList }/>
                <Route path="/goals" component= { GoalList }/>
                <Route path="/immunizations" component= { ImmunizationList }/>
                <Route path="/medications" component= { MedicationList }/>
                <Route path="/observations" component= { ObservationList }/>
                <Route path="/questionnaire" component= { QuestionnaireHandler }/>
                <Route path='/confirmation' component= { ConfirmationPage } />
                <Route path="/error" component= { ErrorPage }/>

                <Route path="/">
                    <Home {...this.state} />
                </Route> 
            </Switch>
            */}

            </div>
        )
    }
}