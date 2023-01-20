import localForage from 'localforage'
import { fhirclient } from 'fhirclient/lib/types'

const saveFHIRAccessData = async (key: string, data: any): Promise<any> => {
  // consider checking if array, and checking content before saving?
  if (data) {
    console.log(`localForage.setItem(key: ${key}, data: <see next line>`, data)
    return await localForage.setItem(key, data)
  }
}

const isFHIRAccessData = async (key: string): Promise<boolean> => {
  try {
    const data: any = await localForage.getItem(key)
    // if the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (data !== null) {
      console.log('Key ' + key + ' exists in localForage')
      return true
    }
    console.log('Key ' + key + ' does NOT exist in localForage')
    return false
  } catch (e) {
    console.log(e)
    return false
  }
}

const getFHIRAccessData = async (key: string): Promise<any> => {
  try {
    const isData: boolean = await isFHIRAccessData(key)
    if (isData) {
      return await localForage.getItem(key)
    }
  } catch (e) {
    console.log(e)
  }
}

export const persistFHIRAccessData = async (clientState: fhirclient.ClientState) => {
  /* TODO:
   -support multiple logins using the data with the following logic:
   1: If the saved token is still valid,
      use those token(s) to query all required patient data from each endpoint without new login
   2: If tokens are expired, and we have a saved list of the user's selected endpoints,
      prompt to log in to each (and save the new token)
   3: After logging in and saving tokens,
      iterate through the tokens to query all required data from its endpoint
   4: Display all data in our app from all data sources
  */
  // it's best practice to use a suffix to ensure a unique key so we don't load data for another website
  const LF_ID = '-MCP'
  const fcCurrentStateKey = 'fhir-client-state' + LF_ID
  const fcAllStatesKey = 'fhir-client-states-array' + LF_ID

  // holds the currently active state object in localForage
  // currently this is set up to overwrite everytime/does not check if already exists
  await saveFHIRAccessData(fcCurrentStateKey, clientState).then(() => {
    console.log('fhirClientState saved/promise returned')
  }).catch((e) => console.log(e))

  // test persisted data recovery for currentLocalFhirClientState
  const currentLocalFhirClientState = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
  console.log('currentLocalFhirClientState', currentLocalFhirClientState)
  // test having a new unique state by changing the URL (remove this code later)
  // currentLocalFhirClientState.clientId = 'TestUniqueClientId'
  // currentLocalFhirClientState.serverUrl = 'TestUniqueServerUrl'

  // holds an array of state objects previously accessed in localForage
  const isLocalFhirClientStates: boolean = await isFHIRAccessData(fcAllStatesKey)
  console.log('isLocalFhirClientStates', isLocalFhirClientStates)
  if (isLocalFhirClientStates) {
    console.log("If the array is in local storage...")
    const tempLocalFhirClientStates = await getFHIRAccessData(fcAllStatesKey) as [fhirclient.ClientState]
    if (tempLocalFhirClientStates && currentLocalFhirClientState) {
      console.log("...and we don't already have the current state obj in the array, then we add it")
      if (tempLocalFhirClientStates.some((state: fhirclient.ClientState) => {
        console.log("Run some() check on states")
        return state?.clientId === currentLocalFhirClientState?.clientId &&
          state?.serverUrl === currentLocalFhirClientState?.serverUrl
      })) {
        console.log("Already have state obj in local array, will not update")
      } else {
        console.log("Push new unique current local fhir state obj to the array")
        tempLocalFhirClientStates.push(currentLocalFhirClientState)
        console.log("Updated array (tempLocalFhirClientStates) before write: ", tempLocalFhirClientStates)
        console.log(`Attempt to overwrite the existing array at the key ${fcAllStatesKey}`)
        await saveFHIRAccessData(fcAllStatesKey, tempLocalFhirClientStates).then(() => {
          console.log("Added additional unique state obj to local array")
        }).catch((e) => console.log(e))
      }
    }
  } else {
    console.log("Create and save array as first time application has been run on this machine")
    const tempLocalFhirClientStatesFirstSave = [currentLocalFhirClientState] as [fhirclient.ClientState]
    await saveFHIRAccessData(fcAllStatesKey, tempLocalFhirClientStatesFirstSave).then(() => {
      console.log('localFhirClientStates saved for the first time...')
    }).catch((e) => console.log(e))
  }

  // test persisted data recovery for localFhirClientStates
  const localFhirClientStates = await getFHIRAccessData(fcAllStatesKey)
  console.log('localFhirClientStates', localFhirClientStates)
}
