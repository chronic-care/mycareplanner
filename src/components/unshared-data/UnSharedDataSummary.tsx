import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { getSupplementalDataClient } from '../../data-services/fhirService'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Client from 'fhirclient/lib/Client'

export default function UnSharedDataSummary() {
  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    getSupplementalDataClient().then(sdsClient => {
      if (sdsClient) {
        sdsClient.request('Linkage').then(linkages => {
          console.error('asdfasdflinkagelinkagelinkage'+JSON.stringify(linkages));

          console.error('linkages.entry'+JSON.stringify(linkages.entry));

          linkages.entry.map((entry: any) => {

            console.error(JSON.stringify(entry));

          } );
          // linkages.entry[0].resource?.item

           })  ;
      }
    })

      .catch(error => {
        console.error(error.message);
      });


    // let sdsClient: Client | undefined = await getSupplementalDataClient()
    // if (sdsClient) {
      
      // getSupplementalDataClient().then(sdsClient => {
      //   if (sdsClient !== undefined) {
      //   const linkages = await sdsClient.request('Linkage');

      //   var resource = linkages.entry[0].resource;

      //   resource.item.forEach((resource: any) => {  
      //        console.log(JSON.stringify(resource));                
         
      //  })};
      // }
        // var patientReference = linkages.entry[0].resource?.item[0].resource.reference

        // linkages.entry[0].resource.forEach(resource => {     
          // console.log("Entered");  //This does ifre                       
        //  
      //  })}


        // sdsClient.delete()
        // }
      }


    // let sdsClient = getSupplementalDataClient()
    // if (sdsClient !== undefined) {

    //   const linkages =  sdsClient.request('Linkage');

      // The HTTP requests would be
      // 1…N.  Delete the patient for each foreign partition (other than the authorized partition)
      //   1. HTTP DELETE /Patient/abc-123?_cascade=true
      //   2. HTTP DELETE /Patient/def-456?_cascade=true
      //   ...
      //   3. HTTP DELETE /Patient/ghi-789?_cascade=true
      
      // N+1.  Delete the patient for the local partition
      //   1. HTTP DELETE /Patient/9876-abcd-4567-uvwx?_cascade=true
      
      // N+2.  Delete the patient for the authorized foreign partition
      //   1. HTTP DELETE /Patient/jkl-012?_cascade=true
      
      // N+3.  Schedule expunging deleted data
      //   1. HTTP POST /$expunge
      //       body: JSON
      //       {
      //         "resourceType": "parameters",
      //         "parameter": [
      //           {
      //             “name”: “expungeDeletedResources”,
      //             “value”: true
      //           },
      //           {
      //             “name”: “cascade”,
      //             “value": “delete”
      //           }
      //         ]
      //       }



      // Get and display Shared Data
    // }
  // }

  const handleReset = (event: React.FormEvent<HTMLFormElement>) => {
    history.goBack()
  }

  return (
    <React.Fragment>
      <Box component="form" noValidate onSubmit={handleSubmit} onReset={handleReset} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Shared Health Data Summary
        </Typography>
        <Grid container spacing={3}>

          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom>
              Login to the shared data store repository to display the aggregated summary from other providers that was previously retrieved and shared.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
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
