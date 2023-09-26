import * as React from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import FHIR from 'fhirclient'
import { getFHIRData } from '../../data-services/fhirService'
import {
  ProviderEndpoint, buildAvailableEndpoints,
  getMatchingProviderEndpointsFromName
} from '../../data-services/providerEndpointService'
import {
  isGivenEndpointMatchesLastActiveEndpoint, isEndpointStillAuthorized,
  saveSelectedEndpoints, deleteSelectedEndpoints
} from '../../data-services/persistenceService'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { FHIRData } from '../../data-services/models/fhirResources'

import { Theme, useTheme } from '@mui/material/styles'
import OutlinedInput from '@mui/material/OutlinedInput'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'

interface Props extends RouteComponentProps {
  setFhirDataStates: (data: FHIRData[] | undefined) => void,
  setAndLogProgressState: (message: string, value: number) => void,
  setResourcesLoadedCountState: (count: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void,
  resetErrorMessageState: () => void,
}

interface LocationState {
  fhirDataCollection?: FHIRData[],
}

export default function ProviderLogin(props: Props) {
  const { fhirDataCollection } = props.location.state as LocationState;

  let history = useHistory()

  const availableEndpoints: ProviderEndpoint[] = buildAvailableEndpoints()

  const [selectedEndpointNames, setselectedEndpointNames] = React.useState<string[]>([]);

  const authorizeSelectedEndpoints = async (endpointsToAuthorize: ProviderEndpoint[]): Promise<void> => {
    console.log('authorizeSelectedEndpoints(): endpointsToAuthorize: ', JSON.stringify(endpointsToAuthorize))

    if (endpointsToAuthorize && endpointsToAuthorize.length > 0) {
      const endpointsLength = endpointsToAuthorize.length

      // Loop endpoints to see if any exist that are not already authorized (however unlikely that may be)
      // TODO: Consider getting all endpoins first, then after fully looping, decide what to do
      for (let i = 0; i < endpointsLength; i++) {
        const curEndpoint: ProviderEndpoint = endpointsToAuthorize[i]
        console.log("curEndpoint", curEndpoint)
        const issServerUrl = curEndpoint.config!.iss
        console.log("issServerUrl", issServerUrl)
        const isLastIndex = i === endpointsLength - 1
        console.log("isLastIndex: " + isLastIndex)

        // Check for prior auths from another load or session just in case so we can save some time
        if (await isEndpointStillAuthorized(issServerUrl!, false)) { // false so checking ALL endpoints in local storage vs just last one
          console.log("This endpoint IS authorized")
          console.log("curEndpoint issServerUrl " + issServerUrl + " at index " + i + " and count " + (i + 1) + "/" + endpointsLength +
            " is still authorized. Will not waste time reauthorizing: ", curEndpoint)

          if (isLastIndex) {
            console.log("All endpoints are already authorized.")

            // Do NOT need to save data for endpoints to be loaded as we don't need to reload the app
            console.log("Deleting multi-select endpoints from local storage so they don't intefere with future selections")
            deleteSelectedEndpoints()

            console.log("Loading data from all endpoints without leaving the application")
            await loadSelectedEndpoints(endpointsToAuthorize) // TODO: Consider returning true and having handleSubmit call this instead based on true
          }

        } else {
          console.log("This endpoint is NOT authorized")
          console.log("curEndpoint issServerUrl " + issServerUrl + " at index " + i +
            " and count " + (i + 1) + "/" + endpointsLength +
            " is NOT authorized.", curEndpoint)

          // Save selected endpoints so app load after exiting app for auth knows that it is a multi load of specific endpoints
          console.log("At Least one endpoint is not authorized yet...Saving multi-select endpoints")
          const selectedEndpointsToSave: string[] =
            endpointsToAuthorize
              .map((curEndpoint, index) => {
                if (curEndpoint.config && curEndpoint.config.iss) {
                  console.log("matched endpoint: " + curEndpoint.config.iss)
                  return curEndpoint.config.iss
                }
                return undefined
              })
              .filter((endpoint) => endpoint !== undefined)
              .map((endpoint) => endpoint as string)
          console.log("selectedEndpointsToSave: ", JSON.stringify(selectedEndpointsToSave))
          saveSelectedEndpoints(selectedEndpointsToSave)

          console.log("Reauthorizing curEndpoint.config!:", curEndpoint.config!)
          // The following authorization will exit the application. Therefore, if it's not the last index,
          // then we will have more endpoints to authorize when we return, on load.
          if (isLastIndex) {
            console.log("Authorizing last index")
          } else {
            console.log("Not last index, Authorizing index " + i)
          }

          FHIR.oauth2.authorize(curEndpoint.config!)

          break
        }

      }

    } else {
      console.log("endpointsToAuthorize is untruthy or has no data")
    }

  }

  const loadAuthorizedSelectedEndpointMulti = async (selectedEndpoint: ProviderEndpoint,
    isMultipleProviders: boolean, fhirDataCollectionIndex: number): Promise<FHIRData | undefined> => {
    console.log('loadAuthorizedSelectedEndpointMulti(): selectedEndpoint: ' + JSON.stringify(selectedEndpoint))
    console.log('loadAuthorizedSelectedEndpointMulti(): isMultipleProviders: ' + isMultipleProviders)
    console.log('loadAuthorizedSelectedEndpointMulti(): fhirDataCollectionIndex: ' + fhirDataCollectionIndex)

    if (selectedEndpoint !== null) {
      const issServerUrl = selectedEndpoint.config!.iss
      console.log('issServerUrl:', issServerUrl)

      let fhirDataFromStoredEndpoint: FHIRData | undefined = undefined

      console.log("fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!)")
      fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!, props.setAndLogProgressState,
        props.setResourcesLoadedCountState, props.setAndLogErrorMessageState)
      console.log("fhirDataFromStoredEndpoint", JSON.stringify(fhirDataFromStoredEndpoint))

      return fhirDataFromStoredEndpoint
    } else {
      console.error("endpoint === null")
    }
  }

