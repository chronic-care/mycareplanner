import React from 'react';
import { Spinner } from 'react-bootstrap';
import './BusySpinner.css'

interface BusySpinnerProps {
  busy?: boolean;
}

interface BusySpinnerState {
  authenticated: boolean;
}

export default class BusySpinner extends React.Component<BusySpinnerProps, BusySpinnerState> {
  // constructor(props: BusySpinnerProps) {
  //   super(props);
  // }
  public render(): JSX.Element | null {
    return (
        this.props.busy ?
            <div className="spinner-overlay">
                <Spinner animation="border" variant="primary"></Spinner>
            </div>
        : null
      );
    }
  }
