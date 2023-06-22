import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Tab, Box, Paper } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import { Task } from './data-services/fhir-types/fhir-r4';

import HomeIcon from '@mui/icons-material/Home';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PeopleIcon from '@mui/icons-material/People';

import Home from "./Home";

import { FHIRData } from './data-services/models/fhirResources';
import { PatientSummary, ScreeningSummary, EditFormData } from './data-services/models/cqlSummary';
import { getFHIRData } from './data-services/fhirService';
import { getPatientSummary, executeScreenings } from './data-services/mpcCqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";

import { GoalSummary, ConditionSummary, MedicationSummary, ObservationSummary } from './data-services/models/cqlSummary';
import { getGoalSummary, getLabResultSummary, getConditionSummary, getMedicationSummary, getVitalSignSummary } from './data-services/mccCqlService';

import { GoalList } from "./components/summaries/GoalList";
import { ConditionList } from "./components/summaries/ConditionList";
import { MedicationList } from "./components/summaries/MedicationList";
import { LabResultList } from "./components/summaries/LabResultList";
import { VitalsList } from "./components/summaries/VitalsList";

import { CareTeamList } from "./components/summaries/CareTeamList";
import { ImmunizationList } from "./components/summaries/ImmunizationList";
import { ServiceRequestList } from "./components/summaries/ServiceRequestList";

import { QuestionnaireHandler } from "./components/questionnaire/QuestionnaireHandler";
import { ConfirmationPage } from './components/confirmation-page/ConfirmationPage'
import { ErrorPage } from "./components/error-page/ErrorPage";

import ConditionEditForm from './components/edit-forms/ConditionEditForm';
import GoalEditForm from './components/edit-forms/GoalEditForm';
import ProviderLogin from "./components/shared-data/ProviderLogin";
import ShareData from "./components/shared-data/ShareData";
import SharedDataSummary from "./components/shared-data/SharedDataSummary";

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

    progressMessage: string,
    progressValue: number,
    resourcesLoadedCount: number

    errorType: string | undefined,
    userErrorMessage: string | undefined,
    developerErrorMessage: string | undefined,
    errorCaught: Error | string | unknown,

    goalSummary?: [GoalSummary],
    conditionSummary?: [ConditionSummary],
    medicationSummary?: [MedicationSummary],
    labResultSummary?: [ObservationSummary],
    vitalSignSummary?: [ObservationSummary],
}

type SummaryFunctionType = (fhirData?: FHIRData) => [GoalSummary] | [ConditionSummary] | [ObservationSummary] | [MedicationSummary] | undefined

