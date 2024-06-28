import localForage from 'localforage'
import { fhirclient } from 'fhirclient/lib/types'
import {
  ProviderEndpoint, getProviderEndpointTypeFromClientStateType,
  buildAvailableEndpoints
} from './providerEndpointService'

// It's best practice to use a suffix to ensure a unique key so we don't load data for another website
const LF_ID = '-MCP'
const fcCurrentStateKey = 'fhir-client-state' + LF_ID
const fcAllStatesKey = 'fhir-client-states-array' + LF_ID
const selectedEndpointsKey = 'selected-endpoints' + LF_ID
const launcherDataKey = 'launcher-data' + LF_ID
// TODO: Sravan to set this up/add function for saving it, testing it, and possibly delete (if clear is not enough)
const sessionIdKey = 'session-id' + LF_ID

// FHIR ACCESS DATA //

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
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
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

// Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
export const deleteCurrentLocalFHIRAccessData = async (): Promise<void> => {
  try {
    const fhirAccessData = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
    if (fhirAccessData) {
      await localForage.removeItem(fcCurrentStateKey)
      console.log("Deleted currentLocalFhirClientState")
    } else {
      console.log("currentLocalFhirClientState does not exist so there is no need to delete it")
    }
  } catch (e) {
    console.error("Failure deleting currentLocalFhirClientState: " + e)
  }
}

// Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
export const deleteArrayOfFhirAccessDataObjects = async (): Promise<void> => {
  try {
    const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
      await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>
    if (arrayOfFhirAccessDataObjects) {
      await localForage.removeItem(fcAllStatesKey)
      console.log("Deleted arrayOfFhirAccessDataObjects")
    } else {
      console.log("arrayOfFhirAccessDataObjects does not exist so there is no need to delete it")
    }
  } catch (e) {
    console.error("Failure deleting arrayOfFhirAccessDataObjects: " + e)
  }
}

export const isSavedTokenStillValid = async (fhirAccessData: fhirclient.ClientState): Promise<boolean> => {
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
          console.log("Matches last stored endpoint")
          return true
        }
      }
    }
    console.log("NOT a match to the last stored endpoint")
    return false
  }

export const isEndpointStillAuthorized =
  async (endpoint: string, isCheckLastActiveEndpoint: boolean): Promise<boolean> => {
    console.log('enter isEndpointStillAuthorized()')
    console.log('endpoint:', endpoint)

    // The logic works with extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint either way
    // but extractFhirAccessDataObjectFromLastActiveEndpoint is more efficient when relevant
    const fhirAccessDataWithMatchingServerUrl = isCheckLastActiveEndpoint
      ? await extractFhirAccessDataObjectFromLastActiveEndpoint(endpoint) as fhirclient.ClientState
      : await extractFhirAccessDataObjectIfGivenEndpointMatchesAnyPriorEndpoint(endpoint) as fhirclient.ClientState
    console.log("fhirAccessDataWithMatchingServerUrl: ", JSON.stringify(fhirAccessDataWithMatchingServerUrl))
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

  // Holds the currently active state object in localForage
  await saveFHIRAccessData(fcCurrentStateKey, clientState, false).then(() => {
    console.log('fhirClientState saved/promise returned')
  }).catch((e) => console.log(e))

  // test persisted data recovery for currentLocalFhirClientState
  const currentLocalFhirClientState = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
  console.log('currentLocalFhirClientState', currentLocalFhirClientState)

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

    // test persisted data recovery for selectedEndpoints
    const selectedEndpoints = await getSelectedEndpoints()
    console.log('selectedEndpoints', selectedEndpoints)
  }

}

// SELECTED ENDPOINTS //

export const saveSelectedEndpoints = async (endpoints: string[]): Promise<string[] | undefined> => {
  if (endpoints) {
    if (endpoints.length > 0) {
      return await localForage.setItem(selectedEndpointsKey, endpoints)
    } else {
      console.error("fetchedEndpoints length is less than 1, will not save")
    }
  } else {
    console.error("saveSelectedEndpoints endpoints array arg is not truthy, will not save: " + endpoints)
  }
  console.error("Unknown error saving selected endppoints, returning undefined")
  return undefined
}

