// @ts-ignore
import cql from 'cql-execution';

import FHIRHelpers from '../cql/FHIRHelpers.json';
import FHIRCommon from '../cql/FHIRCommon.json';
import CDSConnectCommons from '../cql/CDSConnectCommons.json';
import PreventiveCareConcepts from '../cql/PreventiveCareConcepts.json';
import PreventiveCareData from '../cql/PreventiveCareData.json';
import PreventiveCareSummary from '../cql/PreventiveCareSummary.json';
import PatientSummary from '../cql/PatientSummary.json';

import BreastCancerScreening from '../cql/BreastCancerScreening.json';
import ColonCancerScreening from '../cql/ColonCancerScreening.json';
import LungCancerScreening from '../cql/LungCancerScreening.json';
import LungCancerSummary from '../cql/LungCancerSummary.json';
import ProstateCancerScreening from '../cql/ProstateCancerScreening.json';

import valueSetDB from '../cql/valueset-db.json';

const getPatientSummaryLibrary = () => new cql.Library(PreventiveCareSummary, new cql.Repository({
    PreventiveCareData,
    PreventiveCareConcepts,
    CDSConnectCommons,
    FHIRHelpers,
  }));
  
const getProstateCancerLibrary = () => new cql.Library(ProstateCancerScreening, new cql.Repository({
  PreventiveCareData,
  PreventiveCareConcepts,
  CDSConnectCommons,
  FHIRHelpers,
}));

const getBreastCancerLibrary = () => new cql.Library(BreastCancerScreening, new cql.Repository({
    PreventiveCareData,
    PreventiveCareConcepts,
    CDSConnectCommons,
    FHIRCommon,
    FHIRHelpers,
  }));
  
const getColonCancerLibrary = () => new cql.Library(ColonCancerScreening, new cql.Repository({
  PreventiveCareData,
  PreventiveCareConcepts,
  CDSConnectCommons,
  FHIRCommon,
  FHIRHelpers,
}));

const getLungCancerLibrary = () => new cql.Library(LungCancerSummary, new cql.Repository({
  LungCancerScreening,
  PatientSummary,
  FHIRCommon,
  FHIRHelpers,
}));

export const codeService = new cql.CodeService(valueSetDB);
export const patientSummaryLibrary = getPatientSummaryLibrary();
export const breastCancerLibrary = getBreastCancerLibrary();
export const colonCancerLibrary = getColonCancerLibrary();
export const lungCancerLibrary = getLungCancerLibrary();
export const prostateCancerLibrary = getProstateCancerLibrary();

export const cancerScreeningLibraries = [
  breastCancerLibrary,
  colonCancerLibrary,
  lungCancerLibrary,
  prostateCancerLibrary,
]