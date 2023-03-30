import localForage from 'localforage'
import { fhirclient } from 'fhirclient/lib/types'

// it's best practice to use a suffix to ensure a unique key so we don't load data for another website
const LF_ID = '-MCP'
const fcCurrentStateKey = 'fhir-client-state' + LF_ID
const fcAllStatesKey = 'fhir-client-states-array' + LF_ID

const saveFHIRAccessData = async (key: string, data: any, isArray: boolean): Promise<any> => {
  if (data) {
    if (!isArray) {
      // expiresAt is vital, without that, it means we didn't actually log in
      // e.g.back button pressed or window closed during process
      // The data we get back in the above case is not useful so there is no reason to overwrite
      // serverUrl and clientId are vital as they are used for object identification in the array
      // as well as recalling the data itself, reconnecting, and reauthorizing
      if (data.expiresAt && data.serverUrl && data.clientId) {
        console.log(`Object: localForage.setItem(key: ${key}, data: <see next line>`, data)
        return await localForage.setItem(key, data as fhirclient.ClientState)
      } else {
        console.log('Ignore previous logs, NOT updating data in local storage:')
        console.log('Data is missing data.expiresAt || data.serverUrl || data.clientId')
      }
    } else {
      // We don't need to check contents of array before saving here
      // as we know it was checked before saving currentLocalFhirClientState (the object) (see connected if block)
      // If this were a back button situaiton, it will overwrite with the correct object
      // Not the invalid new one, as the invalid new one won't exist in our persisted state to copy from
      console.log(`Array: localForage.setItem(key: ${key}, data: <see next line>`, data as Array<fhirclient.ClientState>)
      return await localForage.setItem(key, data)
    }
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
    console.log(`Failure calling localForage.getItem(key) from persistenceService.isFHIRAccessData: ${e}`)
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
    console.log(`Failure calling isFHIRAccessData(key) from persistenceService.getFHIRAccessData: ${e}`)
  }
}

const isSavedTokenStillValid = async (fhirAccessData: fhirclient.ClientState): Promise<boolean> => {
  // TODO: Create getter function for expiresAt and use that here
  console.log('enter isSavedTokenStillValid()')
  // Example: "expiresAt": 1666288471
  if (fhirAccessData) {
    const expiresAt = fhirAccessData?.expiresAt
    if (expiresAt) {
      console.log('expiresAt:', expiresAt)
      const curEpoch = Math.trunc(Date.now() / 1000)
      console.log('curEpoch:', curEpoch)
      const isValid = curEpoch < expiresAt
      console.log(isValid
        ? 'return true in isSavedTokenStillValid() as token is still valid'
        : 'return false in isSavedTokenStillValid() as token is expired')
      return isValid
    }
  }
  console.log('return false by default isSavedTokenStillValid()')
  return false
}

export const isGivenEndpointMatchesLastActiveEndpoint =
  async (givenEndpoint: string): Promise<boolean> => {
    // TODO: Create getter function for fcCurrentStateKey serverUrl and use that here
    console.log('enter isGivenEndpointMatchesLastActiveEndpoint()')
    console.log('givenEndpoint:', givenEndpoint)
    const fhirAccessData = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
    if (fhirAccessData) {
      const lastStoredEndpoint = fhirAccessData.serverUrl
      if (lastStoredEndpoint) {
        console.log('lastStoredEndpoint:', lastStoredEndpoint)
        if (givenEndpoint === lastStoredEndpoint) {
          return true
        }
      }
    }
    return false
  }

export const isEndpointStillAuthorized =
  async (endpoint: string, isCheckLastActiveEndpoint: boolean): Promise<boolean> => {
    console.log('enter isEndpointStillAuthorized()')
    console.log('endpoint:', endpoint)

    // The code works with extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint only as well
    // but extractFhirAccessDataObjectFromLastActiveEndpoint is more efficent when relevant
    const fhirAccessDataWithMatchingServerUrl = isCheckLastActiveEndpoint
      ? await extractFhirAccessDataObjectFromLastActiveEndpoint(endpoint) as fhirclient.ClientState
      : await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(endpoint) as fhirclient.ClientState
    console.log("fhirAccessDataWithMatchingServerUrl: ", fhirAccessDataWithMatchingServerUrl)
    // TODO: Analyze potential issue: fhirAccessDataWithMatchingServerUrl: null
    // aAove is null, even though a match is found and returned, why?
    if (fhirAccessDataWithMatchingServerUrl) {
      console.log("Check if saved token for the relevant endpoint is still valid")
      let isTokenStillValid: boolean = await isSavedTokenStillValid(fhirAccessDataWithMatchingServerUrl)
      console.log('isTokenStillValid: ', isTokenStillValid)
      return isTokenStillValid
    }

    console.log('if there is NO match, no need for further logic, return false, no authorization exists')
    return false
  }