  // Note: We can't load here most of the time (unless all are already authorized, then we load here)
  // as this multiselect can only really kick off the auth logic (vs the data). After application (re)load,
  // after all authorized, we call similar logic again
  const loadSelectedEndpoints = async (endpointsToLoad: ProviderEndpoint[]): Promise<void> => {
    console.log('loadSelectedEndpoints()')
    const fhirDataCollection: FHIRData[] = []

    try {
      console.log("redirecting to '/' right away as loading multiple endpoints")
      history.push('/')

      let index: number = 0;
      for (const curSelectedEndpoint of endpointsToLoad) {
        console.log('curSelectedEndpoint #' + (index + 1) + ' at index: ' + index + ' with value:', curSelectedEndpoint)

        // Reset of state to undefined for loader and error message reset have to happen after each index is loaded
        // in this multi version vs all at end like in singular version
        console.log('setting fhirData to undefined so progess indicator is triggered while new data is loaded subsequently')
        props.setFhirDataStates(undefined)
        props.resetErrorMessageState()

        const curFhirDataLoaded: FHIRData | undefined =
          await loadAuthorizedSelectedEndpointMulti(curSelectedEndpoint, true, index)
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
      props.setFhirDataStates(fhirDataCollection!)
      console.log("fhirDataCollection complete in loadSelectedEndpoints:", fhirDataCollection)
    }

  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedEndpointNames) {

      if (selectedEndpointNames.length === 0) {
        console.log("selectedEndpoint array is empty")
        return // Cannot continue so returning but this should not be possible since we have disabled the login button in this case
      } else if (selectedEndpointNames.length > 0) {
        console.log("selectedEndpoint array has data")

        let matchingProviderEndpoints: ProviderEndpoint[] =
          await getMatchingProviderEndpointsFromName(availableEndpoints, selectedEndpointNames)
        console.log('matchingProviderEndpoints: ', matchingProviderEndpoints);

        if (matchingProviderEndpoints && matchingProviderEndpoints.length > 0) {
          let selectedEndpoint = null
          if (matchingProviderEndpoints.length === 1) {
            console.log("single provider")
            // select first provider since there is only 1
            const firstProviderIndex = 0
            selectedEndpoint = matchingProviderEndpoints[firstProviderIndex]
            await loadSelectedEndpointSingle(selectedEndpoint, false, firstProviderIndex)
          } else if (matchingProviderEndpoints.length > 1) {
            console.log("multiple providers: length: " + matchingProviderEndpoints.length)
            try {
              // Loop selectedEndpoint logic for all available providers
              await authorizeSelectedEndpoints(matchingProviderEndpoints)
              // TODO: MULTI-PROVIDER: Consider calling loadSelectedEndpoints if we have authorizeSelectedEndpoints return
              // a boolean and base the call on that being true in the limited cases
              console.log('Finished loading multiple matching provider endpoints...');
            } catch (error) {
              console.error('Error loading multiple matching provider Endpoints:', error);
            }
          }

        } else {
          console.error('matchingProviderEndpoints is untruthy or empty')
        }

      }

    } else {
      console.error('selectedEndpointNames is untruthy', selectedEndpointNames)
    }

  }

