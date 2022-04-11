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
import { Goal, Resource, CodeableConcept, Reference } from '../../fhir-types/fhir-r4';
// import SaveCancelButtons from './SaveCancelButtons'

import { FHIRData } from '../../models/fhirResources';
import { PatientSummary } from '../../models/cqlSummary';

interface GoalFormProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary
}

interface GoalFormState {
  description?: string | undefined | null
  startDate?: Date | undefined | null
  dueDate?: Date | undefined | null
  subjectRef?: Reference
  expressedByRef?: Reference
  achievementStatus?: CodeableConcept
}

export default class GoalEditForm extends React.Component<GoalFormProps, GoalFormState> {

  constructor(props: GoalFormProps) {
    super(props);
    let hasPatientId = this.props.fhirData?.patient?.id !== undefined
    let hasUserId = this.props.fhirData?.fhirUser?.id !== undefined
    this.state = {
      description: '',
      startDate: new Date(),
      dueDate: null,  // must use null instead of undefined for MUI date widget
      subjectRef: hasPatientId ? {
        reference: 'Patient/' + this.props.fhirData?.patient?.id,
        display: this.props.patientSummary?.fullName
      } : undefined,
      expressedByRef: hasUserId ? {
        reference: this.props.fhirData?.fhirUser?.resourceType + '/' + this.props.fhirData?.fhirUser?.id,
        display: this.props.fhirData?.caregiverName as string ?? this.props.patientSummary?.fullName
      } : undefined,
      achievementStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/goal-achievement',
            code: 'in-progress',
            display: 'In Progress'
          }
        ],
        text: 'In Progress'
      }
    };
  }

  componentDidMount() {
    
  }
  
  setDescription(newValue?: string) {
    this.setState({ description: newValue })
  }

  setStartDate(newValue?: Date | null | undefined) {
    // must support null for MUI date widget value
    let date = newValue === null ? undefined : newValue
    this.setState({ startDate: date })
  }

  setDueDate(newValue?: Date | null | undefined) {
    // must support null for MUI date widget value
    let date = newValue === null ? undefined : newValue
    this.setState({ dueDate: date })
  }

  handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.subjectRef === undefined) {
      return
    }
    const description = { text: this.state.description ?? 'No description provided' }
    const goalTargets = (this.state.dueDate !== undefined) ? [{ dueDate: this.state.dueDate?.toISOString() }] : undefined
    
    var goal: Goal = {
      resourceType: 'Goal',
      lifecycleStatus: 'active',
      achievementStatus: this.state.achievementStatus,
      description: description,
      subject: this.state.subjectRef!,
      expressedBy: this.state.expressedByRef,
      startDate: this.state.startDate?.toISOString(),
      target: goalTargets
    }
    console.log('New Goal: ' + JSON.stringify(goal))

    // reset form for next Goal before async create
    this.resetFormData()

    // save to FHIR server
    this.createResource(goal)
  }

  handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    this.resetFormData()

    // go Back
  }

  resetFormData() {
    this.setState({
      description: '',
      startDate: new Date(), 
      dueDate: null
    })
  }

  public render(): JSX.Element {
    return (
      <React.Fragment>
      <Box component="form" noValidate onSubmit={this.handleSubmit} onReset={this.handleReset} sx={{ mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Health Goal
          </Typography>
          <Grid container spacing={3}>
  
          <Grid item xs={12}>
              <TextField
              value={this.state.description}
              onChange={(e) => {
                  this.setDescription(e.target.value);
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
                      value={this.state.startDate}
                      onChange={(newValue) => {
                          this.setStartDate(newValue);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth variant="standard" />}
                  />
              </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                      label="Due Date"
                      value={this.state.dueDate}
                      onChange={(newValue) => {
                          this.setDueDate(newValue);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth variant="standard" />}
                  />
              </LocalizationProvider>
          </Grid>
  
          {/* <SaveCancelButtons saveHandler={console.log('save resource handler')} /> */}

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

  private createResource(resource: Resource) {
    if (this.state.subjectRef === undefined) { return }

    return FHIR.oauth2.ready()
        .then((client: Client) => {
            return client.create(resource as fhirclient.FHIR.Resource)
        })
        .then((response) => {
            return response
        }).catch(error => {
            console.log('Cannot create new resource: ' + resource.resourceType + '/' + resource.id + ' error: ', error)
            return
        });
  }
}
