import * as React from 'react'
import { useHistory } from 'react-router-dom'
// import FHIR from 'fhirclient'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { FHIRData } from '../../data-services/models/fhirResources'
import { getSupplementalDataClient } from '../../data-services/fhirService'
//import { ConditionSummary } from '../../data-services/models/cqlSummary'
// import { getSupplementalDataClient } from '../../data-services/fhirService'
// import Client from 'fhirclient/lib/Client'
//import { getSupplementalDataClient, updateSharedDataResource } from '../../data-services/fhirService';
//import { Practitioner } from '../../data-services/fhir-types/fhir-r4'
//import Client from 'fhirclient/lib/Client'
interface ShareDataProps {

  fhirDataCollection?: FHIRData[]
 
}

interface IDogForm {
  dog?: String
}

export default function UnShareData(props: ShareDataProps) {

  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {

   


    var parameters: { name: string; value: any }[] = [];
    // { name: string; value: string }
    
    parameters.push(  {
      name: 'cascade',
      value: 'delete'
    }     );


    

    // {
    //   "resourceType": "parameters",
    //   "parameter": [
    //     {
    //       “name”: “url”,
    //       “value”: “/Patient/abc-123"
    //     },
    //     {
    //       “name”: “url”,
    //       “value”: “/Patient/def-456"
    //     },
    //     ...
    //     {
    //       “name”: “url”,
    //       “value”: “/Patient/ghi-789"
    //     },
    //     {
    //       “name”: “url”,
    //       “value”: “/Patient/9876-abcd-4567-uvwx"
    //     },
    //     {
    //       “name”: “url”,
    //       “value”: “/Patient/jkl-012"
    //     },
    //     {
    //       “name”: “cascade”,
    //       “value": “delete”
    //     }
    //   ]
    // }


    event.preventDefault();
    getSupplementalDataClient().then(sdsClient => {
      if (sdsClient) {
        sdsClient.request('Linkage').then(linkages => {
          console.error('asdfasdflinkagelinkagelinkage'+JSON.stringify(linkages));

          console.error('linkages.entry'+JSON.stringify(linkages.entry));

          linkages.entry.map((entry: any) => {

            console.error(JSON.stringify(entry));

            entry.resource.item.map((item:any) => {

              console.error(JSON.stringify(item.resource.reference));

             

              parameters.push(  {
                name: '“url”',
                value: item.resource.reference
              }     );

             


            } )

          } );
          // linkages.entry[0].resource?.item
          console.error('parameters'+JSON.stringify(parameters));

          // jsonObject['parameters'].
          //  = parameters

          var jsonObject = { resourceType: "parameters", parameters: parameters };

    console.error('jsonObject'+JSON.stringify(jsonObject));
    console.error('jsonObject'+JSON.stringify(jsonObject));
    console.error('jsonObject'+JSON.stringify(jsonObject));
    console.error('jsonObject'+JSON.stringify(jsonObject));

          console.error('jsonObject'+JSON.stringify(jsonObject));




           })  ;
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
            You may choose to withdraw your data. Selecting this option will delete all of your health information from this application and the database.
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


 
