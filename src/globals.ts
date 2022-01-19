import { FHIRData } from './models/fhirResources';

export interface Globals {
  // FHIRData is a non-serializable object from third-party API so
  // we can't store it as part of the React/Redux state
  fhirData: FHIRData | undefined,
}

export const globals: Globals = {
  fhirData: undefined,
};
