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
import { getSupplementalDataClient, updateSharedDataResource } from '../../data-services/fhirService';
import { Practitioner } from '../../data-services/fhir-types/fhir-r4'
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
        props.fhirDataCollection!.forEach((fhirData) => {
        let practitioners = new Array<Practitioner>();
          fhirData?.careTeamMembers?.forEach((value: Practitioner, key: string) => {
            practitioners.push(value);
        });

          Promise.all(practitioners.map(practitioner => updateSharedDataResource(practitioner,fhirData.serverUrl))).then(resource => {

            updateSharedDataResource(fhirData.patient!,fhirData.serverUrl).then(( ) => {

              Promise.all(fhirData.conditions!.map(condition => updateSharedDataResource(condition,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.goals!.map(goal => updateSharedDataResource(goal,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.immunizations!.map(immunization => updateSharedDataResource(immunization,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.medications!.map(medication => updateSharedDataResource(medication,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.serviceRequests!.map(serviceRequest => updateSharedDataResource(serviceRequest,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.procedures!.map(procedure => updateSharedDataResource(procedure,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.labResults!.map(labResult => updateSharedDataResource(labResult,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.vitalSigns!.map(vitalSign => updateSharedDataResource(vitalSign,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.socialHistory!.map(socialHistory => updateSharedDataResource(socialHistory,fhirData.serverUrl))).then(() => { }  );

              Promise.all(fhirData.surveyResults!.map(surveyResult => updateSharedDataResource(surveyResult,fhirData.serverUrl))).then(() => { }  );

            })
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


 