const extractFhirAccessDataObjectFromLastActiveEndpoint =
  async (givenEndpoint: string): Promise<fhirclient.ClientState | null> => {
    // TODO: Create getter function for fcCurrentStateKey serverUrl and use that here
    console.log('enter extractFhirAccessDataObjectFromLastActiveEndpoint()')
    console.log('givenEndpoint:', givenEndpoint)

    const fhirAccessData = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
    console.log('fhirAccessData:', fhirAccessData)
    if (fhirAccessData) {
      console.log('fhirAccessData inside truthy check:', fhirAccessData)
      return fhirAccessData
    }
    console.log('returning null from extractFhirAccessDataObjectIfGivenEndpointMatchesLastActiveEndpoint')
    return null
  }

export const extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint =
  async (givenEndpoint: string): Promise<fhirclient.ClientState | undefined> => {
    // TODO: Create getter function for fcCurrentStateKey serverUrl and use that here
    console.log('enter extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint()')
    console.log('givenEndpoint:', givenEndpoint)

    const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
      await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>
    console.log('arrayOfFhirAccessDataObjects:', JSON.stringify(arrayOfFhirAccessDataObjects))

    if (arrayOfFhirAccessDataObjects) {
      console.log('arrayOfFhirAccessDataObject is truthy')
      return arrayOfFhirAccessDataObjects.find((curFhirAccessDataObject: fhirclient.ClientState) => {
        console.log('inside arrayOfFhirAccessDataObjects.find((curFhirAccessDataObject) function')
        const endpointInSavedData = curFhirAccessDataObject?.serverUrl
        console.log('endpointInSavedData:', endpointInSavedData)
        return givenEndpoint === endpointInSavedData
      })
    }
  }

export const persistFHIRAccessData = async (clientState: fhirclient.ClientState) => {
  /* TODO:
   -support multiple logins using the data with the following logic:
   1: (on launch?) If the saved token is still valid,
      use those token(s) to query all required patient data from each endpoint without new login
   2: If tokens are expired, and we have a saved list of the user's selected endpoints.
      That code should already exist in the fhirService,
      prompt to log in to each (and save the new token)
   3: After logging in and saving tokens,
      iterate through the tokens to query all required data from its endpoint
   4: Display all data in our app from all data sources
  */

  // Holds the currently active state object in localForage
  await saveFHIRAccessData(fcCurrentStateKey, clientState, false).then(() => {
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
    const tempLocalFhirClientStates = await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>
    if (tempLocalFhirClientStates && currentLocalFhirClientState) {
      console.log("...and we don't already have the current state obj in the array, then we add it")
      let indexOfMatchingClientState = -1
      if (tempLocalFhirClientStates.some((state: fhirclient.ClientState, i: number) => {
        console.log("Run some() check on states. Determining equality via clientId and serverUrl")
        indexOfMatchingClientState = i
        console.log("indexOfMatchingClientState in routine:", indexOfMatchingClientState)
        return state?.clientId === currentLocalFhirClientState?.clientId &&
          state?.serverUrl === currentLocalFhirClientState?.serverUrl
      })) {
        console.log("Already have state obj in local array. Don't need to add it " +
          "but DO need to overwrite so expiresAt and other data is not stale/outdated.")
        console.log(`Overwriting matching state object in array at index ${indexOfMatchingClientState}`)
        // Note: We don't need to check if index > -1 before overwriting because array.some already returned true here
        // console.log("Overwrite: tempLocalFhirClientStates before update: ", tempLocalFhirClientStates)
        tempLocalFhirClientStates[indexOfMatchingClientState] = currentLocalFhirClientState
        // console.log("Overwrite: Updated array (tempLocalFhirClientStates) before write to local storage: ", tempLocalFhirClientStates)
        console.log(`Overwrite: Attempt to overwrite the existing array at the key ${fcAllStatesKey}`)
        await saveFHIRAccessData(fcAllStatesKey, tempLocalFhirClientStates, true).then(() => {
          console.log("Overwrite: Attempted Update of state obj in local array")
        }).catch((e) => console.log(e))
      } else {
        console.log("Push new unique current local fhir state obj to the array")
        // console.log("Add: tempLocalFhirClientStates before update: ", tempLocalFhirClientStates)
        tempLocalFhirClientStates.push(currentLocalFhirClientState)
        // console.log("Add: Updated array (tempLocalFhirClientStates) before write to local storage: ", tempLocalFhirClientStates)
        console.log(`Add: Attempt to overwrite the existing array at the key ${fcAllStatesKey}`)
        await saveFHIRAccessData(fcAllStatesKey, tempLocalFhirClientStates, true).then(() => {
          console.log("Add: Attempted Add of additional unique state obj to local array")
        }).catch((e) => console.log(e))
      }
    }
  } else {
    console.log("Create and save array as first time application has been run on this machine")
    const tempLocalFhirClientStatesFirstSave = [currentLocalFhirClientState] as Array<fhirclient.ClientState>
    await saveFHIRAccessData(fcAllStatesKey, tempLocalFhirClientStatesFirstSave, true).then(() => {
      console.log('localFhirClientStates saved for the first time...')
    }).catch((e) => console.log(e))
  }

  if (process.env.REACT_APP_TEST_PERSISTENCE === 'true') {
    // test persisted data recovery for localFhirClientStates
    const localFhirClientStates = await getFHIRAccessData(fcAllStatesKey)
    console.log('localFhirClientStates', localFhirClientStates)
  }
}
