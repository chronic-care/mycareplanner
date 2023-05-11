import React from 'react';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

interface SummaryRowProps {
  isHeader: boolean,
  twoColumns: boolean,
  data1?: string | undefined,
  data2?: string | Element | undefined,
}

export const SummaryRow: React.FC<SummaryRowProps> = (props: SummaryRowProps) => {

  if (!props.twoColumns) {
    return (
      <Grid item xs={12}>
        <Typography variant={props.isHeader ? "h6" : "body2"} component={props.isHeader ? "h6" : "p"}>
          {props.data1}
        </Typography>
      </Grid>
    )
  } else {
    return (
      <>
        <Grid item xs={6}>
          <Typography variant={props.isHeader ? "h6" : "body2"} component={props.isHeader ? "h6" : "p"}>
            {props.data1}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" component="p" align="right">
            {props.data2}
          </Typography>
        </Grid>
      </>
    )
  }

}
