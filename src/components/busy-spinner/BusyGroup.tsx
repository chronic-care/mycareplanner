import React from 'react';
export default class BusySpinner extends React.Component {
  public render(): JSX.Element | null {
    return (
        <div style={{position:'relative'}}>
          { this.props.children }
        </div>
      );
    }
  }
