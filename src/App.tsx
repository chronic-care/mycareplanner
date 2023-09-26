import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route, RouteComponentProps } from 'react-router-dom';
import { Tab, Box, Paper } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
import { Task } from './data-services/fhir-types/fhir-r4';

import HomeIcon from '@mui/icons-material/Home';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PeopleIcon from '@mui/icons-material/People';

import Home from "./Home";

import { FHIRData } from './data-services/models/fhirResources';
import FHIR from 'fhirclient'
import { PatientSummary, ScreeningSummary, EditFormData } from './data-services/models/cqlSummary';
import { getFHIRData, createAndPersistClientForNewProvider } from './data-services/fhirService';
import { getPatientSummaries, executeScreenings } from './data-services/mpcCqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";

import { GoalSummary, ConditionSummary, MedicationSummary, ObservationSummary } from './data-services/models/cqlSummary';
import { isEndpointStillAuthorized, getSelectedEndpoints, deleteSelectedEndpoints } from './data-services/persistenceService'
import {
    getGoalSummaries, getLabResultSummaries, getConditionSummaries,
    getMedicationSummaries, getVitalSignSummaries
} from './data-services/mccCqlService';
import {
    ProviderEndpoint, buildAvailableEndpoints,
    getMatchingProviderEndpointsFromUrl
} from './data-services/providerEndpointService'

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
import SessionProtected from './components/session-timeout/SessionProtected';
import { SessionTimeoutPage } from './components/session-timeout/SessionTimeoutPage';
import SessionTimeOutHandler from './components/session-timeout/SessionTimeoutHandler';

interface AppProps extends RouteComponentProps {
}

interface AppState {
    mainTabIndex: string,
    planTabIndex: string,
    statusTabIndex: string,
    fhirDataCollection?: FHIRData[],
    patientSummaries?: PatientSummary[],
    screenings?: [ScreeningSummary],
    tasks?: [Task],

    progressMessage: string,
    progressValue: number,
    resourcesLoadedCount: number

    errorType: string | undefined,
    userErrorMessage: string | undefined,
    developerErrorMessage: string | undefined,
    errorCaught: Error | string | unknown,

    goalSummaries?: GoalSummary[][],
    conditionSummaries?: ConditionSummary[][],
    medicationSummaries?: MedicationSummary[][],
    labResultSummaries?: ObservationSummary[][],
    vitalSignSummaries?: ObservationSummary[][],
        
    isActiveSession: boolean,
    isLogout: boolean,
}

type SummaryFunctionType = (fhirData?: FHIRData[]) =>
    GoalSummary[][] | ConditionSummary[][] | ObservationSummary[][] | MedicationSummary[][] | undefined

