import { fhirclient } from 'fhirclient/lib/types'



import fs from 'fs'

export class ProviderEndpoint {
  name: string
  config?: fhirclient.AuthorizeParams

  constructor(name: string, config?: fhirclient.AuthorizeParams) {
    this.name = name
    this.config = config
  }
}

export const buildAvailableEndpoints = (): ProviderEndpoint[] => {
  let availableEndpoints: ProviderEndpoint[] = [];
  
  if (process.env.REACT_APP_ADD_OHSU_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'OHSU POC Dev',
        config: {
          iss: "https://epicmobile.ohsu.edu/FHIRDEV/api/FHIR/R4",
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_ohsu_fhirdev,
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      })

    // availableEndpoints.push(
    //   {
    //     name: 'OHSU Prod',
    //     config: {
    //       iss: "https://epicmobile.ohsu.edu/FHIRPRD/api/FHIR/R4",
    //       redirectUri: "./index.html",
    //       clientId: process.env.REACT_APP_CLIENT_ID_ohsu_fhirprd,
    //       scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
    //       pkceMode: "unsafeV1"
    //     }
    //   })

    // availableEndpoints.push(
    //   {
    //     name: 'OCHIN',
    //     config: {
    //       iss: "https://webprd.ochin.org/prd-fhir/api/FHIR/R4/",
    //       redirectUri: "./index.html",
    //       clientId: process.env.REACT_APP_CLIENT_ID_epic,
    //       scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
    //       pkceMode: "unsafeV1"
    //     }
    //   })
  }

  if (process.env.REACT_APP_ADD_PROVIDENCE_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Providence in Oregon/California',
        config: {
          iss: "https://haikuor.providence.org/fhirproxy/api/FHIR/R4/",
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_epic,
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      })

    availableEndpoints.push(
      {
        name: 'Providence in Washington/Montana',
        config: {
          iss: "https://haikuwa.providence.org/fhirproxy/api/FHIR/R4/",
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_epic,
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_MELD_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'MCC Develop Sandbox',
        config: {
          iss: process.env.REACT_APP_MELD_SANDBOX_DEVELOP_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_MELD_MCCDEVELOP,
          scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE
        }
      }
    )

    availableEndpoints.push(
      {
        name: 'MCC Testing Sandbox',
        config: {
          iss: process.env.REACT_APP_MELD_SANDBOX_TESTING_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_MELD_MCCTESTING,
          scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE
        }
      }
    )

    availableEndpoints.push(
      {
        name: 'MCC Staging Sandbox',
        config: {
          iss: process.env.REACT_APP_MELD_SANDBOX_STAGING_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_MELD_MCCSTAGING,
          scope: process.env.REACT_APP_MELD_SANDBOX_SCOPE
        }
      }
    )






  }

  if (process.env.REACT_APP_ADD_EPIC_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Epic Sandbox',
        config: {
          iss: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_epic_sandbox,
          scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_CERNER_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Cerner Sandbox',
        config: {
          iss: process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_cerner_sandbox,
          scope: process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_SCOPE
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_VA_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: VA Sandbox',
        config: {
          iss: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_va,
          scope: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_SCOPE,
          pkceMode: "unsafeV1"
        }
      }
    )
  }

  if (process.env.REACT_APP_ADD_NEXTGEN_SANDBOX_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: NextGen Sandbox',
        config: {
          iss: process.env.REACT_APP_NEXTGEN_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_nextgen,
          scope: process.env.REACT_APP_NEXTGEN_SANDBOX_ENDPOINT_SCOPE
        }
      }
    )
  }

 
  if (process.env.REACT_APP_SHARED_DATA_CLIENT_ID) {
    availableEndpoints.push(
      {
        name: 'Shared Data Store',
        config: {
          iss: process.env.REACT_APP_SHARED_DATA_ENDPOINT,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_SHARED_DATA_CLIENT_ID,
          scope: process.env.REACT_APP_SHARED_DATA_SCOPE
        }
      }
    )
  }
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