const isSelectedEndpoints = async (): Promise<boolean> => {
  try {
    const endpoints: string[] = await localForage.getItem(selectedEndpointsKey) as string[]
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (endpoints !== null) {
      console.log('Key ' + selectedEndpointsKey + ' exists in localForage')
      return true
    }
    console.log('Key ' + selectedEndpointsKey + ' does NOT exist in localForage')
    return false
  } catch (e) {
    console.log(`Failure calling localForage.getItem(selectedEndpointsKey) from persistenceService.isSelectedEndpoints: ${e}`)
    return false
  }
}

export const getSelectedEndpoints = async (): Promise<string[] | undefined> => {
  try {
    const isSelectedEndpointsResult: boolean = await isSelectedEndpoints()
    if (isSelectedEndpointsResult) {
      const selectedEndpoints: string[] = await localForage.getItem(selectedEndpointsKey) as string[]
      if (selectedEndpoints) {
        if (selectedEndpoints.length > 0) {
          console.log("getSelectedEndpoints selectedEndpoints is truthy and length is > 0," +
            "Returning data: ", JSON.stringify(selectedEndpoints))
          return selectedEndpoints
        } else {
          console.error("getSelectedEndpoints selectedEndpoints length is less than 1" +
            "Returning an empty array")
          return []
        }
      } else {
        console.error("getSelectedEndpoints selectedEndpoints is not truthy" +
          "Returning an empty array")
        return []
      }
    }
  } catch (e) {
    console.log(`Failure calling isFHIRAccessData(key) from persistenceService.getFHIRAccessData: ${e}`)
  }
  return undefined
}

export const deleteSelectedEndpoints = async (): Promise<void> => {
  try {
    const isSelectedEndpointsResult: boolean = await isSelectedEndpoints()
    if (isSelectedEndpointsResult) {
      await localForage.removeItem(selectedEndpointsKey)
    } else {
      console.log("There is no matching key to delete for selectedEndpoints...")
    }
  } catch (e) {
    console.error("Failure deleting deleteSelectedEndpoints: " + e)
  }
}

// // Unused, not needed, and incomplete at this time
// const saveEndpointToSelectedEndpointsArray = async (endpoint: string): Promise<any> => {
//   const key = selectedEndpointsKey
//   if (endpoint) {
//     // get existing endpoints from local storage
//     const fetchedEndpoints: string[] = await localForage.getItem(key) as string[]
//     if (fetchedEndpoints) {
//       if (fetchedEndpoints.length > 0) {
//         // create updatedEndpoints array, add fetchedEndpoints to it, then push the new endpoint to that and save
//         return await localForage.setItem(key, endpoint)
//       } else {
//         console.log("fetchedEndpoints length is less than 1")
//       }
//     } else {
//       console.log("fetchedEndpoints are not truthy")
//     }
//   } else {
//     console.error("saveEndpointToSelectedEndpointsArray endpoint is not truthy: " + endpoint)
//   }
// }

// LAUNCHER ENDPOINT //

const saveLauncherData = async (key: string, data: ProviderEndpoint | undefined): Promise<ProviderEndpoint | null> => {
  if (data) {
    if (data.name && data.config) {
      console.log(`Object: localForage.setItem(key: ${key}, data: <see next line>`, data)
      return await localForage.setItem(key, data)
    } else {
      console.log('Ignore previous logs, NOT updating data in local storage:')
      console.log('Data is missing data.name || data.config')
    }
  } else {
    // TODO: This situation could have drastic effects on the logic. Need to figure out how to properly handle it.
    console.error("convertedProviderEndpoint data is undefined. Cannot save launcher data.")
  }
  console.error("Unknown error saving launcher data, returning null")
  return null
}

const isLauncherData = async (): Promise<boolean> => {
  try {
    const data: ProviderEndpoint = await localForage.getItem(launcherDataKey) as ProviderEndpoint
    // If the key does not exist, getItem() in the localForage API will return null specifically to indicate it
    if (data !== null) {
      console.log('Key ' + launcherDataKey + ' exists in localForage')
      return true
    }
    console.log('Key ' + launcherDataKey + ' does NOT exist in localForage')
    return false
  } catch (e) {
    console.log(`Failure calling localForage.getItem(key) from persistenceService.isLauncherData: ${e}`)
    return false
  }
}

