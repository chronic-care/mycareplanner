import * as React from 'react';
// import { useParams } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom'
import moment from 'moment';

import AdapterDateFns from '@mui/lab/AdapterDateFns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DatePicker from '@mui/lab/DatePicker';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { EditFormData } from '../../data-services/models/cqlSummary';
import { Goal } from '../../data-services/fhir-types/fhir-r4';
import { createSharedDataResource } from '../../data-services/fhirService';

export default function GoalEditForm(formData?: EditFormData) {
  let history = useHistory()
  const location = useLocation(); 
  const prepopulatedDescription = (location.state as { prepopulatedDescription?: string })?.prepopulatedDescription ?? '';
  const prepopulatedDate = (location.state as { prepopulatedDate?: Date })?.prepopulatedDate ?? null; 
  const prepopulatedDueDate = (location.state as {prepopulatedDueDate?: Date})?.prepopulatedDueDate ?? null;
  const [description, setDescription] = React.useState<string>(prepopulatedDescription);
  const [startDate, setStartDate] = React.useState<Date | null>(
    prepopulatedDate ? moment(prepopulatedDate).add(0, 'day').toDate() : null
  );
  
  const [dueDate, setDueDate] = React.useState<Date | null>(
    prepopulatedDueDate ? moment(prepopulatedDueDate).add(0, 'day').toDate() : null
  );

  const patientID = formData?.supplementalDataClient?.getPatientId()
  const patientName: string | null = null   // TODO: find patient with matching ID from formData?patientSummaries
  const fhirUser = formData?.supplementalDataClient?.getFhirUser()
  const userName: string | null = null   // TODO: find user with matching ID from formData?patientSummaries or CareTeam

  const subjectRef = patientID != null ? {
    reference: 'Patient/' + patientID,
    display: (patientName) ? patientName : undefined
  } : undefined
  const expressedByRef = fhirUser != null ? {
    reference: fhirUser,
    display: (userName) ? userName : undefined
  } : undefined

  const achievementStatus = {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/goal-achievement',
        code: 'in-progress',
        display: 'In Progress'
      }
    ],
    text: 'In Progress'
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subjectRef === undefined) {
      return
    }

    const descriptionCodeable = { text: description ?? 'No description provided' }
    const goalTargets = (dueDate !== undefined) ? [{ dueDate: dueDate?.toISOString() }] : undefined

    var goal: Goal = {
      resourceType: 'Goal',
      lifecycleStatus: 'active',
      achievementStatus: achievementStatus,
      description: descriptionCodeable,
      subject: subjectRef!,
      expressedBy: expressedByRef,
      startDate: startDate?.toISOString(),
      target: goalTargets
    }
    console.log('New Goal: ' + JSON.stringify(goal))

    createSharedDataResource(goal,formData?.fhirDataCollection)

    history.goBack()
  };

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  };

  return (
    <React.Fragment>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ pt: 3, pr: 4, pl: 4, pb: '100%', bgcolor: '#F7F7F7', width: '100%' }}>
        <Typography variant="h5" gutterBottom>
          Health Goal
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <TextField
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
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
            <Button type="reset" fullWidth variant="outlined" sx={{ mt: 3, color: '#355CA8', bgcolor: '#F7F7F7', bordercolor: '#355CA8' }}>
              Cancel
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, bgcolor: '#355CA8' }}>
              Save
            </Button>
          </Grid>

        </Grid>
      </Box>
    </React.Fragment>
  );
}

