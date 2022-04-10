import * as React from 'react';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DatePicker from '@mui/lab/DatePicker';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { fhirclient } from 'fhirclient/lib/types';
import FHIR from 'fhirclient';
import Client from 'fhirclient/lib/Client';
import { Goal, Resource, Reference } from '../../fhir-types/fhir-r4';

import { FHIRData } from '../../models/fhirResources';
import { PatientSummary } from '../../models/cqlSummary';

export function createResource(goal: Goal){
  return FHIR.oauth2.ready()
      .then((client: Client) => {
          const subject: Reference = {reference: 'Patient/'+(client.getPatientId() ?? 'patient-id')}
          const author: Reference | undefined = client.getFhirUser() ? {reference: client.getFhirUser() ?? 'patient-id'} : undefined
          goal.subject = subject
          goal.expressedBy = author
          console.log('New Goal: ' + JSON.stringify(goal))
          return client.create(goal as fhirclient.FHIR.Resource)
      })
      .then((response) => {
          return response
      }).catch(error => {
          console.log('Cannot create new resource: ' + goal.resourceType + '/' + goal.id + ' error: ', error)
      });
}


export default function GoalEditForm(fhirData?: FHIRData) {
  console.log("data=" + JSON.stringify(fhirData))
  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [dueDate, setDueDate] = React.useState<Date | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      description: data.get('description'),
      startDate: startDate,
      dueDate: dueDate,
    });

    const description = {text: data.get('description')?.toString() ?? 'No description provided'}
    const subject = {display: 'App user'}
    var goal: Goal = {
      resourceType: 'Goal',
      lifecycleStatus: 'active',
      description: description,
      subject: subject,
    }
    createResource(goal)
  };

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log("Cancel editing");
  };

  return (
    <React.Fragment>
    <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Health Goal
        </Typography>
        <Grid container spacing={3}>

        <Grid item xs={12}>
            <TextField
            required
            multiline
            id="description"
            name="description"
            label="Description"
            fullWidth
            minRows={3}
            maxRows={5}
            variant="standard"
            />
        </Grid>

        <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => {
                        setStartDate(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth variant="standard" />}
                />
            </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="Due Date"
                    value={dueDate}
                    onChange={(newValue) => {
                        setDueDate(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth variant="standard" />}
                />
            </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Save
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
  );
}