// TODO: Convert this to a hook based function component so it easier to profile for performance, analyze, and integrate
export default class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            mainTabIndex: "1",
            planTabIndex: "5",
            statusTabIndex: "9",
            fhirData: undefined,

            progressMessage: "Initializing",
            progressValue: 0,
            resourcesLoadedCount: 0,

            errorType: undefined,
            userErrorMessage: undefined,
            developerErrorMessage: undefined,
            errorCaught: undefined,

            goalSummary: [{ Description: 'init' }],
            conditionSummary: [{ ConceptName: 'init' }],
            medicationSummary: [{ ConceptName: 'init' }],
            labResultSummary: [{ ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }],
            vitalSignSummary: [{ ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }]
        }
    }

    async componentDidMount() {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("App.tsx componentDidMount()")
        if (process.env.REACT_APP_READY_FHIR_ON_APP_MOUNT === 'true') {
            try {
                console.log("getting and setting fhirData state in componentDidMount")
                let data = await getFHIRData(false, null, this.setAndLogProgressState,
                    this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                this.setFhirDataStates(data)
            } catch (err) {
                this.setAndLogErrorMessageState('Terminating',
                    process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT ?
                        process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT : 'undefined',
                    'Failure in getFHIRData called from App.tsx componentDidMount.', err)
            }
        }
    }

    async componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<AppState>, snapshot?: any): Promise<void> {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("App.tsx componentDidUpdate()")
        this.setSummaries(prevState)
    }

    setSummaries = async (prevState: Readonly<AppState>): Promise<void> => {
        // Warning: Don't call anything else in this function w/o a very limited condition!
        // Check if fhirData changed and if so update state (like useEffect with fhirData as the dependency)
        if (this.state.fhirData && (this.state.fhirData !== prevState.fhirData)) {
            // new fhirData is loaded now
            process.env.REACT_APP_DEBUG_LOG === "true" && console.log("this.state.fhirData !== prevState.fhirData")

            // Dyanmic version:
            await this.setSummary('getGoalSummary()', 'goalSummary', getGoalSummary);
            await this.setSummary('getConditionSummary()', 'conditionSummary', getConditionSummary)
            await this.setSummary('getMedicationSummary()', 'medicationSummary', getMedicationSummary)
            await this.setSummary('getLabResultSummary()', 'labResultSummary', getLabResultSummary)
            await this.setSummary('getVitalSignSummary()', 'vitalSignSummary', getVitalSignSummary)

            // Static version:
            // console.time('getGoalSummary()')
            // this.setState({ goalSummary: getGoalSummary(this.state.fhirData) })
            // console.timeEnd('getGoalSummary()')

            // console.time('getConditionSummary()')
            // this.setState({ conditionSummary: getConditionSummary(this.state.fhirData) })
            // console.timeEnd('getConditionSummary()')

            // console.time('getMedicationSummary()')
            // this.setState({ medicationSummary: getMedicationSummary(this.state.fhirData) })
            // console.timeEnd('getMedicationSummary()')

            // console.time('getLabResultSummary()')
            // this.setState({ labResultSummary: getLabResultSummary(this.state.fhirData) })
            // console.timeEnd('getLabResultSummary()')

            // console.time('getVitalSignSummary()')
            // this.setState({ vitalSignSummary: getVitalSignSummary(this.state.fhirData) })
            // console.timeEnd('getVitalSignSummary()')
        }
    }

    setSummary = async (message: string, propertyName: keyof AppState, summaryProcessor: SummaryFunctionType): Promise<void> => {
        console.time(message);
        const summary = summaryProcessor(this.state.fhirData)
        // Timeout set to 0 makes async and defers processing until after the event loop so it doesn't block UI
        // TODO: Consider updating to a worker instead when time for a more complete solution
        //       I don't think the timeout solution is needed because we are on a loading page, and,
        //       since these states are local now we are techincally fully loading them as part of the progress.
        //       We know we don't want to lazy load, so this is a start, but will want to consider if we want to spread the loading
        //       out past inital progress and not wait during that. If staying like this, will want to update progress to show that.
        // setTimeout(() => {
        this.setState(prevState => {
            return { ...prevState, [propertyName]: summary }
        })
        // }, 0)
        console.timeEnd(message)
    }

    // TODO: Need to set this 1x, during load, (or find another way to solve) so that if a user navigates out of home, they don't see old data loaded.
    // Note: Low priority because the issue can only be reproduced on a non-redirect provider selection (so not a launcher or redirect provider selection)
    initializeSummaries = () => {
        this.setState({ goalSummary: [{ Description: 'init' }] })
        this.setState({ conditionSummary: [{ ConceptName: 'init' }] })
        this.setState({ medicationSummary: [{ ConceptName: 'init' }] })
        this.setState({ labResultSummary: [{ ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }] })
        this.setState({ vitalSignSummary: [{ ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }] })
    }

    // TODO: Performance: Examine if we even need this callback or not as it may be called more than needed (before and after change vs just after):
    //       We can likely just put the code(or call to the function) in a componentDidUpdate fhirData state change check
    // callback function to update fhir data states and give ProviderLogin access to it
    setFhirDataStates = (data: FHIRData | undefined) => {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("setFhirDataStates(data: FHIRData | undefined): void")
        this.setState({ fhirData: data })
        this.setState({ patientSummary: data ? getPatientSummary(data) : undefined })
        this.setState({ screenings: data ? executeScreenings(data) : undefined })
        this.setState({ tasks: undefined })
    }

    // callback function to update progressMessage and progressValue state, and log message to console (passed to fhirService functions as arg and ProviderLogin as prop)
    setAndLogProgressState = (message: string, value: number) => {
        console.log(`ProgressMessage: ${message}`)
        this.setState({ progressMessage: message })
        this.setState({ progressValue: value })
    }
    // callback functions to update/access resourcesLoadedCount state (passed to fhirService functions as arg and ProviderLogin as prop)
    setResourcesLoadedCountState = (count: number) => {
        this.setState({ resourcesLoadedCount: count })
    }
    getResourcesLoadedCountState = (): number => {
        return this.state.resourcesLoadedCount
    }

    setAndLogErrorMessageState = (errorType: string, userErrorMessage: string, developerErrorMessage: string,
        errorCaught: Error | string | unknown) => {
        this.logErrorMessage(errorType, userErrorMessage, developerErrorMessage, errorCaught)
        // TODO: Consider converting errorType, userErrorMessage, developerErrorMessage, and errorCaught into an array so we can store all of the errors in the chain and display them.
        // If we do this, we would remove the if check for truthy on all of them, as, we would set a new index in the array vs overwrite
        // Even further, consider converting all 4 states into one state object, ErrorDetails (or ErrorMessage) and storing having an array of those objects in state
        this.setState({ errorType: errorType })
        this.setState({ developerErrorMessage: developerErrorMessage })
        let errorCaughtString: string = 'N/A'
        if (errorCaught instanceof Error) {
            errorCaughtString = errorCaught.message
        } else if (typeof errorCaught === "string") {
            errorCaughtString = errorCaught
        }
        this.setState({ errorCaught: errorCaughtString })
        this.setState({ userErrorMessage: this.determineUserErrorMessage(userErrorMessage, errorCaughtString) })
    }

    logErrorMessage = (errorType: string, userErrorMessage: string, developerErrorMessage: string, errorCaught: Error | string | unknown) => {
        console.log(`${errorType} Error: ${userErrorMessage}`)
        console.log(`Technical Message: ${developerErrorMessage}`)
        console.log(`Error Caught: ${errorCaught}`)
    }

    determineUserErrorMessage = (defaultUserErrorMessage: string, errorCaughtString: string): string => {
        if (errorCaughtString.includes("Session expired!")) {
            return process.env.REACT_APP_USER_ERROR_MESSAGE_SESSION_EXPIRED ?
                process.env.REACT_APP_USER_ERROR_MESSAGE_SESSION_EXPIRED : defaultUserErrorMessage
        } // TODO: Add remaining errors in else ifs here...
        return defaultUserErrorMessage
    }

    resetErrorMessageState = () => {
        this.setState({ errorType: undefined })
        this.setState({ developerErrorMessage: undefined })
        this.setState({ errorCaught: undefined })
        this.setState({ userErrorMessage: undefined })
    }

    public render(): JSX.Element {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("APP component RENDERED!")

        let patient = this.state.patientSummary;
        let editFormData: EditFormData = {
            fhirData: this.state.fhirData,
            patientSummary: this.state.patientSummary
        }

        return (
            <div className="app">
                <header className="app-header" style={{ padding: '10px 16px 0px 16px' }}>
                    {/* <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/> */}
                    <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/ecareplan-logo.png`} alt="My Care Planner" />
                    {patient === undefined ? '' : <p>&npsp;&npsp;{patient?.fullName}</p>}
                </header>

                <Switch>
                    <Route path="/condition-edit">
                        <ConditionEditForm {...editFormData} />
                    </Route>
                    <Route path="/goal-edit">
                        <GoalEditForm {...editFormData} />
                    </Route>

                    {/* <Route path="/provider-login" component={ProviderLogin} /> */}
                    <Route path="/provider-login"
                        render={(routeProps) => (
                            <ProviderLogin
                                setFhirDataStates={this.setFhirDataStates}
                                setAndLogProgressState={this.setAndLogProgressState}
                                setResourcesLoadedCountState={this.setResourcesLoadedCountState}
                                setAndLogErrorMessageState={this.setAndLogErrorMessageState}
                                resetErrorMessageState={this.resetErrorMessageState}
                                {...routeProps}
                            />
                        )}
                    />
                    <Route path="/share-data" component={ShareData} />
                    <Route path="/shared-data-summary" component={SharedDataSummary} />

                    <Route path="/decision" component={ScreeningDecision} />
                    <Route path="/questionnaire" component={QuestionnaireHandler} />
                    <Route path='/confirmation' component={ConfirmationPage} />
                    <Route path="/error" component={ErrorPage} />

                    <Route path="/">
                        <TabContext value={this.state.mainTabIndex}>
                            <Box sx={{ bgcolor: '#F7F7F7', width: '100%' }}>
                                <Paper variant="outlined" sx={{ width: '100%', maxWidth: '500px', position: 'fixed', borderRadius: 0, bottom: 0, left: 'auto', right: 'auto' }} elevation={3}>
                                    <TabList onChange={(event, value) => this.setState({ mainTabIndex: value })} variant="fullWidth" centered sx={{
                                        "& .Mui-selected, .Mui-selected > svg":
                                            { color: "#FFFFFF !important", bgcolor: "#355CA8" }
                                    }} TabIndicatorProps={{ style: { display: "none" } }}>
                                        <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<HomeIcon />} label="Home" value="1" wrapped />
                                        <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<ContentPasteIcon />} label="Care Plan" value="2" wrapped />
                                        <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<LineAxisIcon />} label="Health Status" value="3" wrapped />
                                        <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<PeopleIcon />} label="Team" value="4" wrapped />
                                    </TabList>
                                </Paper>

                                <TabPanel value="1" sx={{ padding: '0px 15px 100px' }}>
                                    <Home fhirData={this.state.fhirData} patientSummary={this.state.patientSummary} screenings={this.state.screenings}
                                        progressMessage={this.state.progressMessage} progressValue={this.state.progressValue} resourcesLoadedCount={this.state.resourcesLoadedCount}
                                        errorType={this.state.errorType} userErrorMessage={this.state.userErrorMessage} developerErrorMessage={this.state.developerErrorMessage} errorCaught={this.state.errorCaught} />
                                </TabPanel>
                                <TabPanel value="2" sx={{ padding: '0px 0px 100px' }}>
                                    <TabContext value={this.state.planTabIndex}>
                                        <TabList onChange={(event, value) => this.setState({ planTabIndex: value })} variant="fullWidth" centered>
                                            <Tab label="Goals" value="5" wrapped />
                                            <Tab label="Concerns" value="6" wrapped />
                                            <Tab label="Medications" value="7" wrapped />
                                            <Tab label="Activities" value="8" wrapped />
                                        </TabList>
                                        <TabPanel value="5" sx={{ padding: '0px 15px' }}>
                                            <GoalList fhirData={this.state.fhirData} goalSummary={this.state.goalSummary} />
                                        </TabPanel>
                                        <TabPanel value="6" sx={{ padding: '0px 15px' }}>
                                            <ConditionList fhirData={this.state.fhirData} conditionSummary={this.state.conditionSummary} />
                                        </TabPanel>
                                        <TabPanel value="7" sx={{ padding: '0px 15px' }}>
                                            <MedicationList fhirData={this.state.fhirData} medicationSummary={this.state.medicationSummary} />
                                        </TabPanel>
                                        <TabPanel value="8" sx={{ padding: '0px 15px' }}>
                                            <ServiceRequestList fhirData={this.state.fhirData} />
                                        </TabPanel>
                                    </TabContext>
                                </TabPanel>
                                <TabPanel value="3" sx={{ padding: '0px 0px 100px' }}>
                                    <TabContext value={this.state.statusTabIndex}>
                                        <TabList onChange={(event, value) => this.setState({ statusTabIndex: value })} variant="fullWidth" centered>
                                            <Tab label="Tests" value="9" wrapped />
                                            <Tab label="Vitals" value="10" wrapped />
                                            <Tab label="Immunization" value="11" wrapped />
                                        </TabList>
                                        <TabPanel value="9" sx={{ padding: '0px 15px' }}>
                                            <LabResultList fhirData={this.state.fhirData} labResultSummary={this.state.labResultSummary} />
                                        </TabPanel>
                                        <TabPanel value="10" sx={{ padding: '0px 15px' }}>
                                            <VitalsList fhirData={this.state.fhirData} vitalSignSummary={this.state.vitalSignSummary} />
                                        </TabPanel>
                                        {/* <TabPanel>
                                            <h4 className="title">Assessment Results</h4>
                                            <p>Coming soon...</p>
                                        </TabPanel> */}
                                        <TabPanel value="11">
                                            <ImmunizationList fhirData={this.state.fhirData} />
                                        </TabPanel>
                                    </TabContext>
                                </TabPanel>
                                <TabPanel value="4" sx={{ padding: '10px 15px 100px' }}>
                                    <CareTeamList fhirData={this.state.fhirData} />
                                </TabPanel>
                            </Box>
                        </TabContext>
                    </Route>
                </Switch>

            </div>
        )
    }
}
