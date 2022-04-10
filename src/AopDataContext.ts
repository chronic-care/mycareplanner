import React from 'react';

// // Unfinished idea evaluation, not yet working.
// // https://stackoverflow.com/questions/49938568/how-to-share-application-state-between-react-router-v4-routes
// // https://reactjs.org/docs/context.html#dynamic-context

export const FHIRDataContext = React.createContext({
    fhirData: {},
    // dataUpdater: () => {},
  });
  
class FHIRDataProvider extends React.Component {
    state = {
        fhirData: {} // store the data here instead of App
    }
    dataUpdater = () => {
        //utility function to update state
    }
    // render(): JSX.Element {
    // return(
    // <FHIRDataContext.Provider value={this.state}>
    //     {this.props.children}
    // </FHIRDataContext.Provider>
    // )}
}

// const withContext = (comp: React.Component) => {
//     return (comp: React.Component) => <FHIRDataContext.Consumer>
//         // {(fhirData, dataUpdater) => <Component {...props} fhirData={fhirData} dataUpdater={dataUpdater} />}}
//         {(fhirData) => <React.Component comp fhirData={fhirData} />}
//     </FHIRDataContext.Consumer>
// }

// export withContext(App);
