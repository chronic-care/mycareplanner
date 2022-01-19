// @ts-ignore
import cql from 'cql-execution';
// @ts-ignore
import cqlfhir from 'cql-exec-fhir';

import { Resource } from '../fhir-types/fhir-r4';
import { FHIRData } from '../models/fhirResources';
import { PatientSummary, ScreeningSummary } from '../models/cqlSummary';

import { patientSummaryLibrary, cancerScreeningLibraries, codeService } from './cqlLibraries';

function getBundleEntries(resources?: [Resource]) {
  return resources?.map((r: Resource) => ({ resource: r })) || []
}

function getPatientSource(data: FHIRData): unknown {
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: data.patient }, { resource: data.practitioner },
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

export const getPatientSummary = (fhirData: FHIRData): PatientSummary => {
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: fhirData.patient }, { resource: fhirData.practitioner }]
  };

  const patientSource = cqlfhir.PatientSource.FHIRv401();
  patientSource.loadBundles([fhirBundle]);

  const executor = new cql.Executor(patientSummaryLibrary, codeService);
  const results = executor.exec(patientSource);
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];

  return extractedSummary.PatientSummary;
};

export const executeScreenings = (fhirData: FHIRData): [ScreeningSummary] => {
  // Cannot reuse patientSource for multiple library executions.
  return cancerScreeningLibraries.map((library: any) => (
    executeScreeningLibrary(library, codeService, getPatientSource(fhirData))
  )) as [ScreeningSummary]
}

const executeScreeningLibrary = (library: any, codeService: any, patientSource: any): ScreeningSummary => {
  const executor = new cql.Executor(library, codeService);
  const results = executor.exec(patientSource);
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];
  const screeningSummary = extractedSummary.ScreeningSummary as ScreeningSummary;
  // console.log("ScreeningSummary: " + JSON.stringify(screeningSummary));
  // console.log("CQL Results: " + JSON.stringify(extractedSummary));

  return screeningSummary;
}
