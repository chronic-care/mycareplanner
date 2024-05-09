import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { getSupplementalDataClient } from '../../data-services/fhirService'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

export default function SharedDataSummary() {
  let history = useHistory()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let sdsClient = getSupplementalDataClient(null)
    if (sdsClient !== undefined) {
      // Get and display Shared Data
    }
  }

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
