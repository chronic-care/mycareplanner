import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import { Task } from './fhir-types/fhir-r4';

import Home from "./Home";
import { FHIRData } from './models/fhirResources';
import { PatientSummary, ScreeningSummary } from './models/cqlSummary';
import { getFHIRData } from './service/fhirService';
import { getPatientSummary, executeScreenings } from './service/cqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";
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
  ErrorMessage?: string
}

export default class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            mainTabIndex: 0,
            planTabIndex: 0,
            statusTabIndex: 0,
            fhirData: undefined,
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

    public render(): JSX.Element {
        let patient = this.state.patientSummary;

        return (
            <div className="app">
            <header className="app-header">
                {/* <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/> */}
                <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/ecareplan-logo.png`} alt="My Care Planner"/>
                {patient === undefined ? '' : <p>&npsp;&npsp;{patient?.fullName}</p>}
            </header>

            <Switch>
                <Route path="/goals">
                    <GoalList {...this.state} />
                </Route>
                <Route path="/condition-edit" component= { ConditionEditForm } />
                {/* <Route path="/goal-edit" component= { GoalEditForm } /> */}
                <Route path="/goal-edit">
                    <GoalEditForm />
                </Route>

                <Route path="/decision" component= { ScreeningDecision } />
                <Route path="/questionnaire" component= { QuestionnaireHandler } />
                <Route path='/confirmation' component= { ConfirmationPage } />
                <Route path="/error" component= { ErrorPage } />

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
                                    <h4 className="title">Care Plan Tasks</h4>
                                    <p>Coming soon...</p>
                                </TabPanel>
                            </Tabs>
                        </TabPanel>
                        <TabPanel>
                            <Tabs selectedIndex={this.state.statusTabIndex} onSelect={(index) => this.setState({ statusTabIndex: index })}>
                                <TabList>
                                    <Tab>Tests</Tab>
                                    <Tab>Vitals</Tab>
                                    <Tab>Assessment</Tab>
                                    <Tab>Immunization</Tab>
                                </TabList>
                                <TabPanel>
                                    <LabResultList {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <VitalsList {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <h4 className="title">Assessment Results</h4>
                                    <p>Coming soon...</p>
                                </TabPanel>
                                <TabPanel>
                                    <ImmunizationList {...this.state} />
                                </TabPanel>
                            </Tabs>
                        </TabPanel>
                        <TabPanel>
                            <h4 className="title">Care Team</h4>
                            <p>Coming soon...</p>
                        </TabPanel>
                    </Tabs>
                </Route> 
            </Switch>

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