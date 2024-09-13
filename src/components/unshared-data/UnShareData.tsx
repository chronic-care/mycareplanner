import * as React from 'react'
import { useHistory } from 'react-router-dom'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { FHIRData } from '../../data-services/models/fhirResources'
import { getSupplementalDataClient } from '../../data-services/fhirService'
import { fhirclient } from 'fhirclient/lib/types'
interface ShareDataProps {

  fhirDataCollection?: FHIRData[],
  setLogout?: () => void,
  
 
}

interface IDogForm {
  dog?: String
}



export default function UnShareData(props: ShareDataProps) {

  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {

   
    event.preventDefault();
    getSupplementalDataClient().then(sdsClient => {
      if (sdsClient) {
        sdsClient.request('Linkage').then(linkages => {

          var deleteSet = new Set();

          linkages.entry.map((entry: any) => {
            entry.resource.item.map((item: any) => {
              if (!deleteSet.has(item.resource.reference)) {
                deleteSet.add(item.resource.reference)
                console.info('delete resources for ' + item.resource.reference);
                sdsClient.delete(item.resource.reference + '?_cascade=delete');
              }
            })
          });
        });

        sdsClient.request('Linkage').then(linkages => {

          var expungeSet = new Set();

          linkages.entry.map((entry: any) => {
            entry.resource.item.map((item: any) => {     
              if (!expungeSet.has(item.resource.reference)) {
                expungeSet.add(item.resource.reference)
                console.info('delete resources for ' + item.resource.reference);

                const fhirHeaderRequestOption = {} as fhirclient.RequestOptions;
                fhirHeaderRequestOption.method = 'POST';
                fhirHeaderRequestOption.url =item.resource.reference + '/$expunge';

                const expungeParams = {
                  resourceType: "Parameters",
                  parameter: [
                      {
                          name: "expungeDeletedResources",
                          valueBoolean: true
                      },
                      {
                          name: "expungeDeletedResources",
                          valueBoolean: true
                      },
                      {
                          name: "_cascade",
                          valueString: "delete"
                      }
                  ]
              };

              const fhirHeaders ={
                'Content-Type' : 'application/json'
              };  

              fhirHeaderRequestOption.headers =fhirHeaders;

              fhirHeaderRequestOption.body = JSON.stringify(expungeParams);
                sdsClient.request(fhirHeaderRequestOption);
              }
            })
          });
        });

      }

      if (props.setLogout) {
        props.setLogout();
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


 
