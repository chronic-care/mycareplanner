// This script updates the valueset-db.json file with any changes from the CQL
// library and/or changes in the value set definitions in VSAC.  It should be
// called with the UMLS API Key as the argument.
const fs = require('fs');
const path = require('path');
const temp = require('temp');
const { Library, Repository } = require('cql-execution');
const { CodeService } = require('cql-exec-vsac');
const mccConceptsELM = require('./MCCConcepts.json');
const fhirCommonELM = require('./FHIRCommon.json');
const fhirHelpersELM = require('./FHIRHelpers.json');

// First ensure an API key is provided
let apiKey;
if (process.argv.length === 3) {
  apiKey = process.argv[2];
} else if (process.argv.length === 4) {
  console.error('UMLS username and password is no longer supported. Please pass in a UMLS API key instead.');
  process.exit(1);
} else {
  console.error('The UMLS API key must be passed in as an argument');
  process.exit(1);
}

// Then initialize the cql-exec-vsac CodeService, pointing to a temporary
// folder to dump the valueset cache files.
temp.track(); // track temporary files and delete them when the process exits
const tempFolder = temp.mkdirSync('vsac-cache');
const codeService = new CodeService(tempFolder);
// const codeService = new CodeService('./temp/vsac-cache');

console.log(`Using temp folder: ${tempFolder}`);

// const tempDBFile = path.join(tempFolder, 'valueset-db.json');
// const tempDBPath = path.join(__dirname, '../../input/', 'cql', 'valueset-db.json');
// fs.writeFileSync(dbPath, JSON.stringify(fixed, null, 2), 'utf8');

// Then setup the CQL libraries that we need to analyze to extract the valuesets from.
const r4Lib = new Library(mccConceptsELM, new Repository({
  FHIRCommon: fhirCommonELM,
  FHIRHelpers: fhirHelpersELM
}));

// Then use the ensureValueSetsInLibrary function to analyze the Pain
// Management Summary CQL, request all the value sets from VSAC, and store
// their data in the temporary folder.  The second argument (true)
// indicates to also look at dependency libraries.  This has no affect
// for the current CQL, but may be helpful for people who extend it.
const maskedKey = apiKey.slice(0, 2) + apiKey.slice(2, -2).replace(/[^-]/g, '*') + apiKey.slice(-2);
console.log(`Loading value sets from VSAC using API key: ${maskedKey}`);
codeService.ensureValueSetsInLibraryWithAPIKey(r4Lib, true, apiKey)
  .then(() => {
    // The valueset-db.json that the codeService produces isn't exactly the
    // format that the Pain Management Summary wants, so now we must reformat
    // it into the desired format.
    const tempDBFile = path.join(tempFolder, 'valueset-db.json');
    const original = JSON.parse(fs.readFileSync(tempDBFile, 'utf8'));
    let oidKeys = Object.keys(original).sort();
    console.log(`Loaded ${oidKeys.length} value sets`);
    console.log('Translating JSON to expected format')
    const fixed = {};
    for (const oid of oidKeys) {
      let oiduri = 'http://cts.nlm.nih.gov/fhir/ValueSet/' + oid;
      fixed[oiduri] = {};
      for (const version of Object.keys(original[oid])) {
        fixed[oiduri][version] = original[oid][version]['codes'].sort((a, b) => {
          if (a.code < b.code) return -1;
          else if (a.code > b.code) return 1;
          return 0;
        });
      }
    }

    // And finally write the result to the real locations of the valueset-db.json.
    // const dbPath = path.join(__dirname, '../../input/', 'cql', 'valueset-db.json');
    const dbPath = path.join(__dirname, './', '.', 'valueset-db.json');
    fs.writeFileSync(dbPath, JSON.stringify(fixed, null, 2), 'utf8');
    console.log('Updated:', dbPath);
  })
  .catch((error) => {
    let message = error.message;
    if (error.statusCode === 401) {
      // The default 401 message isn't helpful at all
      message = 'invalid API key or unauthorized access'
    }
    console.error('Error updating valueset-db.json:', error);
    process.exit(1);
  });


