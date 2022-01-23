import React from 'react';
import { Link } from 'react-router-dom';
import { FHIRData } from '../../models/fhirResources';

interface MenuComponentProps {
  fhirData?: FHIRData,
  history?: any,
}

interface MenuComponentState {
  fhirData?: FHIRData
}

export default class MenuComponent extends React.Component<MenuComponentProps, MenuComponentState> {
  public render(): JSX.Element | null {
    return (
        <div style={{position:'relative'}}>
        <table className="menu"><tr>
          <td className="menu"><Link to='/'>Home</Link></td>
          <td className="menu">Goals</td>
          <td className="menu">Health Issues</td>
          <td className="menu"><Link to={{ pathname: '/medications', state: { fhirData: this.state.fhirData }}}>Medications</Link></td>
          <td className="menu"><Link to={{ pathname: '/observations', state: { fhirData: this.state.fhirData }}}>Health Status</Link></td>
        </tr></table>
        </div>
      );
    }
  }