export const getLauncherData = async (): Promise<ProviderEndpoint | null | undefined> => {
  try {
    const isData: boolean = await isLauncherData()
    if (isData) {
      return await localForage.getItem(launcherDataKey) // null if failed
    }
  } catch (e) {
    console.log(`Failure calling isLauncherData(launcherDataKey) from persistenceService.getLauncherData: ${e}`)
  }
  console.error("Unknown error getting launcher data, returning null")
  return undefined
}

// Written in case we need vs deleteAllDataFromLocalForage() on session timeout or logout but not yet tested
export const deleteLauncherData = async (): Promise<void> => {
  try {
    const launcherData: ProviderEndpoint = await getLauncherData() as ProviderEndpoint
    if (launcherData) {
      await localForage.removeItem(launcherDataKey)
      console.log("Deleted launcherData")
    } else {
      console.log("launcherData does not exist so there is no need to delete it")
    }
  } catch (e) {
    console.error("Failure deleting launcherData: " + e)
  }
}

export const persistLauncherData = async (clientState: fhirclient.ClientState) => {
  // Convert clientState to ProviderEndpoint
  const convertedProviderEndpoint: ProviderEndpoint | undefined =
    await getProviderEndpointTypeFromClientStateType(buildAvailableEndpoints(), clientState)

  // Use convertedProviderEndpoint if it's truthy/in our list of available endpoints
  // Otherwise, it's not defined, and we need to create it
  // Later, in that case, we persist it so that we can add it if missing on load
  // such as would be the case with a launcher that has not been pre-configured
  // (as is typical in the real world).
  // TODO: Set name dynamically using get org name from capability resource, Dave knows the logic
  const providerEndpointToSave: ProviderEndpoint = convertedProviderEndpoint ?? {
    name: 'Original provider',
    config: {
      iss: clientState.serverUrl,
      redirectUri: "./index.html",
      clientId: clientState.clientId,
      scope: clientState.scope
    }
  }
  console.log("providerEndpointToSave: ", providerEndpointToSave)

  if (convertedProviderEndpoint === undefined) {
    console.log(`convertedProviderEndpoint === undefined, will save a dynamic launcher
    (as "Original provider") as is typical in real-world use cases`)
  }

  // Persist converted data
  try {
    await saveLauncherData(launcherDataKey, providerEndpointToSave)
    console.log('launcherDataKey save attempted/promise returned')
  } catch (e) {
    console.error('Error saving launcher data:', e)
  }
}

// GENERIC HELPER FUNCTIONS //

/*
Removes every key from the database, returning it to a blank slate.
*/
export const deleteAllDataFromLocalForage = async () => {
  try {
    console.log("Attempting to clear all data from local forage...")
    await localForage.clear()
  } catch (err) {
    console.log("Error clearing data from local forage: " + err)
  } finally {
    console.log("Successfully cleared all data from local forage (operation success)")

    console.log("Testing that specifically-sensitive data was removed")
    console.log(`Testing fcCurrentStateKey key...`)
    const fhirAccessData = await getFHIRAccessData(fcCurrentStateKey) as fhirclient.ClientState
    console.log(!fhirAccessData ? "Success: fcCurrentStateKey removed." : "ERROR: fcCurrentStateKey still exists!")

    console.log(`Testing fcAllStatesKey`)
    const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
      await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>
    console.log(!arrayOfFhirAccessDataObjects ? "Success: fcAllStatesKey removed." : "ERROR: fcAllStatesKey still exists!")

    console.log(`Testing launcherDataKey`)
    const launcherData: ProviderEndpoint = await getLauncherData() as ProviderEndpoint
    console.log(!launcherData ? "Success: launcherDataKey removed." : "ERROR: launcherDataKey still exists!")

    console.log(`Testing sessionIdKey`)
    console.log(`TODO: Sravan to write this test once implemented...`)
  }
}
