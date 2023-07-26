import * as React from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import FHIR from 'fhirclient'
import { fhirclient } from 'fhirclient/lib/types'
import { getFHIRData } from '../../data-services/fhirService'
import {
  isGivenEndpointMatchesLastActiveEndpoint, isEndpointStillAuthorized
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
import Chip from '@mui/material/Chip';

class ProviderEndpoint {
  name: string
  config?: fhirclient.AuthorizeParams

  constructor(name: string, config?: fhirclient.AuthorizeParams) {
    this.name = name
    this.config = config
  }
}

interface Props extends RouteComponentProps {
  setFhirDataStates: (data: FHIRData | undefined) => void,
  setAndLogProgressState: (message: string, value: number) => void,
  setResourcesLoadedCountState: (count: number) => void,
  setAndLogErrorMessageState: (errorType: string, userErrorMessage: string,
    developerErrorMessage: string, errorCaught: Error | string | unknown) => void,
  resetErrorMessageState: () => void,
}

interface LocationState {
  fhirData?: FHIRData,
}

export default function ProviderLogin(props: Props) {
  const { fhirData } = props.location.state as LocationState;

  let history = useHistory()

  const availableEndpoints: ProviderEndpoint[] = [
    {
      name: 'OCHIN',
      config: {
        iss: "https://webprd.ochin.org/prd-fhir/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
      }
    },
    {
      name: 'Providence in Oregon/California',
      config: {
        iss: "https://haikuor.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
      }
    },
    {
      name: 'Providence in Washington/Montana',
      config: {
        iss: "https://haikuwa.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
      }
    }
  ]

  if (process.env.REACT_APP_ADD_MELD_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Meld Sandbox',
        config: {
          iss: process.env.REACT_APP_MELD_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_meld_mcc,
          scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_EPIC_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Epic Sandbox',
        config: {
          iss: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_epic_sandbox,
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_CERNER_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Cerner Sandbox',
        config: {
          iss: process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_cerner_sandbox,
          scope: process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_SCOPE
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_VA_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: VA Sandbox',
        config: {
          iss: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_va,
          scope: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_NEXTGEN_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: NextGen Sandbox',
        config: {
          iss: process.env.REACT_APP_NEXTGEN_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_nextgen,
          scope: process.env.REACT_APP_NEXTGEN_SANDBOX_ENDPOINT_SCOPE
        }
      }
    )
  }

  const [selectedEndpointNames, setselectedEndpointNames] = React.useState<string[]>([]);

  const getMatchingProviderEndpoints = async (availableEndpoints: ProviderEndpoint[],
    selectedEndpointNames: string[]): Promise<ProviderEndpoint[]> => {
    return availableEndpoints.filter(availableEndpoint => {
      console.log('availableEndpoint.name: ', availableEndpoint.name)
      return selectedEndpointNames.includes(availableEndpoint.name);
    })
  }

  const loadSelectedEndpoint = async (selectedEndpoint: ProviderEndpoint, isMultipleProviders: boolean): Promise<void> => {
    console.log('loadSelectedEndpoint(): isMultipleProviders: ' + isMultipleProviders)
    if (selectedEndpoint !== null) {
      const issServerUrl = selectedEndpoint.config!.iss
      console.log('issServerUrl:', issServerUrl)
      if (await isGivenEndpointMatchesLastActiveEndpoint(issServerUrl!)) {
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
          if (fhirData) {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is truthy, navigating home w/o reload or passing data:", JSON.stringify(fhirData))
            history.push('/')
            // TODO: Do we need to handle a case where the endpoint is the same, but the user wants to select a different patient?
            // If so, they don't need a reauth, but they do need to be redirected to choose a new patient...
          } else {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is falsey, reauthorizing as data cannot be trusted/does not exist:", fhirData)
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
              props.setFhirDataStates(fhirDataFromStoredEndpoint!)
            }
            console.log("fhirDataFromStoredEndpoint", JSON.stringify(fhirDataFromStoredEndpoint))
          } catch (err) {
            // catches if setFhirDataStates in finally fails
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

  // TODO: Finish logic so that we end up with more than one provider loaded at once, vs overwriting with latest
  const loadSelectedEndpoints = async (getMatchingProviderEndpoints: ProviderEndpoint[]): Promise<void> => {
    console.log('loadSelectedEndpoints()')
    let i: number = 1;
    for (const curSelectedEndpoint of getMatchingProviderEndpoints) {
      console.log('curSelectedEndpoint #' + i + ' at index: ' + (i - 1) + ' with value:', curSelectedEndpoint)
      await loadSelectedEndpoint(curSelectedEndpoint, true)
      i++;
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedEndpointNames) {

      if (selectedEndpointNames.length === 0) {
        console.log("selectedEndpoint array is empty")
        // Cannot continue so returning but this should not be possible since we have disabled the login button in this case
        return
      } else if (selectedEndpointNames.length > 0) {

        console.log("selectedEndpoint array has data")

        let matchingProviderEndpoints: ProviderEndpoint[] =
          await getMatchingProviderEndpoints(availableEndpoints, selectedEndpointNames)
        console.log('matchingProviderEndpoints: ', matchingProviderEndpoints);

        if (matchingProviderEndpoints && matchingProviderEndpoints.length > 0) {
          let selectedEndpoint = null
          if (matchingProviderEndpoints.length === 1) {
            console.log("single provider")
            // select first provider since there is only 1
            selectedEndpoint = matchingProviderEndpoints[0]
            await loadSelectedEndpoint(selectedEndpoint, false)
          } else if (matchingProviderEndpoints.length > 1) {
            console.log("multiple providers: length: " + matchingProviderEndpoints.length)
            // Loop selectedEndpoint logic for all available providers
            console.log(`DISABLED FOR NOW as there is no way to combine the data yet`)
            /*
            loadSelectedEndpoints(matchingProviderEndpoints)
              .then(() => {
                console.log('All matchingProviderEndpoints loaded...');
              })
              .catch((error) => {
                console.error('Error loading matchingProviderEndpoints:', error);
              })
            */
          }
        } else {
          console.error('matchingProviderEndpoints is untruthy or empty')
        }

      }

    } else {
      console.error('selectedEndpointNames is untruthy', selectedEndpointNames)
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
