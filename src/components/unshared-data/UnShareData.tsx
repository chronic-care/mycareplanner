
import FHIR from 'fhirclient'
import * as React from 'react'
import { useHistory } from 'react-router-dom'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { FHIRData } from '../../data-services/models/fhirResources'
import { getSupplementalDataClient } from '../../data-services/fhirService'
import { fhirclient } from 'fhirclient/lib/types'
import Client from 'fhirclient/lib/Client'
import { getFHIRAccessData } from '../../data-services/persistenceService'
import { OperationOutcome } from '../../data-services/fhir-types/fhir-r4'
interface ShareDataProps {
  fhirDataCollection?: FHIRData[],
  setLogout?: () => void, 
}


async function deleteThePatient(sdsClient: Client, patientId: string) {
  console.debug('Start delete resources for ' + patientId);

  try {  
    var response = await sdsClient.delete(patientId + '?_cascade=delete');
    while (response == null || (!JSON.stringify(response).includes('SUCCESSFUL_DELETE'))) {
      response = await sdsClient.delete(patientId + '?_cascade=delete');
    }
    console.debug('Done delete resources for ' + patientId);
    return true;
  } catch (err) {
    console.debug('Error deleting resources for ' + patientId, err);
    return false;
  }
}

async function expungeThePatient(sdsClient: Client, patientId: string, partitionUrl: string) {

  const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
  fhirHeaderRequestOption.method = 'POST';
  fhirHeaderRequestOption.url = patientId + '/$expunge';
  
  const expungeParams = {
    resourceType: "Parameters",
    parameter: [      
          {
            "name": "limit",
            "valueInteger": 999999
          },
          {
            "name": "expungeDeletedResources",
            "valueBoolean": true
          },
          {
            "name": "expungePreviousVersions",
            "valueBoolean": true
          }
        ]    
  };

  const fhirHeaders = {
    'Content-Type': 'application/json',
    'X-Partition-Name': partitionUrl
  };

  fhirHeaderRequestOption.headers = fhirHeaders;
  fhirHeaderRequestOption.body = JSON.stringify(expungeParams);

  console.debug('Start expunge for ' + patientId);

  try {
    await sdsClient.request(fhirHeaderRequestOption);
    console.debug('Done expunge resources for ' + patientId);
    return true;
  } catch (err) {
    console.debug('Error expunging resources for ' + patientId, err);
    return false;
  }
}

async function delete3rdPartyPatient(sdsClient: Client, patientId: string, partitionUrl: string) {

  const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
  fhirHeaderRequestOption.method = 'DELETE';
  fhirHeaderRequestOption.url = patientId + '?_cascade=delete';
  
  const fhirHeaders = { 
    'Content-Type': 'application/json',
    'X-Partition-Name': partitionUrl
  };
  fhirHeaderRequestOption.headers = fhirHeaders;  
  console.debug('Start delete for ' + patientId);
  try {
    var response = await sdsClient.request(fhirHeaderRequestOption);
    while (response == null || (!JSON.stringify(response).includes('SUCCESSFUL_DELETE'))) {
      response = await sdsClient.request(fhirHeaderRequestOption);
    }
    console.debug('Done delete resources for ' + patientId);
    return true;
  } catch (err) {
    console.debug('Error deleting resources for ' + patientId, err);
    return false;
  }
}



const LF_ID = '-MCP'
const fcAllStatesKey = 'fhir-client-states-array' + LF_ID
export default function UnShareData(props: ShareDataProps) {

  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    
    getSupplementalDataClient().then(async sdsClient => {

      const arrayOfFhirAccessDataObjects: Array<fhirclient.ClientState> =
      await getFHIRAccessData(fcAllStatesKey) as Array<fhirclient.ClientState>

      let authorizedUrl = arrayOfFhirAccessDataObjects[0].serverUrl;
    
      if (sdsClient) {
        sdsClient.request('Linkage?item=Patient/' + sdsClient.patient.id).then(async linkages => {
          var deleteSet = new Set();  
          // let tehAuthorizedUrl =  props.fhirDataCollection ?  props.fhirDataCollection[0].serverUrl : 'error';     
          deleteSet.add(authorizedUrl)
          for (const entry of linkages.entry) {
            for (const item of entry.resource.item) {
             
                if (item.type === 'alternate') {
                  if (!deleteSet.has( item.resource.extension[0].valueUrl)) {
                  deleteSet.add(item.resource.extension[0].valueUrl)
                  console.debug('Start UnShareData unauthorized foreign '+item.resource.reference + "  " + item.resource.extension[0].valueUrl);
                  await delete3rdPartyPatient(sdsClient, item.resource.reference,item.resource.extension[0].valueUrl);
                  console.debug('End UnShareData unauthorized foreign '+item.resource.reference + "  " + item.resource.extension[0].valueUrl);
                }
              }
            }
          }

          for (const entry of linkages.entry) {
            for (const item of entry.resource.item) {                     
                if (item.type === 'source') {
                  if (!deleteSet.has(item.resource.extension[0].valueUrl)) {       
                  deleteSet.add(item.resource.extension[0].valueUrl)
                  console.debug('Start UnShareData local sds '+item.resource.reference + "  " + item.resource.extension[0].valueUrl);
                  await deleteThePatient(sdsClient, item.resource.reference);
                  console.debug('End UnShareData local sds '+item.resource.reference + "  " + item.resource.extension[0].valueUrl);
                }
              }
            }
          }

          for (const entry of linkages.entry) {
            for (const item of entry.resource.item) {
            
                if (item.type === 'alternate') {
                  if (item.resource.extension[0].valueUrl===authorizedUrl) {
                  console.debug('Start UnShareData authorized '+item.resource.reference  + "  " + item.resource.extension[0].valueUrl);
                  await delete3rdPartyPatient(sdsClient, item.resource.reference,item.resource.extension[0].valueUrl);
                  console.debug('End UnShareData authorized '+item.resource.reference  + "  " + item.resource.extension[0].valueUrl);
                }
              }
            }
          }

          var expungeSet = new Set();

          for (const entry of linkages.entry) {
            for (const item of entry.resource.item) {
              if (!expungeSet.has(item.resource.reference)) {
                if (item.type === 'alternate') {
                  expungeSet.add(item.resource.reference)
                  await expungeThePatient(sdsClient  , item.resource.reference,item.resource.extension[0].valueUrl);
                               
              }
              }
            }
          }

          for (const entry of linkages.entry) {
            for (const item of entry.resource.item) {
              if (!expungeSet.has(item.resource.reference)) {
                if (item.type === 'source') {
                  expungeSet.add(item.resource.reference)
                  await expungeThePatient(sdsClient  , item.resource.reference,item.resource.extension[0].valueUrl);                              
              }
              }
            }
          }

        });
      }
    
    }).catch(error => {
      console.error(error.message);
    }).finally( () => {
      if (props.setLogout) {
        props.setLogout();
      }
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
          Withdraw Your Health Data
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
            Your participation in this research study is voluntary.
           
          </Typography>

          <Typography variant="body1" gutterBottom>
          When you click “Withdraw Data” your data will be withdrawn from the study and you will be logged out of the application.
           
          </Typography>

          <Typography variant="body1" gutterBottom>
          Please contact us if you would like to rejoin the study in the future.   
           
          </Typography>


         


          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Withdraw Data
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


 