// TODO: Convert this to a hook based function component so it easier to profile for performance, analyze, and integrate
class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);

        this.state = {
            mainTabIndex: "1",
            planTabIndex: "5",
            statusTabIndex: "9",
            fhirDataCollection: undefined,

            progressMessage: "Initializing",
            progressValue: 0,
            resourcesLoadedCount: 0,

            errorType: undefined,
            userErrorMessage: undefined,
            developerErrorMessage: undefined,
            errorCaught: undefined,

            goalSummaries: undefined,
            conditionSummaries: undefined,
            medicationSummaries: undefined,
            labResultSummaries: undefined,
            vitalSignSummaries: undefined,

            isActiveSession: true,
            isLogout: false,
        }

        this.initializeSummaries()
    }

    // TODO: Externalize everything we can out of componentDidMount into unique functions
    async componentDidMount() {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("App.tsx componentDidMount()")
        if (process.env.REACT_APP_READY_FHIR_ON_APP_MOUNT === 'true' && !this.state.isLogout) {
            try {
                console.log("Checking if this is a multi-select, single, or a loader...")
                // It's a multi select as selected endpoints exist/were not deleted
                const selectedEndpoints: string[] | undefined = await getSelectedEndpoints()

                if (selectedEndpoints && selectedEndpoints.length > 0) {
                    const isAnyEndpointNullOrUndefined: boolean = selectedEndpoints.some((endpoint) => {
                        console.log("isAnyEndpointNullOrUndefined selectedEndpoints.some(endpoint) : " + endpoint)
                        return endpoint === null || endpoint === undefined
                    })
                    if (isAnyEndpointNullOrUndefined) {
                        console.log("Deleting the corrupted endpoints and creating an error")
                        throw new Error("Multi-select exists in local storage but an endpoint is null or undefined")
                    } else {
                        console.log("Endpoints are truthy (at indexes as well) and have a length > 0")

                        console.log("Convert string[] of endpoint urls to ProviderEndpoint[]")
                        // Can't use local storage to extract as some of these endpoints could be NEW
                        // endpoints and not exist in local storage
                        const endpointsToAuthorize: ProviderEndpoint[] =
                            await getMatchingProviderEndpointsFromUrl(buildAvailableEndpoints(), selectedEndpoints)
                        console.log('endpointsToLoad (once authorized)', JSON.stringify(endpointsToAuthorize))

                        // Check truthyness of endpointsToAUthorize and trigger termintating error if not truthy
                        if (endpointsToAuthorize && endpointsToAuthorize.length > 0) {
                            console.log("endpointsToAuthorize && endpointsToAuthorize.length > 0")
                        } else {
                            throw new Error("endpointsToAuthorize is null or undefined")
                        }

                        // TODO: MULTI-PROVIDER: Externalize the logic in authorizeSelectedEndpoints in ProviderLogin
                        // so that both ProviderLogin and App.tsx (right here) can use it vs having duplicate code
                        // If all authorized, load all, else authorize the current one
                        const endpointsLength = endpointsToAuthorize.length
                        for (let i = 0; i < endpointsLength; i++) {
                            const curEndpoint: ProviderEndpoint = endpointsToAuthorize[i]
                            console.log("curEndpoint", curEndpoint)
                            const issServerUrl = curEndpoint.config!.iss
                            console.log("issServerUrl", issServerUrl)
                            const isLastIndex = i === endpointsLength - 1
                            console.log("isLastIndex: " + isLastIndex)

                            // !FUNCTION DIFF! *MAJOR DIFF*: Before checking authorization we need to create and persist the fhir client
                            // for this current provider. If we don't, we won't have the latest authorization data to check and it
                            // will fail authorization. This is only an issue for multi select, because on single, the local storage
                            // data is saved during the load process. For multi, we can't do that as we have to auth all first, then load
                            // (with multiple exits of the application for every auth to boot)
                            if (await createAndPersistClientForNewProvider(issServerUrl)) {
                                // Check for prior auths from another load or session just in case so we can save some time
                                if (await isEndpointStillAuthorized(issServerUrl!, false)) { // false so checking ALL endpoints in local storage vs just last one
                                    console.log("This endpoint IS authorized")
                                    console.log("curEndpoint issServerUrl " + issServerUrl + " at index " + i +
                                        " and count " + (i + 1) + "/" + endpointsLength +
                                        " is still authorized. Will not waste time reauthorizing: ", curEndpoint)

                                    if (isLastIndex) {
                                        console.log("All endpoints are already authorized.")

                                        // Do NOT need to save data for endpoints to be loaded as we don't need to reload the app
                                        // Deleting multi-select endpoints from local storage so they don't intefere with future selections
                                        // and so that this logic is not run if there are no mulit-endpoints to auth/loca
                                        // but instead, a loader is run or a single endpoint is run in such a case
                                        console.log("Deleting multi-select endpoints from local storage")
                                        deleteSelectedEndpoints()

                                        console.log("Nothing left to authorize, loading all multi-selected and authorized endpoints w/o leaving app...")
                                        await this.loadSelectedEndpoints(endpointsToAuthorize)
                                    }
                                } else {
                                    console.log("This endpoint is NOT authorized")
                                    console.log("curEndpoint issServerUrl " + issServerUrl + " at index " + i + " and count " + (i + 1) + "/" + endpointsLength +
                                        " is NOT authorized.", curEndpoint)

                                    // !FUNCTION DIFF!: NO need to save selected endpoints as they were already saved by ProviderLogin version of the code
                                    // Save selected endpoints so app load after exiting app for auth knows that it is a multi load of specific endpoints.
                                    // console.log("At Least one endpoint is not authorized yet...Saving multi-select endpoints")
                                    // const selectedEndpointsToSave: string[] =
                                    //     endpointsToAuthorize
                                    //         .map((curEndpoint, index) => {
                                    //             if (curEndpoint.config && curEndpoint.config.iss) {
                                    //                 console.log("matched endpoint: " + curEndpoint.config.iss)
                                    //                 return curEndpoint.config.iss
                                    //             }
                                    //             return undefined
                                    //         })
                                    //         .filter((endpoint) => endpoint !== undefined)
                                    //         .map((endpoint) => endpoint as string)
                                    // console.log("selectedEndpointsToSave: ", JSON.stringify(selectedEndpointsToSave))
                                    // saveSelectedEndpoints(selectedEndpointsToSave)

                                    console.log("Reauthorizing curEndpoint.config!:", curEndpoint.config!)
                                    // The following authorization will exit the application. Therefore, if it's not the last index,
                                    // then we will have more endpoints to authorize when we return, on load
                                    if (isLastIndex) {
                                        console.log("Authorizing last index")
                                    } else {
                                        console.log("Not last index, Authorizing index " + i)
                                    }

                                    FHIR.oauth2.authorize(curEndpoint.config!)

                                    console.log("Interestingly, this is still called called after authorize...")
                                    break
                                } // end not authorized case
                            } else {
                                throw new Error("Cannot create client and persist fhir client states and therefore cannot check authorization")
                            } // end createAndPersistClientForNewProvider
                        } // end for loop
                    } // end else for isAnyEndpointNullOrUndefined

                } else { // else for selectedEndpoints null or length check
                    // It's a loader, a reload of the last endpoint, or a load of a single selected endpoint
                    // Load a single item in an array
                    // TODO: MULTI-PROVIDER:: Determine how to handle a reload (refresh-situation) when the last load was a multi-select
                    console.log("Getting and setting fhirData state in componentDidMount")
                    let data = await getFHIRData(false, null, this.setAndLogProgressState,
                        this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                    this.setFhirDataStates([data])
                }

            } catch (err) {
                this.setAndLogErrorMessageState('Terminating',
                    process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT ?
                        process.env.REACT_APP_USER_ERROR_MESSAGE_FAILED_TO_CONNECT : 'undefined',
                    'Failure in getFHIRData called from App.tsx componentDidMount.', err)
                console.log("Deleting the selected endpoints due to terminating error in catch")
                deleteSelectedEndpoints()
            }
        }
    }

    async componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<AppState>, snapshot?: any): Promise<void> {
        // process.env.REACT_APP_DEBUG_LOG === "true" && console.log("App.tsx componentDidUpdate()")
        this.setSummary(prevState)
    }

    // TODO: MULTI-PROVIDER: This code is copioed into this class for now from the function in ProviderLOgin
    // Need to externalize and make part of a service for both, though
    // OR, this could exist here, and be passed to ProviderLogin.tsx
    loadSelectedEndpoints = async (endpointsToLoad: ProviderEndpoint[]): Promise<void> => {
        console.log('loadSelectedEndpoints()')
        const fhirDataCollection: FHIRData[] = []

        try {
            // !FUNCTION DIFF!: No need to redirect as we are already here, however,
            // doesn't hurt, so could leave the code in combined function if needed...
            // console.log("redirecting to '/' right away as loading multiple endpoints")
            // history.push('/')

            let index: number = 0
            for (const curSelectedEndpoint of endpointsToLoad) {
                console.log('curSelectedEndpoint #' + (index + 1) + ' at index: ' + index + ' with value:', curSelectedEndpoint)

                // Resetting state to undefined for loader and error message reset have to happen after each index is loaded
                //  in this multi version vs all at end like in singular version
                console.log('setting fhirData to undefined so progess indicator is triggered while new data is loaded subsequently')
                // !FUNCTION DIFF!: props to this for setFhirDataStates, may need to pass in what we need to set specifically and set that
                this.setFhirDataStates(undefined)
                // !FUNCTION DIFF!: props to this for resetErrorMessageState, may need to pass in what we need to set specifically and set that
                this.resetErrorMessageState()

                const curFhirDataLoaded: FHIRData | undefined =
                    await this.loadAuthorizedSelectedEndpointMulti(curSelectedEndpoint, true, index)
                if (curFhirDataLoaded) {
                    console.log("curFhirDataLoaded:", curFhirDataLoaded)
                    console.log("fhirDataCollection:", fhirDataCollection)
                    console.log("Adding curFhirDataLoaded to fhirDataCollection")
                    fhirDataCollection.push(curFhirDataLoaded)
                    console.log("fhirDataCollection:", fhirDataCollection)
                }
                index++;
            }
        } catch (err) {
            console.log(`Failure in loadSelectedEndpoints: ${err}`)
            // TODO: MULTI-PROVIDER: Make this a terminating error
        } finally {
            // !FUNCTION DIFF!: props to this for setFhirDataStates, may need to pass in what we need to set specifically and set that
            this.setFhirDataStates(fhirDataCollection!)
            console.log("fhirDataCollection complete in loadSelectedEndpoints:", fhirDataCollection)
        }
    }

    // TODO: MULTI-PROVIDER: This code is copied into this class for now from the function in ProviderLOgin
    // Need to externalize and make part of a service for both, though
    // OR, this could exist here, and be passed to ProviderLogin.tsx
    loadAuthorizedSelectedEndpointMulti = async (selectedEndpoint: ProviderEndpoint,
        isMultipleProviders: boolean, fhirDataCollectionIndex: number): Promise<FHIRData | undefined> => {
        console.log('loadAuthorizedSelectedEndpointMulti(): selectedEndpoint: ' + JSON.stringify(selectedEndpoint))
        console.log('loadAuthorizedSelectedEndpointMulti(): isMultipleProviders: ' + isMultipleProviders)
        console.log('loadAuthorizedSelectedEndpointMulti(): fhirDataCollectionIndex: ' + fhirDataCollectionIndex)

        if (selectedEndpoint !== null) {
            const issServerUrl = selectedEndpoint.config!.iss
            console.log('issServerUrl:', issServerUrl)

            let fhirDataFromStoredEndpoint: FHIRData | undefined = undefined

            console.log("fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!)")
            // !FUNCTION DIFF!: Props changed to this for setAndLogProgressState, setResourcesLoadedCountState, and setAndLogErrorMessageState,
            fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!, this.setAndLogProgressState,
                this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
            console.log("fhirDataFromStoredEndpoint", JSON.stringify(fhirDataFromStoredEndpoint))
            return fhirDataFromStoredEndpoint
        } else {
            console.error("endpoint === null")
        }
    }

    setSummary = async (prevState: Readonly<AppState>): Promise<void> => {
        // Warning: Don't call anything else in this function w/o a very limited condition!
        // Check if fhirData changed and if so update state (like useEffect with fhirData as the dependency)
        if (this.state.fhirDataCollection && (this.state.fhirDataCollection !== prevState.fhirDataCollection)) {
            // new fhirData is loaded now
            process.env.REACT_APP_DEBUG_LOG === "true" && console.log("this.state.fhirData !== prevState.fhirData")

            // Dyanmic version:
            await this.setSummaries('getGoalSummaries()', 'goalSummaries', getGoalSummaries);
            await this.setSummaries('getConditionSummaries()', 'conditionSummaries', getConditionSummaries)
            await this.setSummaries('getMedicationSummaries()', 'medicationSummaries', getMedicationSummaries)
            await this.setSummaries('getLabResultSummaries()', 'labResultSummaries', getLabResultSummaries)
            await this.setSummaries('getVitalSignSummaries()', 'vitalSignSummaries', getVitalSignSummaries)

            // Static version:
            // console.time('getGoalSummaries()')
            // this.setState({ goalSummaries: getGoalSummaries(this.state.fhirData) })
            // console.timeEnd('getGoalSummaries()')

            // console.time('getConditionSummaries()')
            // this.setState({ conditionSummaries: getConditionSummaries(this.state.fhirData) })
            // console.timeEnd('getConditionSummaries()')

            // console.time('getMedicationSummaries()')
            // this.setState({ medicationSummaries: getMedicationSummaries(this.state.fhirData) })
            // console.timeEnd('getMedicationSummaries()')

            // console.time('getLabResultSummaries()')
            // this.setState({ labResultSummaries: getLabResultSummaries(this.state.fhirData) })
            // console.timeEnd('getLabResultSummaries()')

            // console.time('getVitalSignSummaries()')
            // this.setState({ vitalSignSummaries: getVitalSignSummaries(this.state.fhirData) })
            // console.timeEnd('getVitalSignSummaries()')
        }
    }

    setSummaries = async (message: string, propertyName: keyof AppState, summariesProcessor: SummaryFunctionType): Promise<void> => {
        console.time(message);
        const Summaries = summariesProcessor(this.state.fhirDataCollection)
        // Timeout set to 0 makes async and defers processing until after the event loop so it doesn't block UI
        // TODO: Consider updating to a worker instead when time for a more complete solution
        //       I don't think the timeout solution is needed because we are on a loading page, and,
        //       since these states are local now we are techincally fully loading them as part of the progress.
        //       We know we don't want to lazy load, so this is a start, but will want to consider if we want to spread the loading
        //       out past inital progress and not wait during that. If staying like this, will want to update progress to show that.
        // setTimeout(() => {
        this.setState(prevState => {
            return { ...prevState, [propertyName]: Summaries }
        })
        // }, 0)
        console.timeEnd(message)
    }

    getConditionAndMedicationSummariesInit = () => {
        return [
            [
                { ConceptName: 'init' }
            ]
        ]
    }
    getLabResultAndVitalSignSummariesInit = () => {
        return [
            [
                { ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }
            ]
        ]
    }

    // TODO: Need to set this 1x, during load, (or find another way to solve) so that if a user navigates out of home, they don't see old data loaded.
    // Note: Low priority because the issue can only be reproduced on a non-redirect provider selection (so not a launcher or redirect provider selection)
    initializeSummaries = () => {
        this.setState({
            goalSummaries: [
                [
                    { Description: 'init' }
                ]
            ]
        })
        this.setState({
            conditionSummaries: this.getConditionAndMedicationSummariesInit()
        })
        this.setState({
            medicationSummaries: this.getConditionAndMedicationSummariesInit()
        })
        this.setState({
            labResultSummaries: this.getLabResultAndVitalSignSummariesInit()
        })
        this.setState({
            vitalSignSummaries: this.getLabResultAndVitalSignSummariesInit()
        })
    }

    // TODO: Performance: Examine if we even need this callback or not as it may be called more than needed (before and after change vs just after):
    //       We can likely just put the code(or call to the function) in a componentDidUpdate fhirData state change check
    // callback function to update fhir data states and give ProviderLogin access to it
    setFhirDataStates = (dataArray: FHIRData[] | undefined) => {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("setFhirDataStates(dataArray: FHIRData[] | undefined): void")
        this.setState({ fhirDataCollection: dataArray })
        this.setState({ patientSummaries: dataArray ? getPatientSummaries(dataArray) : undefined })
        this.setState({ screenings: dataArray ? executeScreenings(dataArray) : undefined })
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

    private handleLogout = () => {
        if (!this.state.isLogout) {
            this.setState({ isLogout: true })
            sessionStorage.clear();
            this.props.history.push('/logout');
        }

    }

    public render(): JSX.Element {
        // process.env.REACT_APP_DEBUG_LOG === "true" && console.log("APP component RENDERED!")

        let patient = this.state.patientSummaries;
        let editFormData: EditFormData = {
            fhirDataCollection: this.state.fhirDataCollection,
            patientSummaries: this.state.patientSummaries
        }

        return (
            <div className="app">

                {/* <SessionExpiredHandler
                    onLogout={this.handleLogout}
                    isLoggedOut={this.state.isLogout}
                /> */}
                <SessionTimeOutHandler
                    onActive={() => { this.setState({ isActiveSession: true }) }}
                    onIdle={() => { this.setState({ isActiveSession: false }) }}
                    onLogout={this.handleLogout}
                    isLoggedOut={this.state.isLogout}
                    timeOutInterval={+process.env.REACT_APP_CLIENT_IDLE_TIMEOUT!}
                />

                <header className="app-header" style={{ padding: '10px 16px 0px 16px' }}>
                    {/* <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/mpc-logo.png`} alt="MyPreventiveCare"/> */}
                    <img className="mypain-header-logo" src={`${process.env.PUBLIC_URL}/assets/images/ecareplan-logo.png`} alt="My Care Planner" />
                    {patient === undefined ? '' : <p>&npsp;&npsp;{patient[0]?.fullName}</p>}
                </header>

                <Switch>
                    <Route path="/condition-edit">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <ConditionEditForm {...editFormData} />
                        </SessionProtected>
                    </Route>
                    <Route path="/goal-edit">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <GoalEditForm {...editFormData} />
                        </SessionProtected>
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
                    <Route path="/share-data">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <ShareData />
                        </SessionProtected>
                    </Route>
                    <Route path="/shared-data-summary">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <SharedDataSummary />
                        </SessionProtected>
                    </Route>

                    <Route path="/decision">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <ScreeningDecision {...this.props}/>
                        </SessionProtected>
                    </Route>
                    <Route path="/questionnaire">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <QuestionnaireHandler {...this.props}/>
                        </SessionProtected>
                    </Route>
                    <Route path='/confirmation'>
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <ConfirmationPage />
                        </SessionProtected>
                    </Route>
                    <Route path="/error" component={ErrorPage} />

                    <Route path="/logout" component={SessionTimeoutPage} />

                    <Route path="/">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <TabContext value={this.state.mainTabIndex}>
                                <Box sx={{ bgcolor: '#F7F7F7', width: '100%' }}>
                                    <Paper variant="elevation" sx={{ width: '100%', maxWidth: '500px', position: 'fixed', borderRadius: 0, bottom: 0, left: 'auto', right: 'auto' }} elevation={3}>
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
                                    <Home fhirDataCollection={this.state.fhirDataCollection} patientSummaries={this.state.patientSummaries} screenings={this.state.screenings}
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
                                            <GoalList fhirDataCollection={this.state.fhirDataCollection} goalSummaryMatrix={this.state.goalSummaries} />
                                        </TabPanel>
                                        <TabPanel value="6" sx={{ padding: '0px 15px' }}>
                                            <ConditionList fhirDataCollection={this.state.fhirDataCollection} conditionSummaryMatrix={this.state.conditionSummaries} />
                                        </TabPanel>
                                        <TabPanel value="7" sx={{ padding: '0px 15px' }}>
                                            {/* <MedicationList fhirDataCollection={this.state.fhirDataCollection} medicationSummary={this.state.medicationSummary} /> */}
                                            <MedicationList fhirDataCollection={this.state.fhirDataCollection} medicationSummaryMatrix={this.state.medicationSummaries} />
                                        </TabPanel>
                                        <TabPanel value="8" sx={{ padding: '0px 15px' }}>
                                            <ServiceRequestList fhirDataCollection={this.state.fhirDataCollection} />
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
                                            <LabResultList fhirDataCollection={this.state.fhirDataCollection} labResultSummaryMatrix={this.state.labResultSummaries} />
                                        </TabPanel>
                                        <TabPanel value="10" sx={{ padding: '0px 15px' }}>
                                            <VitalsList fhirDataCollection={this.state.fhirDataCollection} vitalSignSummaryMatrix={this.state.vitalSignSummaries} />
                                        </TabPanel>
                                        {/* <TabPanel>
                                            <h4 className="title">Assessment Results</h4>
                                            <p>Coming soon...</p>
                                        </TabPanel> */}
                                        <TabPanel value="11">
                                            <ImmunizationList fhirDataCollection={this.state.fhirDataCollection} />
                                        </TabPanel>
                                    </TabContext>
                                </TabPanel>
                                <TabPanel value="4" sx={{ padding: '10px 15px 100px' }}>
                                    <CareTeamList fhirDataCollection={this.state.fhirDataCollection} />
                                </TabPanel>
                            </Box>
                        </TabContext>
		    </SessionProtected>
                    </Route>
                </Switch>

            </div>
        )
    }
}

export default App;
