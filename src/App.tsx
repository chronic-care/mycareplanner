import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Switch, Route, RouteComponentProps } from 'react-router-dom';
import { Tab, Box, Paper } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab';
//import { Patient} from './data-services/fhir-types/fhir-r4';
import {Task } from './data-services/fhir-types/fhir-r4';

import HomeIcon from '@mui/icons-material/Home';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LineAxisIcon from '@mui/icons-material/LineAxis';
import PeopleIcon from '@mui/icons-material/People';

import Home from "./Home";

import { FHIRData } from './data-services/models/fhirResources';
import FHIR from 'fhirclient'
import Client from 'fhirclient/lib/Client'
import { PatientSummary, ScreeningSummary, EditFormData } from './data-services/models/cqlSummary';
import { getFHIRData, createAndPersistClientForNewProvider, getSupplementalDataClient } from './data-services/fhirService';
import { getPatientSummaries, executeScreenings } from './data-services/mpcCqlService';
import { ScreeningDecision } from "./components/decision/ScreeningDecision";

import { GoalSummary, ConditionSummary, MedicationSummary, ObservationSummary } from './data-services/models/cqlSummary';
//import {isSavedTokenStillValid} from './data-services/persistenceService'

//import {deleteSessionId} from './data-services/persistenceService'
import {
    isEndpointStillAuthorized, getSelectedEndpoints, deleteSelectedEndpoints,
    getLauncherData, deleteAllDataFromLocalForage, saveSessionId, isSessionId, getSessionId
} from './data-services/persistenceService'
import {
    getGoalSummaries, getLabResultSummaries, getConditionSummaries,
    getMedicationSummaries, getVitalSignSummaries
} from './data-services/mccCqlService';
import {
    ProviderEndpoint, buildAvailableEndpoints,
    getMatchingProviderEndpointsFromUrl
} from './data-services/providerEndpointService'


//import { clearSession} from './log/log-service'
import { doLog, initializeSession, LogRequest } from './log/log-service'
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
import UnShareData from "./components/unshared-data/UnShareData";

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

    supplementalDataClient?: Client,
    canShareData: boolean,

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
    sessionId: string | undefined,
}

type SummaryFunctionType = (fhirData?: FHIRData[]) =>
    GoalSummary[][] | ConditionSummary[][] | ObservationSummary[][] | MedicationSummary[][] | undefined

const tabList = {
    1: "Home",
    2: "Care Plan",
    3: "Health Status",
    4: "Care Team",
    5: "Goals",
    6: "Concerns",
    7: "Medications",
    8: "Activities",
    9: "Tests",
    10: "Vitals",
    11: "Immunization",
}

