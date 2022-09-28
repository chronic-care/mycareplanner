import * as React from 'react'
import { useHistory } from 'react-router-dom'
import FHIR from 'fhirclient'
import { fhirclient } from 'fhirclient/lib/types'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import NativeSelect from '@mui/material/NativeSelect'

class ProviderEndpoint {
  name?: string
  config?: fhirclient.AuthorizeParams
}

export default function ProviderLogin() {
  let history = useHistory()

  const epicScope = "launch launch/patient openid fhirUser patient/Patient.read patient/Practitioner.read patient/RelatedPerson.read patient/Condition.read patient/DiagnosticReport.read patient/Observation.read patient/Procedure.read patient/CarePlan.read patient/CareTeam.read patient/Goal.read patient/Immunization.read patient/MedicationRequest.read patient/Medication.read patient/Provenance.read patient/Organization.read";

  const endpoints: ProviderEndpoint[] = [
    {
      name: 'OCHIN',
      config: {
        iss: "https://webprd.ochin.org/prd-fhir/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: epicScope
      }
    },
    {
      name: 'Providence in Oregon/California',
      config: {
        iss: "https://haikuor.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: epicScope
      }
    },
    {
      name: 'Providence in Washington/Montana',
      config: {
        iss: "https://haikuwa.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: epicScope
      }
    },
    {
      name: 'Vanderbilt',
      config: {
        iss: "https://arr01.service.vumc.org/FHIR-PRD/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: epicScope
      }
    },
    {
      name: 'Walmart Health',
      config: {
        iss: "https://epicinterconnect.walmarthealth.com/Interconnect-OAuth2-PRD/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: epicScope
      }
    },
    {
      name: 'Epic Sandbox (test data)',
      config: {
        iss: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic_sandbox,
        scope: epicScope
      }
    }
  ]

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (endpoint !== null) {
      FHIR.oauth2.authorize(endpoint.config!)
    }
  }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }
  
  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}