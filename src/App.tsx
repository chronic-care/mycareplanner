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

interface AppProps {

}

interface AppState {
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
        return (
            <div className="app">
            <header className="app-header">
                <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/>
            </header>

            <Switch>
                <Route path="/goals">
                    <GoalList {...this.state} />
                </Route>
                <Route path="/decision" component= { ScreeningDecision } />
                <Route path="/questionnaire" component= { QuestionnaireHandler } />
                <Route path='/confirmation' component= { ConfirmationPage } />
                <Route path="/error" component= { ErrorPage } />

                <Route path="/">
                    <Tabs>
                        <TabList>
                            <Tab>Home</Tab>
                            <Tab>Goals</Tab>
                            <Tab>Concerns</Tab>
                            <Tab>Meds</Tab>
                            <Tab>More...</Tab>
                        </TabList>
                        <TabPanel>
                            <Home {...this.state} />
                        </TabPanel>
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
                            <Tabs>
                                <TabList>
                                    <Tab>Immunizations</Tab>
                                    <Tab>Lab Results</Tab>
                                    <Tab>Vitals</Tab>
                                    <Tab>Plan</Tab>
                                </TabList>
                                <TabPanel>
                                    <ImmunizationList {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <LabResultList {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <VitalsList {...this.state} />
                                </TabPanel>
                                <TabPanel>
                                    <h4 className="title">Care Plan Activities</h4>
                                    <p>Coming soon...</p>
                                </TabPanel>
                            </Tabs>
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