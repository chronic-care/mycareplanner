// @ts-ignore
import cql from 'cql-execution';
// @ts-ignore
import cqlfhir from 'cql-exec-fhir';

import { Resource } from './fhir-types/fhir-r4';
import { FHIRData } from './models/fhirResources';
import { PatientSummary, ScreeningSummary } from './models/cqlSummary';

import { patientSummaryLibrary, cancerScreeningLibraries, codeService } from './mpcCqlLibraries';

function getBundleEntries(resources?: Resource[]) {
  return resources?.map((r: Resource) => ({ resource: r })) || []
}

function getPatientSource(data: FHIRData): unknown {
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: data.patient }, { resource: data.patientPCP },
    ...getBundleEntries(data.conditions),
    ...getBundleEntries(data.procedures),
    ...getBundleEntries(data.diagnosticReports),
    ...getBundleEntries(data.medications),
    ...getBundleEntries(data.immunizations),
    ...getBundleEntries(data.labResults),
    ...getBundleEntries(data.vitalSigns),
    ...getBundleEntries(data.socialHistory),
    ]
  };

  const patientSource = cqlfhir.PatientSource.FHIRv401();
  patientSource.loadBundles([fhirBundle]);

  return patientSource;
}

export const extractPatientSummary = (fhirData: FHIRData): PatientSummary => {
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: fhirData.patient }, { resource: fhirData.patientPCP }]
  }

  const patientSource = cqlfhir.PatientSource.FHIRv401()
  patientSource.loadBundles([fhirBundle])

  const executor = new cql.Executor(patientSummaryLibrary, codeService)
  const results = executor.exec(patientSource)
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]]

  return extractedSummary.PatientSummary
}

export const getPatientSummaries = (fhirDataCollection: FHIRData[]): PatientSummary[] => {
  let patientSummaries: PatientSummary[] = []
  for (const curFhirData of fhirDataCollection) {
    const patientSummary = extractPatientSummary(curFhirData)
    patientSummaries.push(patientSummary)
  }
  return patientSummaries
}

// TODO: This static test can be removed since a dynamic version is above
// export const getPatientSummaries = (fhirData: FHIRData): PatientSummary[] => {
//   const fhirBundle = {
//     resourceType: 'Bundle',
//     entry: [{ resource: fhirData.patient }, { resource: fhirData.patientPCP }]
//   };

//   const patientSource = cqlfhir.PatientSource.FHIRv401();
//   patientSource.loadBundles([fhirBundle]);

//   const executor = new cql.Executor(patientSummaryLibrary, codeService);
//   const results = executor.exec(patientSource);
//   const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];

//   const PatientSummary1TestOriginal: PatientSummary = extractedSummary.PatientSummary
//   let PatientSummary3TestUnique: PatientSummary = { ...PatientSummary1TestOriginal }
//   PatientSummary3TestUnique.fullName = 'John Doe'
//   PatientSummary3TestUnique.age = '21'

//   // temporary solution to test as an array...
//   // TODO: will need to run this for each PatientSummary and aggregate the Patients array
//   return [PatientSummary1TestOriginal, PatientSummary1TestOriginal, PatientSummary3TestUnique]
//   // return extractedSummary.PatientSummary;
// }

export const executeScreenings = (fhirDataCollection: FHIRData[]): [ScreeningSummary] => {
  // Cannot reuse patientSource for multiple library executions.
  return cancerScreeningLibraries.map((library: any) => (
    // TODO:MULTI-PROVIDER: Handle fhirDataCollection vs just using index 0
    // May need to update getPatientSource to support FHIR Collection
    executeScreeningLibrary(library, codeService, getPatientSource(fhirDataCollection[0]))
  )) as [ScreeningSummary]
}

const executeScreeningLibrary = (library: any, codeService: any, patientSource: any): ScreeningSummary => {
  const executor = new cql.Executor(library, codeService);
  const results = executor.exec(patientSource);
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];
  const screeningSummary = extractedSummary.ScreeningSummary as ScreeningSummary;
  // console.log("ScreeningSummary: " + JSON.stringify(screeningSummary));
  // console.log("CQL Results: " + JSON.stringify(extractedSummary));

  return screeningSummary
}
