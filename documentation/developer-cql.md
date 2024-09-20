# MyCarePlanner SMART on FHIR app

## Development Details

## To update the CQL and/or ELM JSON files

The CQL source and ELM JSON files are kept in the `src/cql/dstu2` and `src/cql/r4` folders. The Pain Management Summary app executes only the ELM JSON files, but it is helpful to keep the CQL source files alongside them.

To update the CQL files:

1. CQL source files are in the `src/data-services/cql/mcc` folder
2. We recommend that you use VS Code IDE with the CQL extension to view or edit CQL source files.
2. TODO: link to CQL plugin with instructions

To rebuild the CQL source file to ELM files used in application runtime:

1. Install [JDK 11](https://adoptium.net/temurin/releases/?version=11) or greater (if necessary)
   * We used JDK 17, the most recent Java version supported by Gradle scripts in this project.
4. Run `npm run cql-to-elm` to rebuild the ELM JSON files (note: warnings are expected, but there should be no errors)
5. Review the changes in all ELM JSON files in the `src/data-services/cql/mcc` folder to ensure they look correct

## To update value sets used in the CQL logic

TODO: summary of CQL value set declarations and use

## To update the valueset-db.json file

The value set content used by the CQL is cached in a file named `valueset-db.json`.  If the CQL has been modified to add or remove value sets, or if the value sets themselves have been updated in VSAC, you may wish to update the valueset-db.json with the latest codes.  To do this, you will need a [UMLS Terminology Services account](https://uts.nlm.nih.gov//license.html).

To update the `valueset-db.json` file:

1. Run `node src/data-services/cql/mcc/updateValueSetDB.js UMLS_API_KEY` _(replacing UMLS\_API\_KEY with your actual UMLS API key)_

To get you UMLS API Key:

1. Sign into your UMLS account at [https://uts.nlm.nih.gov/uts.html](https://uts.nlm.nih.gov/uts.html)
2. Click 'My Profile' in the orange banner at the top of the screen
3. Your API key should be listed below your username in the table
4. If no API key is listed:
   1. Click ‘Edit Profile’
   2. Select the ‘Generate new API Key’ checkbox
   3. Click ‘Save Profile’
   4. Your new API key should now be listed.
