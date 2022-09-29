import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Tab, Tabs } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import { Task } from './data-services/fhir-types/fhir-r4';

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
import { ServiceRequestList } from "./components/summaries/ServiceRequestList";
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
    mainTabIndex: string,
    planTabIndex: string,
    statusTabIndex: string,
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
            mainTabIndex: "1",
            planTabIndex: "5",
            statusTabIndex: "9",
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
        let editFormData: EditFormData = {
            fhirData: this.state.fhirData,
            patientSummary: this.state.patientSummary
        }

        return (
            <div className="app">
                <header className="app-header">
                    {/* <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/> */}
                    <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/ecareplan-logo.png`} alt="My Care Planner" />
                    {patient === undefined ? '' : <p>&npsp;&npsp;{patient?.fullName}</p>}
                </header>

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
                        <TabContext value={this.state.mainTabIndex}>
                            <TabList onChange={(event, value) => this.setState({ mainTabIndex: value })} centered>
                                <Tab label="Home" value="1" />
                                <Tab label="Care Plan" value="2" />
                                <Tab label="Health Status" value="3" />
                                <Tab label="Team" value="4" />
                            </TabList>

                            <TabPanel value="1">
                                <Home {...this.state} />
                            </TabPanel>
                            <TabPanel value="2">
                                <TabContext value={this.state.planTabIndex}>
                                    <TabList onChange={(event, value) => this.setState({ planTabIndex: value })} centered>
                                        <Tab label="Goals" value="5" />
                                        <Tab label="Concerns" value="6" />
                                        <Tab label="Medications" value="7" />
                                        <Tab label="Activities" value="8" />
                                    </TabList>
                                    <TabPanel value="5">
                                        <GoalList {...this.state} />
                                    </TabPanel>
                                    <TabPanel value="6">
                                        <ConditionList {...this.state} />
                                    </TabPanel>
                                    <TabPanel value="7">
                                        <MedicationList {...this.state} />
                                    </TabPanel>
                                    <TabPanel value="8">
                                        <ServiceRequestList {...this.state} />
                                    </TabPanel>
                                </TabContext>
                            </TabPanel>
                            <TabPanel value="3">
                                <TabContext value={this.state.statusTabIndex}>
                                    <TabList onChange={(event, value) => this.setState({ statusTabIndex: value })} centered>
                                        <Tab label="Tests" value="9" />
                                        <Tab label="Vitals" value="10" />
                                        <Tab label="Immunization" value="11" />
                                    </TabList>
                                    <TabPanel value="9">
                                        <LabResultList {...this.state} />
                                    </TabPanel>
                                    <TabPanel value="10">
                                        <VitalsList {...this.state} />
                                    </TabPanel>
                                    {/* <TabPanel>
                                    <h4 className="title">Assessment Results</h4>
                                    <p>Coming soon...</p>
                                </TabPanel> */}
                                    <TabPanel value="11">
                                        <ImmunizationList {...this.state} />
                                    </TabPanel>
                                </TabContext>
                            </TabPanel>
                            <TabPanel value="4">
                                <CareTeamList {...this.state} />
                            </TabPanel>
                        </TabContext>
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