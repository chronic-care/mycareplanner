// @ts-ignore
import cql from 'cql-execution';

import FHIRHelpers from '../cql/mpc/FHIRHelpers.json';
import FHIRCommon from '../cql/mpc/FHIRCommon.json';
import MCCConcepts from '../cql/mcc/MCCConcepts.json';
import DataElementHelpers from '../cql/mcc/DataElementHelpers.json';
import MCCLabResults from '../cql/mcc/MCCLabResults.json';

import valueSetDB from '../cql/mcc/valueset-db.json';

const getLabResultsLibrary = () => new cql.Library(MCCLabResults, new cql.Repository({
    DataElementHelpers,
    MCCConcepts,
    FHIRCommon,
    FHIRHelpers,
  }));
  
export const mccCodeService = new cql.CodeService(valueSetDB);
export const mccLabResultsLibrary = getLabResultsLibrary();

export const mccLibraries = [
  mccLabResultsLibrary,
]