// TODO: Convert this to a hook based function component so it easier to profile for performance, analyze, and integrate
class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);

        this.state = {
            mainTabIndex: "1",
            planTabIndex: "5",
            statusTabIndex: "9",
            fhirDataCollection: undefined,

            canShareData: false,

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
            sessionId: undefined,
        }

        this.initializeSummaries()
    }

    // TODO: Externalize everything we can out of componentDidMount into unique functions
    async componentDidMount() {
        process.env.REACT_APP_DEBUG_LOG === "true" && console.log("App.tsx componentDidMount()")
        if (process.env.REACT_APP_READY_FHIR_ON_APP_MOUNT === 'true' && !this.state.isLogout) {

            // For Now, setting this right away so that it is not null.
            // However, we may need to wait until after a launcher is loaded
            // If so, there are multiple areas to identify it's a launcher (possible 100%?_ and include the logic:
            // (mutli login code here and in ProviderLogin
            // await this.setSupplementalDataClient('somePatientId')

            try {
                if(await isSessionId()){
                    const retrievedSessionId = await getSessionId();
                    if(retrievedSessionId){
                        this.setState({ sessionId : retrievedSessionId });
                    }
                    console.log("I am in Retrieving the sessionID block ----------->",retrievedSessionId);
                }
                else{
                    const sessionId = await initializeSession(); // Initialize session when the application is launched
                    this.setState({ sessionId });
                    saveSessionId(sessionId);
                    console.log("I am in Creating the sessionID block ----------------->", sessionId)
                }
                console.log("Checking if this is a multi-select, single, or a loader...")
                const selectedEndpoints: string[] | undefined = await getSelectedEndpoints()
                if (selectedEndpoints && selectedEndpoints.length > 0) {
                    // It's a multi select as selected endpoints exist/were not deleted
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

                        // Check truthyness of endpointsToAuthorize and trigger termintating error if not truthy
                        if (endpointsToAuthorize && endpointsToAuthorize.length > 0) {
                            console.log("endpointsToAuthorize && endpointsToAuthorize.length > 0")
                            // To supoort a dynamic launcher, and not have to have the launcher in availableEndpoints
                            // Add launcher if missing. It will be missing if it doesn't exist in availableEndpoints
                            try {
                                const launcherEndpointFromForage: ProviderEndpoint | null | undefined =
                                    await getLauncherData()
                                console.log("launcherEndpointFromForage to add to endpointsToAuthorize: ",
                                    launcherEndpointFromForage)
                                if (launcherEndpointFromForage) {
                                    const isLauncherAlreadyInEndpointsToAuthorize: boolean =
                                        endpointsToAuthorize.some(endpoint => {
                                            return endpoint?.config?.iss === launcherEndpointFromForage?.config?.iss
                                        })
                                    if (!isLauncherAlreadyInEndpointsToAuthorize) {
                                        console.log("Adding launcher to endpointsToAuthorize")
                                        endpointsToAuthorize.unshift(launcherEndpointFromForage)
                                        console.log('endpointsToLoad (after adding launcher)',
                                            JSON.stringify(endpointsToAuthorize))
                                    } else {
                                        console.log("Not adding launcher to endpointsToAuthorize as it's already there")
                                    }
                                }
                            } catch (e) {
                                console.error(`Error fetching launcher data within App.tsx(): ${e}`)
                            }
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
                                        // and so that this logic is not run if there are no multi-endpoints to auth/local
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
                                    break
                                } // end not authorized case
                            } else {
                                throw new Error("Cannot create client and persist fhir client states and therefore cannot check authorization")
                            } // end createAndPersistClientForNewProvider
                        } // end for loop
                    } // end else for isAnyEndpointNullOrUndefined

                } else { // else for selectedEndpoints null or length check
                    // It's a launcher OR a reload of the last endpoint
                    // Load a single item in an array
                    // TODO: MULTI-PROVIDER:: Determine how to handle a reload (refresh-situation) when the last load was a multi-select
                    console.log("Getting and setting fhirData state in componentDidMount")
                    // false: authorized null: serverUrl
                    // We don't have access to the server URL for a launcher until we create a client

                    // LAUNCHER
                    let launcherData: FHIRData = await getFHIRData(false, null, null,
                        this.setAndLogProgressState, this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                    console.log('launcherData: Check for patient name...is it in here to use vs using launcherClient.tokenResponse?.patient from client itself?', launcherData)
                    const launcherPatientId = launcherData.patient?.id
                    console.log('launcherPatientId: ', launcherPatientId)
                    launcherData.serverName = 'Original Provider'

                    // SDS
                    // Note that this else always happens at least once, as the launcher is always chosen first
                    // So, maybe this is the only time we need to call setSupplementalDataClient
                    // But, if we leave the app, we need to call again, so, will need to call every time for now
                    // Until we optimize and write a way to track that in local forage
                    // Note: SDS must be run after launcher is loaded if it's based off of it (may not always be the case anymore)
                    // Note: In order to make this work with multi, SDS would need to merge with them too, not just launcher
                    await this.setLoadAndMergeSDSIfAvailable(launcherPatientId, launcherData)
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

    setLoadAndMergeSDSIfAvailable = async (launcherPatientId: string | undefined, launcherData: FHIRData) => {

        if (launcherPatientId) {
            console.log('connect to SDS so we can verify it can exist')
            const tempSDSClient = await this.setSupplementalDataClient(launcherPatientId)
            const launcherOnlyMessage = "Loading the launcher only, the SDS will not be loaded."

            if (this.state.supplementalDataClient && this.state.canShareData) {
                // TODO: convert this to use multi login code?

                // Configure the SDS client to get FHIR Data
                console.log('We can connect to the SDS, so, add it to launcher (read) SDS data')
                const serverUrl = this.state.supplementalDataClient.state.serverUrl
                const serverUrlFromEnvVar = process.env.REACT_APP_SHARED_DATA_ENDPOINT
                console.log(`Dynamic SDS serverUrl (using this for now...): ${serverUrl}`)
                console.log(`Static SDS serverUrl (verify it's the same...): ${serverUrlFromEnvVar}`)
                console.log('tempSDSClient', tempSDSClient)
                console.log(`this.state.supplementalDataClient: Is this the same as tempSDS? It should be!
                If not, then we are sending the wrong data to getFhirData`,
                    this.state.supplementalDataClient)
                this.setFhirDataStates(undefined)
                this.resetErrorMessageState()

                try {
                    // Use the SDS client to get FHIR Data
                    const sdsData: FHIRData = await getFHIRData(true, serverUrl, this.state.supplementalDataClient,
                        this.setAndLogProgressState, this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                    console.log('SDS data: ', sdsData)
                    sdsData.serverName = 'SDS'

                    // Merge launcher and SDS Data and set states
                    const mergedFhirDataCollection: FHIRData[] = [sdsData, launcherData]
                    console.log('Merged (launcher and SDS) data', mergedFhirDataCollection)
                    this.setFhirDataStates(mergedFhirDataCollection)
                } catch (err) {
                    // Note: This should be a very rare event
                    // TODO: Exnternalize this and other exceptions into one function to reduce duplicate code...
                    const userMessage: string = `There is an issue loading a seemingly valid SDS.
                    Loading the launcher only.`
                    const devMessage: string = `The SDS cannot be used due to an error while running
                    getFHIRData with the SDS client: ` + launcherOnlyMessage
                    this.setAndLogErrorMessageState('Non-terminating', userMessage, devMessage, err)

                    // Ensure the app doesn't try to use this invalid client
                    this.setState({ supplementalDataClient: undefined })
                    this.setState({ canShareData: false })
                    // TODO: What other issues might this cause... leftover localForage in getFhirData, etc.?
                }

            } else {
                // TODO: Exnternalize this and other exceptions (like the one above)
                // into one function to reduce duplicate code...
                // TODO: Consider throwing an exception and handling there when else condition met vs using else itself
                const userMessage: string = "The SDS is invalid. Loading the launcher only."
                const devMessage: string = `The SDS cannot be used due to an invalid SDS configuration,
                a missing patient, or otherwise: ` + launcherOnlyMessage
                this.setAndLogErrorMessageState('Non-terminating', userMessage, devMessage,
                    "!this.state.supplementalDataClient || !this.state.canShareData")

                // Ensure the app doesn't try to use this invalid client
                this.setState({ supplementalDataClient: undefined })
                this.setState({ canShareData: false })
                // TODO: What other issues might this cause... leftover localForage in getFhirData, etc.?

                this.setFhirDataStates([launcherData])
            }

        } else {
            // TODO: Set this to non-terminating as well and include all code from other 'exceptions'?
            console.log('No SDS due to !launcherPatientId, so just loading the launcher')
            this.setFhirDataStates([launcherData])
        }

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
                // !FUNCTION DIFF!: props converted to 'this' for setFhirDataStates, may need to pass in what we need to set specifically and set that
                this.setFhirDataStates(undefined)
                // !FUNCTION DIFF!: props converted to 'this' for resetErrorMessageState, may need to pass in what we need to set specifically and set that
                this.resetErrorMessageState()

                const curFhirDataLoaded: FHIRData | undefined =
                    await this.loadAuthorizedSelectedEndpointMulti(curSelectedEndpoint, true, index)
                if (curFhirDataLoaded) {
                    console.log("curFhirDataLoaded:", curFhirDataLoaded)
                    console.log("fhirDataCollection:", fhirDataCollection)
                    console.log("Adding curFhirDataLoaded to fhirDataCollection")
                    fhirDataCollection.push(curFhirDataLoaded)
                    console.log("fhirDataCollection:", fhirDataCollection)
                } else {
                    console.error("Error: No FHIR Data loaded for the current index (" + index + "). " +
                        curSelectedEndpoint?.name + " was not pushed to fhirDataCollection!")
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
            // !FUNCTION DIFF!: Props changed to this for setAndLogProgressState, setResourcesLoadedCountState,
            // and setAndLogErrorMessageState
            // TODO SDS: Maybe check if this is the sds, if it is, do the correct getFHIRData call
            if (selectedEndpoint.name.includes('SDS') && this.state.supplementalDataClient) {
                console.log('loading sds data in App.tsx but not on first load/with a launcher')
                fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!, this.state.supplementalDataClient,
                    this.setAndLogProgressState, this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                console.log('sdsData', fhirDataFromStoredEndpoint)
                fhirDataFromStoredEndpoint.serverName = selectedEndpoint.name
            } else {
                fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!, null,
                    this.setAndLogProgressState, this.setResourcesLoadedCountState, this.setAndLogErrorMessageState)
                    fhirDataFromStoredEndpoint.serverName = selectedEndpoint.name
            }
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
        }
    }

    setSummaries = async (message: string, propertyName: keyof AppState, summariesProcessor: SummaryFunctionType): Promise<void> => {
        console.time(message);
        const Summaries = summariesProcessor(this.state.fhirDataCollection)

        this.updateLogSummariesCount(this.state.fhirDataCollection) // Logging the count for the patient details bundle.

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

    updateLogSummariesCount = async (fhirDataCollectionCount: FHIRData[] | undefined) => {

        if (fhirDataCollectionCount !== undefined) {
            for (const dictionary of fhirDataCollectionCount) {
                for (const key of Object.keys(dictionary)) {
                    // Disable type checking for this line
                    // @ts-ignore
                    const values = dictionary[key]
                    if (Array.isArray(values)) {
                        const length = values.length;
                        const request: LogRequest = {
                            level: 'info',
                            event: 'Summaries Loading',
                            message: `Resource Count for ${key}: ${length}`,
                            resourceCount: length,
                            sessionId: this.state.sessionId,
                        };
                        doLog(request)
                    }
                }
            }
        }

        else {
            console.error("fhirDataCollectionCount is undefined");
        }
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

    setSupplementalDataClient = async (patientId: string): Promise<Client | undefined> => {
        console.log('setSupplementalDataClient()')
        let client = await getSupplementalDataClient(patientId)

        // wait for client to get online to fix refresh issue
        var attempts = 0
        while (!client) {
            client = await getSupplementalDataClient(patientId);
            attempts++;
            if (attempts < 10) {
            break;
            }
        }

        if (client) {
            // We have a valid client for the SDS, but, we don't know if it has any data yet
            // (or a valid patient / patient with data)
            // Ensure we have data by running a query such as the following before proceeding
            // Query to run: https://gw.interop.community/MCCSDSEmpty/open/Patient/petient-id
            // If we don't get: "resourceType": "Patient", (and instead get something like: "resourceType": "OperationOutcome")
            // Return undefined.
            // Note: We are only checking for a patient (below) at this time, can consider adding data check/above query later.
            // If we want to go further, and we get back a Patient, we can check that: "id": "patient-name",
            // If either of those fail, we don't load the SDS...

            // const sdsMessageSuffix = "The SDS client will not be used."
            // let isSDSReadError = false
            // let sdsPatient: Patient | undefined
            // if (client.patient.id !== null) {
            //     console.error("setSupplementalDataClient client.patient.id !== null, using client.patient.read()")
            //     try {
            //         sdsPatient = await client.patient.read() as Patient
            //         console.log("Valid ")
            //     } catch (err) {
            //         console.warn("Warning: SDS Patient cannot be read via client.patient.read(): " + sdsMessageSuffix)
            //         isSDSReadError = true
            //     }
            // } else {
            //     console.log("client.patient.id === null, using client.user.read() isntead of client.patient.read()")
            //     try {
            //         sdsPatient = await client.user.read() as Patient
            //     } catch (err) {
            //         console.warn("Warning: SDS Patient cannot be read via client.user.read(): " + sdsMessageSuffix)
            //         isSDSReadError = true
            //     }
            // }

            // if (!isSDSReadError) {
            //     console.log("Valid SDS patient read: Using SDS client", sdsPatient ? sdsPatient : "unknown")

            //     const stillValid = await isSavedTokenStillValid(client.state)
                this.setState({ supplementalDataClient: client })
                this.setState({ canShareData: true })

            //     console.log("***** PatientID = " + client.getPatientId() ?? "")
            //     console.log("***** User ID = " + client.getUserId() ?? "")
            //     console.log("***** Can share data = " + stillValid ?? "?")
            // } else {
            //     console.warn(`Warning: Invalid SDS patient read: Overriding valid client to undefined
            //     and not setting state for supplementalDataClient or canShareData`)
            //     client = undefined
            // }

        }
        return client
    }

    // callback function to update progressMessage and progressValue state, and log message to console (passed to fhirService functions as arg and ProviderLogin as prop)
    setAndLogProgressState = (message: string, value: number) => {
        console.log(`ProgressMessage: ${message}`)
        let logMessage = `ProgressMessage: ${message}`
        let request: LogRequest = {
            level: 'info',
            event: 'Patient information loading',
            page: 'Home',
            message: logMessage,
            sessionId: this.state.sessionId,
        }
        doLog(request)
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

    private handleLogout = async () => {
        if (!this.state.isLogout) {
            this.setState({ isLogout: true })
            sessionStorage.clear()
            await deleteAllDataFromLocalForage()
            this.props.history.push('/logout')
        }
    }

    updateLogMainTab = async (event: any, value: any) => {
        this.setState({ mainTabIndex: value });

        const key: keyof typeof tabList = value;
        const tab = tabList[key]; // No error
        let message = `User has visted ${tab}`;

        let request: LogRequest = {
            level: 'info',
            event: 'Clicked',
            page: tab,
            message,
            sessionId: this.state.sessionId,
        }
        doLog(request)
    }

    updateLogPanelTab = async (event: any, value: any) => {
        this.setState({ planTabIndex: value });

        const key: keyof typeof tabList = value;
        const tab = tabList[key]; // No error

        let message = `User has visted ${tab}`;

        let request: LogRequest = {
            level: "info",
            event: 'Clicked',
            page: tab,
            message,
            sessionId: this.state.sessionId,
        }

        doLog(request)
    }

    updateLogStatusTab = async (event: any, value: any) => {
        this.setState({ statusTabIndex: value });

        const key: keyof typeof tabList = value;
        const tab = tabList[key]; // No error
        let message = `user has visited ${tab}`;

        let request: LogRequest = {
            level: "info",
            event: 'Clicked',
            page: tab,
            message,
            sessionId: this.state.sessionId,
        }
        doLog(request)

    }

    public render(): JSX.Element {
        // process.env.REACT_APP_DEBUG_LOG === "true" && console.log("APP component RENDERED!")

        // let patient = this.state.patientSummaries;
        let editFormData: EditFormData = {
            fhirDataCollection: this.state.fhirDataCollection,
            patientSummaries: this.state.patientSummaries,
            supplementalDataClient: this.state.supplementalDataClient,
            canShareData: this.state.canShareData
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
                    {/* {patient === undefined ? '' : <p>&npsp;&npsp;{patient[0]?.fullName}</p>} */}
                    <p className='version'>{process.env.REACT_APP_VERSION}</p>
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
                            <ShareData fhirDataCollection={this.state.fhirDataCollection}  />
                        </SessionProtected>
                    </Route>
                    <Route path="/unshare-data">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <UnShareData fhirDataCollection={this.state.fhirDataCollection}  />
                        </SessionProtected>
                    </Route>
                    <Route path="/shared-data-summary">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <SharedDataSummary />
                        </SessionProtected>
                    </Route>

                    <Route path="/decision">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <ScreeningDecision {...this.props} />
                        </SessionProtected>
                    </Route>
                    <Route path="/questionnaire">
                        <SessionProtected isLoggedIn={!this.state.isLogout}>
                            <QuestionnaireHandler canShareData={this.state.canShareData} supplementalDataClient={this.state.supplementalDataClient} {...this.props} />
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
                                        <TabList onChange={(event, value) => this.updateLogMainTab(event, value)} variant="fullWidth" centered sx={{
                                            "& .Mui-selected, .Mui-selected > svg":
                                                { color: "#FFFFFF !important", bgcolor: "#355CA8" }
                                        }} TabIndicatorProps={{ style: { display: "none" } }}>
                                            <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<HomeIcon sx={{color: 'black'}} />} label="Home" value="1" wrapped />
                                            <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<ContentPasteIcon  sx={{color: 'black'}}/>} label="Care Plan" value="2" wrapped />
                                            <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<LineAxisIcon  sx={{color: 'black'}}/>} label="Health Status" value="3" wrapped />
                                            <Tab sx={{ textTransform: 'none', margin: '-5px 0px' }} icon={<PeopleIcon sx={{color: 'black'}} />} label="Team" value="4" wrapped />
                                        </TabList>
                                    </Paper>

                                    <TabPanel value="1" sx={{ padding: '0px 15px 100px' }}>
                                        <Home fhirDataCollection={this.state.fhirDataCollection} patientSummaries={this.state.patientSummaries} screenings={this.state.screenings}
                                            progressMessage={this.state.progressMessage} progressValue={this.state.progressValue} resourcesLoadedCount={this.state.resourcesLoadedCount}
                                            errorType={this.state.errorType} userErrorMessage={this.state.userErrorMessage} developerErrorMessage={this.state.developerErrorMessage} errorCaught={this.state.errorCaught}
                                            canShareData={this.state.canShareData} isLogout={this.state.isLogout}
                                            />
                                    </TabPanel>
                                    <TabPanel value="2" sx={{ padding: '0px 0px 100px' }}>
                                        <TabContext value={this.state.planTabIndex}>
                                            <TabList onChange={(event, value) => this.updateLogPanelTab(event, value)} variant="fullWidth" centered>
                                                <Tab label="Goals" value="5" wrapped />
                                                <Tab label="Concerns" value="6" wrapped />
                                                <Tab label="Medications" value="7" wrapped />
                                                <Tab label="Activities" value="8" wrapped />
                                            </TabList>
                                            <TabPanel value="5" sx={{ padding: '0px 15px' }}>
                                                <GoalList fhirDataCollection={this.state.fhirDataCollection} goalSummaryMatrix={this.state.goalSummaries} canShareData={this.state.canShareData} />
                                            </TabPanel>
                                            <TabPanel value="6" sx={{ padding: '0px 15px' }}>
                                                <ConditionList fhirDataCollection={this.state.fhirDataCollection} conditionSummaryMatrix={this.state.conditionSummaries} canShareData={this.state.canShareData} />
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
                                            <TabList onChange={(event, value) => this.updateLogStatusTab(event, value)} variant="fullWidth" centered>
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
