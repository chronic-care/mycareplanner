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
import NativeSelect from '@mui/material/NativeSelect'
import { FHIRData } from '../../data-services/models/fhirResources'

class ProviderEndpoint {
  name?: string
  config?: fhirclient.AuthorizeParams
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

  const endpoints: ProviderEndpoint[] = [
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
    endpoints.push(
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
    endpoints.push(
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
    endpoints.push(
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
    endpoints.push(
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
    endpoints.push(
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

  const [endpoint, setEndpoint] = React.useState<ProviderEndpoint | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === '') {
      setEndpoint(null)
    }
    else {
      let endpoint: ProviderEndpoint | null = JSON.parse(event.target.value)
      setEndpoint(endpoint)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (endpoint !== null) {
      const issServerUrl = endpoint.config!.iss
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
            FHIR.oauth2.authorize(endpoint.config!)
          }
        } else {
          console.log("is last endpoint but is NOT authorized - reauthorizing")
          // Techincally, if needed, we could redirect w/o refresh as in the "is last endpoint and IS authorized" path,
          // but for now we are going to assume the data may have changed enough at this point to require a reauthorization
          FHIR.oauth2.authorize(endpoint.config!)
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
              FHIR.oauth2.authorize(endpoint.config!)
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
            FHIR.oauth2.authorize(endpoint.config!)
          }
        } else {
          console.log("NOT last endpoint and NOT still authorized - reauthorizing")
          FHIR.oauth2.authorize(endpoint.config!).catch(err => {
            // Todo: Handle this (and all other redirects) properly in the UI (notify the user) and in the logic if needed
            // Also, may need a time out if the server is not returning an error and it just infinitely loads otherwise
            console.log("Failed to redirect and authorize: " + err)
          })
        }
      }
    }
  }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }

  return (
    <>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Health Provider Login
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel variant="standard" htmlFor="uncontrolled-native">
                Select your healthcare provider
              </InputLabel>
              <NativeSelect
                // defaultValue={}
                inputProps={{
                  name: 'provider',
                  id: 'uncontrolled-native',
                }}
                onChange={handleChange}
              >
                <option key={'not-selected'} value=''></option>
                {endpoints.map((endpoint: ProviderEndpoint) => {
                  return <option key={endpoint.name} value={JSON.stringify(endpoint)}>{endpoint.name}</option>
                })}
              </NativeSelect>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" disabled={endpoint === null} fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
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
