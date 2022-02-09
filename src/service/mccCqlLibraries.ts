// @ts-ignore
import cql from 'cql-execution';

import MCCConditions from '../cql/mcc/MCCConditions.json';
import MCCLabResults from '../cql/mcc/MCCLabResults.json';

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

const getLabResultsLibrary = () => new cql.Library(MCCLabResults, new cql.Repository({
    DataElementHelpers,
    MCCConcepts,
    FHIRCommon,
    FHIRHelpers,
  }));
  
export const mccCodeService = new cql.CodeService(valueSetDB);
export const mccConditionsLibrary = getConditionsLibrary();
export const mccLabResultsLibrary = getLabResultsLibrary();
