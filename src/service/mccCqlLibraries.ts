// @ts-ignore
import cql from 'cql-execution';

import MCCConditions from '../cql/mcc/MCCConditions.json';
import MCCGoals from '../cql/mcc/MCCGoals.json';
import MCCLabResults from '../cql/mcc/MCCLabResults.json';
import MCCMedications from '../cql/mcc/MCCMedications.json';
import MCCVitalSigns from '../cql/mcc/MCCVitalSigns.json';

import MCCConcepts from '../cql/mcc/MCCConcepts.json';
import DataElementHelpers from '../cql/mcc/DataElementHelpers.json';
import FHIRHelpers from '../cql/mpc/FHIRHelpers.json';
import FHIRCommon from '../cql/mpc/FHIRCommon.json';

import valueSetDB from '../cql/mcc/valueset-db.json';

const getConditionsLibrary = () => new cql.Library(MCCConditions, new cql.Repository({
  DataElementHelpers,
  MCCConcepts,
  FHIRCommon,
  FHIRHelpers,
}));

const getGoalsLibrary = () => new cql.Library(MCCGoals, new cql.Repository({
  MCCConditions,
  DataElementHelpers,
  MCCConcepts,
  FHIRCommon,
  FHIRHelpers,
}));

const getLabResultsLibrary = () => new cql.Library(MCCLabResults, new cql.Repository({
    DataElementHelpers,
    MCCConcepts,
    FHIRCommon,
    FHIRHelpers,
  }));
  
const getMedicationsLibrary = () => new cql.Library(MCCMedications, new cql.Repository({
  DataElementHelpers,
  MCCConcepts,
  FHIRCommon,
  FHIRHelpers,
}));

const getVitalSignsLibrary = () => new cql.Library(MCCVitalSigns, new cql.Repository({
  DataElementHelpers,
  MCCConcepts,
  FHIRCommon,
  FHIRHelpers,
}));

export const mccCodeService = new cql.CodeService(valueSetDB);
export const mccConditionsLibrary = getConditionsLibrary();
export const mccGoalsLibrary = getGoalsLibrary();
export const mccLabResultsLibrary = getLabResultsLibrary();
export const mccMedicationsLibrary = getMedicationsLibrary();
export const mccVitalSignsLibrary = getVitalSignsLibrary();
