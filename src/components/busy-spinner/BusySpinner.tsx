import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

interface BusySpinnerProps {
  busy?: boolean;
}

export const BusySpinner: React.FC<BusySpinnerProps> = (props: BusySpinnerProps) => {
  return (
    props.busy ?
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
      : null
  )
}
