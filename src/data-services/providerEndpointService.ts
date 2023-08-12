import { fhirclient } from 'fhirclient/lib/types'

export class ProviderEndpoint {
  name: string
  config?: fhirclient.AuthorizeParams

  constructor(name: string, config?: fhirclient.AuthorizeParams) {
    this.name = name
    this.config = config
  }
}

export const buildAvailableEndpoints = (): ProviderEndpoint[] => {
  const availableEndpoints: ProviderEndpoint[] = [
    {
      name: 'OCHIN',
      config: {
        iss: "https://webprd.ochin.org/prd-fhir/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
      }
    },
    {
      name: 'Providence in Oregon/California',
      config: {
        iss: "https://haikuor.providence.org/fhirproxy/api/FHIR/R4/",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
      }
    },
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
  ]

  if (process.env.REACT_APP_ADD_MELD_TO_PROVIDER_LOGIN_DROPDOWN === 'true') {
    availableEndpoints.push(
      {
        name: 'Test Data: Meld Sandbox',
        config: {
          iss: process.env.REACT_APP_MELD_SANDBOX_ENDPOINT_ISS,
          redirectUri: "./index.html",
          clientId: process.env.REACT_APP_CLIENT_ID_meld_mcc,
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