  // TODO: MULTI-PROVIDER: For now this version works for only 1 provider, not multi. We should look to refactor for code re-use
  const loadSelectedEndpointSingle = async (selectedEndpoint: ProviderEndpoint,
    isMultipleProviders: boolean, fhirDataCollectionIndex: number): Promise<void> => {
    console.log('loadSelectedEndpointSingle(): selectedEndpoint: ' + selectedEndpoint)
    console.log('loadSelectedEndpointSingle(): isMultipleProviders: ' + isMultipleProviders)
    console.log('loadSelectedEndpointSingle(): fhirDataCollectionIndex: ' + fhirDataCollectionIndex)

    if (selectedEndpoint !== null) {
      const issServerUrl = selectedEndpoint.config!.iss
      console.log('issServerUrl:', issServerUrl)

      //!FUNCTION DIFF! isLastLoadMultiSelect related code including check in main if case.
      // Otherwise, we'd have a bug where we'd load multi - data when choosing single in some cases
      // Single to multi should be fine, as it will automatically expand, and call a separate function anyway
      const isLastLoadMultiSelect = fhirDataCollection && fhirDataCollection.length > 1
      if (isLastLoadMultiSelect) {
        // TODO: MULTI-PROVIDER: Add logic to allow single load after multi which retains relevant data, if any (may be a new endpoint, so may be none)
        console.log("Last load was multi-select, can't reload single select data without further logic (match url and reduce fhirDataColleciton array")
      } else {
        console.log("Last load was single-select")
      }
      if (await isGivenEndpointMatchesLastActiveEndpoint(issServerUrl!) && !isLastLoadMultiSelect) {
        console.log("is last endpoint")
        if (await isEndpointStillAuthorized(issServerUrl!, true)) { // Only checks last endpoint
          console.log("is last endpoint and IS authorized")
          console.log("Redirect w/o a refresh as the data should be in our React state already")
          // It may seem silly that a user would do this (select the same thing they are already viewing)
          // but it will happen at least by accident at some point, and thus we won't reload the data, but will just go home since the data is already there
          // TODO: Consider more error checking of fhirData, check important properties?
          // TODO: Make sure we are fully handling back button during authorization situations
          // (Should be handled with empty fhir data case, and should be handled by local storage, but need to ensure user experience makes sense in such situations.
          // If local storage becomes corrupt in production, it's external so difficult to manage - so want to ensure that is tested for all edge cases prior to prod deployment)
          if (fhirDataCollection && fhirDataCollection[fhirDataCollectionIndex]) {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is truthy, navigating home w/o reload or passing data:",
                JSON.stringify(fhirDataCollection[fhirDataCollectionIndex]))
            if (!isMultipleProviders) {
              // If there is only one provider, and we already have the data, we can just navigate back
              history.push('/')
            } else {
              // Otherwise, if multiple providers, we need to reload the data, if it's not the first item in the colleciton
              // TODO: Add logic to check for and handle above for performance.
              // TODO: Authorization logic has to be rewritten. Need to compare fhirDataCollection to localStorage
              // For now, we need to test reauthorizing everything I think with data aggregation
              // Then support dropping reaut later. So, need to bypass a lot of this logic to test...
              console.log("is last loaded endpoint but we are loading multiple providers, reauthorizing for now",
                fhirDataCollection && fhirDataCollection[fhirDataCollectionIndex])
              FHIR.oauth2.authorize(selectedEndpoint.config!)
            }
            // TODO: Do we need to handle a case where the endpoint is the same, but the user wants to select a different patient?
            // If so, they don't need a reauth, but they do need to be redirected to choose a new patient...
          } else {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is falsey, reauthorizing as data cannot be trusted/does not exist:",
                fhirDataCollection && fhirDataCollection[fhirDataCollectionIndex])
            // TODO: Consider externalizing logic in "NOT last endpoint but IS already/still authorized" and use that in this case
            // It should work fine as the local storage fhirAccessState should be in tact and we can fetch the data from the server w/o a reauth
            FHIR.oauth2.authorize(selectedEndpoint.config!)
          }
        } else {
          console.log("is last endpoint but is NOT authorized - reauthorizing")
          // Techincally, if needed, we could redirect w/o refresh as in the "is last endpoint and IS authorized" path,
          // but for now we are going to assume the data may have changed enough at this point to require a reauthorization
          FHIR.oauth2.authorize(selectedEndpoint.config!)
        }
      } else {
        console.log("NOT last endpoint")
        if (await isEndpointStillAuthorized(issServerUrl!, false)) { // This checks all endpoints in array, not just last endpoint accessed
          console.log("NOT last endpoint but IS already/still authorized")
          try {
            console.log('Reload data (which is NOT local at this point, other than the fhirAccessData state object) without requiring reauthorization/redirect')
            let fhirDataFromStoredEndpoint: FHIRData | undefined = undefined
            try {
              console.log('setting fhirData to undefined so progess indicator is triggered while new data is loaded subsequently')
              props.setFhirDataStates(undefined)
              props.resetErrorMessageState()
              console.log("redirecting to '/'")
              history.push('/')
              console.log("fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!)")
              fhirDataFromStoredEndpoint = await getFHIRData(true, issServerUrl!, props.setAndLogProgressState,
                props.setResourcesLoadedCountState, props.setAndLogErrorMessageState)
            } catch (err) {
              console.log(`Failure calling getFHIRData(true, issServerUrl!) from ProviderLogin.tsx handleSubmit: ${err}`)
              console.log('fallback to authorization due to above failure')
              // TODO: Add logic to ensure that fhirAccess obj and array are not updated (or are reverted) from a faulty no-auth load attempt
              // Note: We don't need to setAndLogErrorMessageState/can catch the error because we have provided an alternative application path
              // Once the application redirects, when it reloads, any error will be handled by the getFhirData call in componentDidMount
              FHIR.oauth2.authorize(selectedEndpoint.config!)
            } finally {
              console.log('Set fhir data states with Route prop directly using App callback function')
              props.setFhirDataStates([fhirDataFromStoredEndpoint!])
            }
          } catch (err) {
            // Catches if setFhirDataStates in finally fails
            console.log(`Failure setting fhir data states after getFHIRData call in ProviderLogin.tsx handleSubmit: ${err}`)
            console.log('fallback to authorization due to above failure')
            // TODO: Add logic to ensure that fhirAccess obj and array are not updated (or are reverted) from a faulty no-auth load attempt
            FHIR.oauth2.authorize(selectedEndpoint.config!)
          }
        } else {
          console.log("NOT last endpoint and NOT still authorized - reauthorizing")
          FHIR.oauth2.authorize(selectedEndpoint.config!).catch(err => {
            // Todo: Handle this (and all other redirects) properly in the UI (notify the user) and in the logic if needed
            // Also, may need a time out if the server is not returning an error and it just infinitely loads otherwise
            console.log("Failed to redirect and authorize: " + err)
          })
        }
      }
    } else {
      console.error("endpoint === null")
    }
  }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }

  const handleChange = (event: SelectChangeEvent<typeof selectedEndpointNames>) => {
    const targetVal = event.target.value
    console.log('targetVal:', targetVal)

    if (!targetVal) {
      console.error("selectedEndpointNames is somehow untruthy, setting to empty")
      setselectedEndpointNames([])
    } else {
      const parsedProviderEndpoints: string[] =
        typeof targetVal === 'string' ? targetVal.split(',') : targetVal
      setselectedEndpointNames(parsedProviderEndpoints)
      console.log('selectedEndpointNames (parsedProviderEndpoints)', selectedEndpointNames)
    }
  }

  const theme = useTheme();
  const getStyles = (availableEndpointName: string, selectedEndpointNames: string[] | null,
    theme: Theme): any => {
    return {
      fontWeight:
        selectedEndpointNames?.indexOf(availableEndpointName) === -1
          ? theme.typography.fontWeightRegular
          : theme.typography.fontWeightBold
    }
  }

  return (
    <>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>

        {/* <h4>selectedEndpointNames: {selectedEndpointNames}</h4> */}

        <Typography variant="h5" gutterBottom>
          Health Provider Login
        </Typography>

        <Grid container spacing={3}>

          <Grid item xs={12}>
            <FormControl fullWidth>

              <InputLabel variant="standard" htmlFor="uncontrolled-native">
                Select one or more healthcare providers
              </InputLabel>

              <Select
                labelId="multiple-provider-selection-label"
                id="multiple-provider-selection"
                multiple
                value={selectedEndpointNames}
                onChange={handleChange}
                input={<OutlinedInput id="select-multiple-provider-chip" label="multiple-provider-chip" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected?.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {availableEndpoints.map((availableEndpoint: ProviderEndpoint) => (
                  <MenuItem
                    key={availableEndpoint.name}
                    value={availableEndpoint.name}
                    style={getStyles(availableEndpoint.name ? availableEndpoint.name : '',
                      selectedEndpointNames, theme)}
                  >
                    {availableEndpoint.name}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" disabled={!selectedEndpointNames || selectedEndpointNames.length < 1}
              fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Login
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="reset" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Cancel
            </Button>
          </Grid>

        </Grid>
      </Box>
    </>
  )

}
