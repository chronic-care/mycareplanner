import * as React from 'react'
import { useHistory } from 'react-router-dom'
// import FHIR from 'fhirclient'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { FHIRData } from '../../data-services/models/fhirResources'
import { ConditionSummary } from '../../data-services/models/cqlSummary'
// import { getSupplementalDataClient } from '../../data-services/fhirService'
// import Client from 'fhirclient/lib/Client'
import { createSharedDataResource, getSupplementalDataClient, updateSharedDataResource } from '../../data-services/fhirService';
import { Condition, Goal } from '../../data-services/fhir-types/fhir-r4'
import Client from 'fhirclient/lib/Client'
interface ShareDataProps {

  fhirDataCollection?: FHIRData[]
 
}

export default function ShareData(props: ShareDataProps) {

  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    getSupplementalDataClient().then(sdsClient => {

      if (sdsClient) {
        const patientID = sdsClient.getPatientId()
        const patientName: string | null = null

        const subjectRef = patientID != null ? {
          reference: 'Patient/' + patientID,
          display: (patientName) ? patientName : undefined
        } : undefined

        props.fhirDataCollection!.forEach((fhirData) => {
          updateSharedDataResource(fhirData.patient!);

          fhirData.conditions?.forEach((condition) => {
            updateSharedDataResource(condition)
          });

          fhirData.goals?.forEach((goal) => {
            updateSharedDataResource(goal)
          });

          fhirData.goals?.forEach((immunization) => {
            updateSharedDataResource(immunization)
          });

          fhirData.goals?.forEach((medication) => {
            updateSharedDataResource(medication)
          });

          fhirData.goals?.forEach((serviceRequests) => {
            updateSharedDataResource(serviceRequests)
          });

          fhirData.procedures?.forEach((procedures) => {
            updateSharedDataResource(procedures)
          });

          fhirData.labResults?.forEach((labResults) => {
            updateSharedDataResource(labResults)
          });

          fhirData.vitalSigns?.forEach((vitalSigns) => {
            updateSharedDataResource(vitalSigns)
          });

          fhirData.socialHistory?.forEach((socialHistory) => {
            updateSharedDataResource(socialHistory)
          });

          fhirData.surveyResults?.forEach((surveyResults) => {
            updateSharedDataResource(surveyResults)
          });

        });
      }
    })
      .catch(error => {
        console.error(error.message);
      });

    history.goBack()

  }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }

  return (
    <React.Fragment>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Share Your Health Data
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
              Add a consent statement and buttons to 'Agree' or 'Disagree' before sharing data.
          </Typography>
            <Typography variant="body1" gutterBottom>
              Sharing required authentication into the shared data store repository, e.g. a Personal Health Repository(PHR).
          </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Share Data
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