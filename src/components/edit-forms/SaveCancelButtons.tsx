import React, {useCallback} from 'react';
import { useHistory } from "react-router-dom";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';


export default function SaveCancelButtons(saveHandler: any) {

    // const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        
    // }
    
    const history = useHistory();
    // const handleOnClick = useCallback(() => history.push('/sample'), [history]);
    const handleReset = useCallback(() => history.goBack(), [history]);

    return (
        <Box component="form" noValidate onSubmit={saveHandler} onReset={handleReset} sx={{ mt: 3 }}>
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
        </Box>
    )

    // const handleOnClick = useCallback(() => history.push('/sample'), [history]);
    // return (
    //   <button type="button" onClick={handleOnClick}>
    //     Go home
    //   </button>
    // );
  }