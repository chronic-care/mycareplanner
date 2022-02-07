// @ts-ignore
import cql from 'cql-execution';

import FHIRHelpers from '../cql/mpc/FHIRHelpers.json';
import FHIRCommon from '../cql/mpc/FHIRCommon.json';
import CDSConnectCommons from '../cql/mpc/CDSConnectCommons.json';
import PreventiveCareConcepts from '../cql/mpc/PreventiveCareConcepts.json';
import PreventiveCareData from '../cql/mpc/PreventiveCareData.json';
import PreventiveCareSummary from '../cql/mpc/PreventiveCareSummary.json';
import PatientSummary from '../cql/mpc/PatientSummary.json';

import BreastCancerScreening from '../cql/mpc/BreastCancerScreening.json';
import ColonCancerScreening from '../cql/mpc/ColonCancerScreening.json';
import LungCancerScreening from '../cql/mpc/LungCancerScreening.json';
import LungCancerSummary from '../cql/mpc/LungCancerSummary.json';
import ProstateCancerScreening from '../cql/mpc/ProstateCancerScreening.json';

import valueSetDB from '../cql/mpc/valueset-db.json';

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