// @ts-ignore
import cql from 'cql-execution';
// @ts-ignore
import cqlfhir from 'cql-exec-fhir';

import { Resource } from './fhir-types/fhir-r4';
import { FHIRData } from './models/fhirResources';
import { ConditionSummary, GoalSummary, MedicationSummary, ObservationSummary } from './models/cqlSummary';

import { mccCodeService, mccConditionsLibrary, mccGoalsLibrary, mccLabResultsLibrary, mccMedicationsLibrary, mccVitalSignsLibrary } from './mccCqlLibraries';
import { doLog } from '../log';

function getBundleEntries(resources?: Resource[]) {
  return resources?.map((r: Resource) => ({ resource: r })) || []
}

function getPatientSource(dataCollection: FHIRData[]): unknown {
  // TODO:MULTI-PROVIDER: Merely updated to comple for now with a fhirDataCollection by using 1st index
  // We need to create a 2d array of CQL results and push (maybe to a temporary arrray and hen set) unique data to the array
  // This is is required to fully work in the view
  // We can only process one at a time, but, we need to process the correct one...
  // If passing the data is messy, it may be best to set the array using a callback in App.tsx which sets all summaries, since they are local to that file.
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: dataCollection[0].patient }, { resource: dataCollection[0].patientPCP },
    ...getBundleEntries(dataCollection[0].conditions),
    ...getBundleEntries(dataCollection[0].medications),
    ...getBundleEntries(dataCollection[0].serviceRequests),
    ...getBundleEntries(dataCollection[0].labResults),
    ...getBundleEntries(dataCollection[0].vitalSigns),
    ...getBundleEntries(dataCollection[0].goals),
    ...getBundleEntries(dataCollection[0].provenance),
    ]
  };

  const patientSource = cqlfhir.PatientSource.FHIRv401();
  patientSource.loadBundles([fhirBundle]);

  return patientSource;
}

export const getConditionSummary = (fhirDataCollection?: FHIRData[]): [ConditionSummary] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }
  const patientSource = getPatientSource(fhirDataCollection!)
  const extractedSummary = executeLibrary(mccConditionsLibrary, mccCodeService, patientSource);

  // console.log("CQL Results: " + JSON.stringify(extractedSummary));
  // console.log("ConditionSummary: " + JSON.stringify(extractedSummary.ConditionSummary));
  return extractedSummary.ConditionSummary;
}

export const getGoalSummary = (fhirDataCollection?: FHIRData[]): [GoalSummary] | undefined => {
  doLog({
    level: 'debug',
    event: 'getConditions',
    page: 'get Conditions',
    message: `getConditions: success`
  })
  if (fhirDataCollection === undefined) { return undefined }
  const patientSource = getPatientSource(fhirDataCollection!)
  const extractedSummary = executeLibrary(mccGoalsLibrary, mccCodeService, patientSource);

  // console.log("GoalSummary: " + JSON.stringify(extractedSummary.GoalSummary));
  return extractedSummary.GoalSummary;
}

export const getLabResultSummary = (fhirDataCollection?: FHIRData[]): [ObservationSummary] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }
  const patientSource = getPatientSource(fhirDataCollection!)
  const extractedSummary = executeLibrary(mccLabResultsLibrary, mccCodeService, patientSource);

  // console.log("LabResultSummary: " + JSON.stringify(extractedSummary.LabResultSummary));
  return extractedSummary.LabResultSummary;
}

export const getMedicationSummary = (fhirDataCollection?: FHIRData[]): [MedicationSummary] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }
  const patientSource = getPatientSource(fhirDataCollection!)
  const extractedSummary = executeLibrary(mccMedicationsLibrary, mccCodeService, patientSource);

  // console.log("MedicationSummary: " + JSON.stringify(extractedSummary.MedicationSummary));
  return extractedSummary.MedicationSummary;
}

export const getVitalSignSummary = (fhirDataCollection?: FHIRData[]): [ObservationSummary] | undefined => {
  if (fhirDataCollection === undefined) { return undefined }
  const patientSource = getPatientSource(fhirDataCollection!)
  const extractedSummary = executeLibrary(mccVitalSignsLibrary, mccCodeService, patientSource);

  // console.log("VitalSignsSummary: " + JSON.stringify(extractedSummary.VitalSignsSummary));
  return extractedSummary.VitalSignsSummary;
}

const executeLibrary = (library: any, codeService: any, patientSource: any): any => {
  const executor = new cql.Executor(library, codeService);
  const results = executor.exec(patientSource);
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];

  return extractedSummary;
}
