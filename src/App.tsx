import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import {Switch, Route } from "react-router-dom";

import Home from "./Home";
import { FHIRData } from './models/fhirResources';
import { PatientSummary, ScreeningSummary } from './models/cqlSummary';
import { getFHIRData } from './service/fhirService';
import { getPatientSummary, executeScreenings } from './service/cqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";
import { ConditionList } from "./components/summaries/ConditionList";
import { GoalList } from "./components/summaries/GoalList";
import { MedicationList } from "./components/summaries/MedicationList";
import { ObservationList } from "./components/summaries/ObservationList";
import { QuestionnaireHandler } from "./components/questionnaire/QuestionnaireHandler";
import { ConfirmationPage } from './components/confirmation-page/ConfirmationPage'
import { ErrorPage } from "./components/error-page/ErrorPage";

interface AppProps {

}

interface AppState {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
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
        })
    }

    public render(): JSX.Element {
        return (
            <div className="app">
            <header className="app-header">
                <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/>
            </header>

            <Switch>
                <Route path="/decision" component= { ScreeningDecision }/>
                <Route path="/conditions" component= { ConditionList }/>
                <Route path="/goals" component= { GoalList }/>
                <Route path="/medications" component= { MedicationList }/>
                <Route path="/observations" component= { ObservationList }/>
                <Route path="/questionnaire" component= { QuestionnaireHandler }/>
                <Route path='/confirmation' component= { ConfirmationPage } />
                <Route path="/error" component= { ErrorPage }/>

                {/* <Route path="/about" component= { Home }/> */}

                {/* If none of the previous routes render anything,
                    this route acts as a fallback. */}
                <Route path="/">
                    <Home {...this.state} />
                </Route>
            </Switch>
            </div>
        )
    }
}