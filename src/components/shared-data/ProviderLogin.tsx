import * as React from 'react'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import FHIR from 'fhirclient'
import { fhirclient } from 'fhirclient/lib/types'
// import { getFHIRData } from '../../data-services/fhirService'
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
  fhirData?: FHIRData
}

interface LocationState {
  fhirData?: FHIRData
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
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE
      }
    },
    {
      name: 'Providence in Oregon/California',
      config: {
        iss: "https://haikuor.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE
      }
    },
    {
      name: 'Providence in Washington/Montana',
      config: {
        iss: "https://haikuwa.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE
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
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE
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
          scope: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_SCOPE
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

  /*
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (endpoint !== null) {
      FHIR.oauth2.authorize(endpoint.config!)
    }
  }
  */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (endpoint !== null) {
      const issServerUrl = endpoint.config!.iss
      console.log('issServerUrl:', issServerUrl)
      if (await isGivenEndpointMatchesLastActiveEndpoint(issServerUrl!)) {
        console.log("is last endpoint")
        if (await isEndpointStillAuthorized(issServerUrl!, true)) {
          console.log("is last endpoint and IS authorized")
          console.log("Redirect w/o a refresh as the data should be in our React state already")
          // It may seem silly that a user would do this (select the same thing they are already viewing)
          // but if they do, it won't reload the data, it will just go home since the data is there
          // TODO: Consider more error checking of fhirData, check important properties?
          if (fhirData) {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is truthy, navigating home w/o reload or passing data:", JSON.stringify(fhirData))
            // TODO: Consider using contentAPI or a callback function passed from App->Home->Here to update fhirData react state
            // Data should be the same so may not need, will likely need to do in "NOT last endpoint but IS already / still authorized"
            history.push('/')
            // TODO: Do we need to handle a case where the endpoint is the same, but the user wants to select a different paitient?
            // If so, they don't need a reauth, but they do need to be redirected to choose a new patient...
          } else {
            process.env.REACT_APP_TEST_PERSISTENCE === 'true' &&
              console.log("fhirData is falsey, reauthorizing until a non-reauth solution is implemented:", fhirData)
            // TODO: Implement no-reauth solution. Can be a unique version for thie scenario
            // or apply w / e is done "in NOT last endpoint but IS already/still authorized"
            // await getFHIRData(true, issServerUrl!)
            // For now, we can either, reauthorize:
            FHIR.oauth2.authorize(endpoint.config!)
            // Or, assume nothing fishy happened with the UI (like user starting a redirect auth and then hitting back at the last moment), and use history:
            // history.push('/')
          }
        } else {
          console.log("is last endpoint but is NOT authorized - reauthorizing")
          FHIR.oauth2.authorize(endpoint.config!)
        }
      } else {
        console.log("NOT last endpoint")
        if (await isEndpointStillAuthorized(issServerUrl!, false)) { // This check needs to check all endpoints in array, not just last endpoint accessed
          console.log("NOT last endpoint but IS already/still authorized - reauthorize as a temporary flow to reload data")
          try {
            // TODO: This is our most complex use case.
            // TODO: Instead of below call, support reloading the data (which is NOT local at this point,
            // other than an the state object) without requiring reauthorization/redirect.
            // We will likely use the new getFHIRData flow to do this (once implemented)
            FHIR.oauth2.authorize(endpoint.config!)
            // await getFHIRData(true, issServerUrl!)
          } catch (err) {
            console.log(`Failure calling getFHIRData from ProviderLogin.tsx handleSubmit: ${err}`)
          }
        } else {
          console.log("not last endpoint and NOT still authorized - reauthorizing")
          FHIR.oauth2.authorize(endpoint.config!)
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
