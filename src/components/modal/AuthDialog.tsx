import React from 'react'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Typography } from '@mui/material'
import { ProviderEndpoint } from '../../data-services/providerEndpointService'

interface AuthDialogProps {
  open: boolean
  currentUnauthorizedEndpoint: ProviderEndpoint | null
  handleClose: () => void
  handleAuthorizeSelected: () => void
  handleSkipSelected: () => void
}

const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  currentUnauthorizedEndpoint,
  handleClose,
  handleAuthorizeSelected,
  handleSkipSelected,
}) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Authorize or Skip provider?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant="body1">
            Please agree to <b>Authorize</b> the following provider:
            <br />
            <b>{currentUnauthorizedEndpoint?.name ?? "Unknown"}</b>
            {/* <br /> */}
            {/* at iss: <i>{currentUnauthorizedEndpoint?.config?.iss ?? "Unknown"}</i> */}
            <br />
            This will navigate to an external location to authorize and then return to the app after authorization.
            <br />
            If instead, you select <b>Skip</b>, we will proceed to the next provider, ignoring the skipped one.
            <br />
            Note: The choice to skip a provider can be useful in scenarios where a provider cannot be authorized for some reason,
            it was simply chosen by accident, or the information is no longer desired.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkipSelected} variant="contained" color="secondary">
          Skip
        </Button>
        <Button onClick={handleAuthorizeSelected} variant="contained" color="primary" autoFocus>
          Authorize
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuthDialog
