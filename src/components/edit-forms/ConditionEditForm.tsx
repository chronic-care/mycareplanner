import * as React from 'react';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DatePicker from '@mui/lab/DatePicker';
import Grid from '@mui/material/Grid';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export default function ConditionEditForm() {
  const [onsetDate, setStartDate] = React.useState<Date | null>(new Date());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      description: data.get('description'),
      onsetDate: onsetDate,
    });
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
          Health Concern
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

        <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="When did it start?"
                    value={onsetDate}
                    onChange={(newValue) => {
                        setStartDate(newValue);
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