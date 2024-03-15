import { fhirclient } from 'fhirclient/lib/types'

import Providers from './endpoints/providers.json';


 

const fs = require('fs');
export class ProviderEndpoint {
  name: string
  config?: fhirclient.AuthorizeParams

  constructor(name: string, config?: fhirclient.AuthorizeParams) {
    this.name = name
    this.config = config
  }
}

export const buildAvailableEndpoints = (endpointsToAdd?: ProviderEndpoint[]): ProviderEndpoint[] => {

  let availableEndpoints: ProviderEndpoint[] = [];
  let jsonArray = JSON.parse(JSON.stringify(Providers).toString());
  const providers: ProviderEndpoint[] = jsonArray.map((item: any) => {
    return {
        name: item.name,
        config: item.config
    };
});
  availableEndpoints = availableEndpoints.concat(providers);

  if (process.env.REACT_APP_SHARED_DATA_CLIENT_ID
    && process.env.REACT_APP_SHARED_DATA_ENDPOINT && process.env.REACT_APP_SHARED_DATA_SCOPE) {
     availableEndpoints = availableEndpoints.concat(
      {
        "name": "eCare Shared Data",
        "config": {
          "iss": process.env.REACT_APP_SHARED_DATA_ENDPOINT,
          "redirectUri": "./index.html",
          "clientId": process.env.REACT_APP_SHARED_DATA_CLIENT_ID,
          "scope": process.env.REACT_APP_SHARED_DATA_SCOPE
        }
      }
    )
  } 


  // TODO: Remove this from the drop down list, but, leave it in availableEndpoints build.
  // Maybe these should be two dif things, what is seen/can be selected, and what exists.
  // Maybe don't need this at all... maybe can find a better way to track... (local forage,
  // or buiding from SDS client data, or just building from SDS env vars
  // Maybe we need this though so that when the application leaves, and returns, for a new auth,
  // And it tries to access the localFOrage version of selectedEndpoints, it has something to reference?
  // SO probably need to add this, and remove from dropdown, but keep in build?
  // if (process.env.REACT_APP_ADD_SDS_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
  // ...Summary:
  // The SDS cannot be a launcher, however, the endpoint NEEDS to be added for the application logic to work.
  // Because, when one leaves the application to authorize, these endpoints are saved to local storage (temporarilly),
  // and referenced in the logic in that scenario to know what to load on a fresh application launch.
  // Thus, we should probably separate this list and the dropdown list, or, at a minimum, remove this from the dropdown
  // list visually, or just not add it, within that logic
  // Original Meld Test Data SDS
  // availableEndpoints.push(
  //   {
  //     name: 'SDS Test Data: eCareSharedData Meld Sandbox',
  //     config: {
  //       iss: process.env.REACT_APP_SHARED_DATA_ENDPOINT,
  //       redirectUri: "./index.html",
  //       clientId: 'xxx', // only used when Shared Data is a separate FHIR server with its own SMART launch flow (which it isn't now)
  //       scope: process.env.REACT_APP_SHARED_DATA_SCOPE
  //     }
  //   }
  // )
  // Petient-specific SDS
  // availableEndpoints.push(
  // {
  //   name: 'SDS Test Data: eCarePatientData Meld Sandbox',
  //   config: {
  //      iss: process.env.REACT_APP_SHARED_DATA_ENDPOINT,
  //      redirectUri: "./index.html",
  //      clientId: 'xxx',
  //      scope: process.env.REACT_APP_SHARED_DATA_SCOPE
  //   }
  // }
  // )
 
  return availableEndpoints
}

// Given a pre-populated ProivderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a string[] of endpoint names,
// returns a ProviderEndpoint[] populated with the full matching data
export const getMatchingProviderEndpointsFromName = async (availableEndpoints: ProviderEndpoint[],
  selectedEndpointNames: string[]): Promise<ProviderEndpoint[]> => {
  return availableEndpoints.filter(availableEndpoint => {
    console.log('availableEndpoint.name: ', availableEndpoint?.name)
    return selectedEndpointNames.includes(availableEndpoint?.name);
  })
}

// Given a pre-populated ProivderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a string[] of endpoint urls,
// returns a ProviderEndpoint[] populated with the full matching data
// NOTE: If more than one availableEndpoint has the same URL, then we have a problem
// In that case, we can either save the names instead, and use the getMatchingProviderEndpointsFromName function,
// Or, just save a ProviderEndpoint[] directly to selectedEndpoints instead and avoid the conversion
export const getMatchingProviderEndpointsFromUrl = async (availableEndpoints: ProviderEndpoint[],
  selectedEndpointUrls: string[]): Promise<ProviderEndpoint[]> => {
  return availableEndpoints.filter(availableEndpoint => {
    const url = availableEndpoint.config?.iss
    if (url) {
      console.log('availableEndpoint.config?.iss (url): ', url)
      return selectedEndpointUrls.includes(url)
    }
    return false
  })
}

// Given a pre-populated ProivderEndpoint[], typically populated with data from providerEndpointService.buildAvailableEndpoints,
// and given a fhirclient.ClientState,
// returns a ProviderEndpoint populated with the full matching data
export const getProviderEndpointTypeFromClientStateType = async (availableEndpoints: ProviderEndpoint[],
  clientState: fhirclient.ClientState): Promise<ProviderEndpoint | undefined> => {
  if (clientState) {
    const clientIss: string = clientState?.serverUrl
    // TODO: consider beefing up the security of this by checking for another matching prop as well: clientId
    // const clientId: string | undefined = clientState?.clientId
    if (clientIss) {
      const matchingEndpoint = availableEndpoints.find(availableEndpoint => {
        const availableEndpointIss = availableEndpoint.config?.iss
        if (availableEndpointIss) {
          console.log('availableEndpoint.config?.iss (availableEndpointIss): ', availableEndpointIss)
          return clientIss === availableEndpointIss
        }
        return undefined
      })
      return matchingEndpoint
    }
  }
}

export const isProviderEndpointInProviderEndpoints = (endpointToFind: ProviderEndpoint,
  endpointsToSearch: ProviderEndpoint[]): boolean => {
  return endpointsToSearch.some(endpoint => {
    console.log("endpoint?.name", endpoint?.name)
    console.log("endpointToFind?.name", endpointToFind?.name)
    return endpoint?.name === endpointToFind?.name
  })
}
