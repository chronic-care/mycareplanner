// @ts-ignore
import cql from 'cql-execution';
// @ts-ignore
import cqlfhir from 'cql-exec-fhir';

import { Resource } from '../fhir-types/fhir-r4';
import { FHIRData } from '../models/fhirResources';
import { ObservationSummary } from '../models/cqlSummary';

import { mccLabResultsLibrary, mccCodeService } from './mccCqlLibraries';

function getBundleEntries(resources?: [Resource]) {
  return resources?.map((r: Resource) => ({ resource: r })) || []
}

function getPatientSource(data: FHIRData): unknown {
  const fhirBundle = {
    resourceType: 'Bundle',
    entry: [{ resource: data.patient }, { resource: data.patientPCP },
      ...getBundleEntries(data.conditions),
      ...getBundleEntries(data.medications),
      ...getBundleEntries(data.serviceRequests),
      ...getBundleEntries(data.labResults),
      ...getBundleEntries(data.vitalSigns),
      ...getBundleEntries(data.goals),
    ]
  };

  const patientSource = cqlfhir.PatientSource.FHIRv401();
  patientSource.loadBundles([fhirBundle]);

  return patientSource;
}

export const getLabResultSummary = (fhirData?: FHIRData): [ObservationSummary] | undefined => {
  if (fhirData === undefined) { return undefined }
  const patientSource = getPatientSource(fhirData!)
  const extractedSummary = executeLibrary(mccLabResultsLibrary, mccCodeService, patientSource);

  // console.log("CQL Results: " + JSON.stringify(extractedSummary));
  console.log("LabResultSummary: " + JSON.stringify(extractedSummary.LabResultSummary));

  return extractedSummary.LabResultSummary;
}

const executeLibrary = (library: any, codeService: any, patientSource: any): any => {
  const executor = new cql.Executor(library, codeService);
  const results = executor.exec(patientSource);
  const extractedSummary = results.patientResults[Object.keys(results.patientResults)[0]];

  return extractedSummary;
}
