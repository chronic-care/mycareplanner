# MyCarePlanner SMART on FHIR app

## Development Details

This web application design approach, including embedded use of Clinical Quality Language (CQL), was inspired by an open source AHRQ project for Chronic Pain Management. It may be helpful to review that project's design and documentation for ideas on future evolution and enhancement of this eCare Plan app. That chronic pain management app has continued to evolve in parallel with this work over several years. For example, the use of a Gradle script to simplify compilation of CQL to ELM was a recent addition to the chronic pain app repository and was copied into this repo.

* [Pain Management Summary SMART on FHIR Application](https://github.com/AHRQ-CDS/AHRQ-CDS-Connect-PAIN-MANAGEMENT-SUMMARY)

## To update the CQL and/or ELM JSON files

The CQL source and ELM JSON files are kept in the `src/data-services/cql/mcc` folder. The MyCarePlanner app executes only the ELM JSON files, but it is helpful to keep the CQL source files alongside them.

To update the CQL source files:

1. CQL source files are in the `src/data-services/cql/mcc` folder
2. We recommend that you use the no-cost [Visual Studio Code IDE](https://code.visualstudio.com/download) with a CQL extension installed to view or edit CQL source files.
   * Install the CQL extension by opening Extensions view in Visual Studio Code and seaching for "Clinical Quality Language"
   * There are also helpful links to CQL documentation and community resources in the extension overview page.
   * This CQL extension provides very helpful syntax highlighing, plus syntax error notifications for unresolved terms, etc.

To rebuild the CQL source files to ELM files used in application runtime:

1. Install [JDK 11](https://adoptium.net/temurin/releases/?version=11) or greater (if necessary)
   * We used JDK 17, the most recent Java version supported by Gradle scripts in this project.
2. Run `npm run cql-to-elm` to rebuild the ELM JSON files (note: warnings are expected, but there should be no errors).
3. Review the changes in all ELM JSON files in the `src/data-services/cql/mcc` folder to ensure that all files were translated.
4. Test local execution of MyCarePlanner app to ensure that CQL logic changes produce the desired results.

## To update value sets used in the CQL logic

1. All value set declarations are in MCCConcepts.cql
2. All value sets must be defined in VSAC, and the VSAC URI identifier is referenced in the CQL declaration.
3. A CQL value set declaration name is referenced from within MCCConditions.cql or MCCLabResults.cql
4. In MCCConditions.cql,
   * An expression is added for each value set, which returns a List of Condition resources for that value set, or an empty list if not found.
     * For example, see `define "Type II Diabetes":`
   * In some cases, these classified Conditions are grouped into more general sets, e.g. see `define ReportDiabetesConditions: `.
   * All FHIR Conditions included in the CQL execution data set are summarized and displayed in MyCarePlanner, regardless of whether a corresponding CQL expression and value set are present. Those unclassified Conditions are display as "Other Conditions".
   * By using a value set to classify FHIR Condition resources, you can also assign a patient-friendly name to their display in the app, e.g.
     * `DE.ReportConditions("Hypertension Conditions", 'Cardiovascular Disease', 'High Blood Pressure')`
     * You can update any of the patient-friendly name display strings in these expressions to modify the app presentation to users.
5. A similar approch is followed in MCCLabResults.cql to classify lab Observation resources and assign patient-frienly names.

## To update the valueset-db.json file

The value set content used by the CQL in this application runtime is cached in a file named `mcc/valueset-db.json`.  If the CQL has been modified to add or remove value sets, or if the value sets themselves have been updated in VSAC, you may wish to update the valueset-db.json with the latest codes.  To do this, you will need a [UMLS Terminology Services account](https://uts.nlm.nih.gov//license.html).

To update the `valueset-db.json` file:

1. Run `node src/data-services/cql/mcc/updateValueSetDB.js UMLS_API_KEY` _(replacing UMLS\_API\_KEY with your actual UMLS API key)_

To get your UMLS API Key:

1. Sign into your UMLS account at [https://uts.nlm.nih.gov/uts.html](https://uts.nlm.nih.gov/uts.html)
2. Click 'My Profile' in the orange banner at the top of the screen
3. Your API key should be listed below your username in the table
4. If no API key is listed:
   1. Click ‘Edit Profile’
   2. Select the ‘Generate new API Key’ checkbox
   3. Click ‘Save Profile’
   4. Your new API key should now be listed.
