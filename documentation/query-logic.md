# MyCarePlanner

**Care Plan \> Goals**

* Rationale  
  * Display all Goals from EHR systems with lifecycleStatus \= active, completed, canceled  
  * Display all Goals from SDS authored by patients or caregivers  
* Logic  
  * Goal?lifecycle-status=active,completed,cancelled  
* Notes  
  * n/a

**Care Plan \> Concerns**

* Rationale  
  * Display all problem list Conditions from EHR systems with status \= active  
  * Display all health concern Conditions from EHR systems with status \= active  
  * Display all Conditions from SDS authored by patients or caregivers; these are saved to the SDS with category \= health-concern  
  * Whenever possible, conditions should be displayed in MyCarePlanner using “patient friendly” names, e.g., “High Blood Pressure” instead of “Essential Hypertension”.  
  * Value sets listed in the [MCC eCare Plan FHIR Implementation Guide](https://hl7.org/fhir/us/mcc/STU1/mcc_chronic_condition_value_sets.html) and defined in VSAC are used to classify individual Condition terminology codes into more general categories. As of September 2024, approximately 125 value sets are used by MyCarePlanner to classify and assign patient-friendly names.  
* Logic  
  * All Conditions where category=problem-list-item, clinical-status=active  
  * All Conditions where category=health-concern, clinical-status=active  
  * Clinical Quality Language (CQL) logic expressions are used to apply value sets to the FHIR data and create a summary for display in MyCarePlanner.  
    * [https://github.com/chronic-care/mycareplanner/blob/main/src/data-services/cql/mcc/MCCConditions.cql](https://github.com/chronic-care/mycareplanner/blob/main/src/data-services/cql/mcc/MCCConditions.cql)  
* Notes  
  * Patient-friendly names for conditions are assigned only when the Condition code is contained in one of the configured value sets, and the same patient-friendly name is shown for all conditions included in that value set.  
  * The patient-friendly names used in MyCarePlanner were assigned by a clinical SME with experience as a practicing physician.

**Care Plan \> Medications**

* Rationale  
  * Retrieve and display all active MedicationRequests.  
* Logic  
  * MedicationRequest?status=active&\_include=MedicationRequest:requester

* Notes  
  * When comparing with Epic, note that canceled, completed, or stopped medications will not be displayed in MyCarePlanner  
  * The “Reason” field is displayed if either MedicationRequest.reasonCode (a terminology code such as SNOMED or ICD-10) or MedicationRequest.reasonReference (to a Condition resource) is included in the FHIR source. Multiple reason lines will be displayed if more than one reason element is provided.  
  * The “Ordered By” field is displayed if the MedicationRequest.requester element is included in the FHIR source. This field is omitted if a requester is not provided, or if a Practitioner reference is provided without a display string and the Practitioner resource cannot be resolved.

**Care Plan \> Activities**

* Rationale  
  * Retrieve and display all active ServiceRequest resources  
  * Completed orders are not retrieved or displayed. Epic does support a status of “draft” \- this could be added to our search if applicable to OHSU use.  
* Logic  
  * ServiceRequest?status=active&\_include=ServiceRequest:requester  
* Notes  
  * Epic specifications for ServiceRequest show that some kinds of orders are not searchable and can only be retrieved by resource ID that is obtained from some other FHIR resource relationship. Referral orders appear to fall into this category and cannot be retrieved via searching from our applications.  
  * The “Reason” field is displayed if either ServiceRequest.reasonCode (a terminology code such as SNOMED, ICD-10, or CPT) or ServiceRequest.reasonReference (to a Condition or Observation resource) is included in the FHIR source. Multiple reason lines will be displayed if more than one reason element is provided.  
  * The “Requested by” field is displayed if the ServiceRequest.requester element is included in the FHIR source. This field is omitted if a requester is not provided or if a Practitioner reference is provided without a display string and the Practitioner resource cannot be resolved.  
  * The “Ordered On” field is displayed if the ServiceRequest.authoredOn date element is included in the FHIR source. This field is omitted if a date is not provided.  
  * Possible dependency on OHSU Epic app configuration  
    * Epic has several SMART app authorizations for different types of ServiceRequest orders. The resources returned depend on which APIs are authorized in the OHSU configuration.

**Health Status \> Tests**

* Rationale  
  * The Tests tab includes only laboratory result FHIR Observations.  
  * Laboratory results should be displayed with a “patient-friendly name”, not the default LOINC display name that most patients do not understand.  
  * The original eCare app project request was to display only lab results that are “relevant” to the chronic conditions in our project’s focus. From a clinician’s perspective, show labs that a patient should monitor for their diagnosed conditions. The only reference we had available was the laboratory value sets published in the [MCC eCare Plan FHIR IG](https://build.fhir.org/ig/HL7/fhir-us-mcc/mcc_laboratory_result_value_sets.html); this includes 82 lab results.  
  * We heard from NIH patient advocates that they “never” or “rarely” looked at their lab results because the list is overwhelming and the lab names are unrecognizable. We worked on an approach to limit and translate this list into the most relevant results.  
  * If multiple observations are found for a given laboratory value set, then an additional field is displayed with “History of Labs” that can be expanded by a user to show previous values, sorted with the most recent results first.  
* Logic  
  * FHIR Query: Observation?category=laboratory\&date= \> five years ago  
    * Where “five years ago” is calculated at runtime to retrieve all lab results within the last five years. This constraint was added to improve application performance by limiting what could be a very large amount of data from a patient’s entire clinical record.  
  * Clinical Quality Language (CQL) logic expressions are used to apply value sets to the FHIR data and create a summary for display in MyCarePlanner.  
    * [https://github.com/chronic-care/mycareplanner/blob/main/src/data-services/cql/mcc/MCCLabResults.cql](https://github.com/chronic-care/mycareplanner/blob/main/src/data-services/cql/mcc/MCCLabResults.cql)  
* Notes  
  * Based on the NIH CKD TEP analysis, 82 value sets are currently included in the application logic to filter and assign patient-friendly names. So only 82 types of lab results will be included in the application, not an exhaustive list of all lab results.  
  * Review and recommendations from a team of clinicians could be used to expand this current list by adding codes to existing value sets or defining new lab result value sets.

**Health Status \> Vitals**

* Rationale  
  * Query vital sign Observations using specific LONC codes, as specified by USCDI v1 and US Core v3 (current EHR certification requirement).  
    * [http://hl7.org/fhir/R4/observation-vitalsigns.html\#vitals-table](http://hl7.org/fhir/R4/observation-vitalsigns.html#vitals-table)  
  * At this time, we search for 6 types of vitals: BP, O2 sat, temp, weight, height, BMI  
    * Does not include: Heart Rate. This can be added if needed.  
  * For Blood Pressure, US Core specification requires one Observation for the BP panel using LOINC code 85354-9, with Systolic and Diastolic values in the components of that single Observation.  Separate FHIR observation resources for systolic and diastolic will not be retrieved or displayed.  
    * [https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-blood-pressure.html](https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-blood-pressure.html)  
  * If an Observation vital sign uses a code other than this specific list, it will not be retrieved or displayed. Pediatric vital sign profiles from US Core are excluded because they are not applicable to the MCC patient population.  
  * A special case was added to retrieve and display OHSU Home Blood Pressure readings. These data are added to Epic via flowsheets using OHSU-specific terminology codes, so these data will not be available from other provider organizations. Furthermore, these data are returned as separate FHIR Observations for systolic and diastolic values. Additional customized logic was added to the MyCarePlanner CQL code to match and combine these observations into a single systolic/diastolic value for display to patients.  
  * If multiple observations are found for a vital sign, then an additional field is displayed with “History of Vitals” that can be expanded by a user to show previous values, sorted with most recent results first. Up to 10 previous values may be shown. For only Home Blood Pressure readings, both date and time of the historical values is displayed because the elapsed time between Home BP readings on the same day may be significant.  
* Logic  
  * Observation LONIC codes \= \['85354-9', '59408-5', '8310-5', '29463-7', '8302-2', ‘39156-5’\]  
  * Home Blood Pressure query with one year of history:  
    * Observation?code=[http://loinc.org|72076-3](http://loinc.org|72076-3)  
    * This returns separate systolic and diastolic Observations, which are combined as described above.  
  * Per end user requirement, vital signs are displayed using a “patient-friendly name”. The name mapping logic is located in the app CQL logic.  
  * A very large amount of vital sign data may be present, so optimizations have been implemented to enable a more responsive app. For vital signs, the FHIR query retrieves only 1 page of results, using the \_count parameter to set the maximum number of resources per page. Without these constraints, we would get an unlimited number of pages with 1000 resources per page. MyCarePlanner is configured to retrieve 1 page with 10 resources.  
* Notes  
  * Count is used only for vitals. If you leave \_count unspecified, you might get 1,000 values back (default page size from Epic) and that would slow performance by filtering and sorting a large amount of unused data.

**Care Team**

* Rationale  
  * Retrieve and display participants included in CareTeam resources, as defined by US Core conformance and search specifications.  
    * [https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-careteam.html](https://hl7.org/fhir/us/core/STU4/StructureDefinition-us-core-careteam.html)  
  * Retrieve and display only “longitudinal” care teams.  
  * A Practitioner is displayed in the application CareTeam tab ***only*** if it is included in a CareTeam resource returned by an EHR system. Many Practitioners are referenced from other FHIR resources as the requester or performer, but they are not displayed in Care Team unless also included in a defined CareTeam resource.  
* Logic  
  * CareTeam?category=longitudinal  
* Notes  
  * Epic only supports FHIR search for “longitudinal” care teams. Although Epic specifications also describe “Episode” care teams, these can only be retrieved using specific, known resource IDs.

## Use of FHIR Search Parameters

**\_count=x**

* This parameter may be added to any FHIR search. If included, this number sets the maximum number of resources that should be returned ***per page*** of results. However, the default JavaScript API for FHIR return all available pages from a single query. So including \_count is only useful in our apps if we also override the API to only return one page.  
* MyCarePlanner includes \_count=5 for all vital sign queries and also overrides the API to return only a single page of results. Only the most recent Observation is displayed, and reducing what could be several 1000 resources (e.g., for home BP readings) could impact app performance.

**\_sort**

* For example: &\_sort:desc=date would sort returned resources descending by date  
* However, this parameter is not supported by and EHR vendor FHIR endpoint that we’ve reviewed.  
* This \_sort parameter might be useful when executing our searching on the SDS FHIR service. This is based on HAPI reference implementation that does support \_sort for all resource types.  
* Not currently used in MyCarePlanner

**\_include**

* This parameter is very useful to improve performance when you also want to return references from the base resource.  For example, a single search will return CareTeam, plus all referenced Practitioner resource in a single Bundle.  
* For example: CareTeam?\_include=CareTeam:participant  
* However, our testing showed that Cerner and Allscripts FHIR endpoints do not support \_include and throw an error that causes the entire query to fail. MyCarePlanner checks for a FHIR base URL from one of these vendors and omits the \_include parameter.

**\_revinclude**

* Reverse include, i.e. return all resources that include the target resource in one of its references. Allowed by the FHIR specification for any resource. However, very limited support by current EHR vendors.  
* However, support for \_revinclude is specifically required by US Core testing to enable efficient search of Provenance resources.  MyCarePlanner includes this search appended to all resource types to return Provenance in a single Bundle of results  
  * '&\_revinclude=Provenance:target'

**category**

* Included in some searches to limit the results to the specified list of one or more categories. Only a few category codes are standardized and required by US Core; others may not be used consistently between EHR vendors.  
* For example:   
  * Condition?category=problem-list-item  
  * And Condition?category=health-concern  
  * These could be combined into a single query for “probem-list-item,health-concern”, but earlier versions of Epic threw an error if more than one category is included in a single Condition query.  
* We also include a search for assessment Observations (e.g. from a questionnaire) using “category=survey”. Assessment Observations are defined in detail in recent versions of US Core FHIR IG that will be required for conformance by Jan 1, 2026\.   
* However, Epic threw a runtime error if this category is used by itself, so as a workaround, we appended a second category that is support by Epic:  
  * Observation?category=survey,functional-mental-status

**code**

* This parameter can be included to limit search results to one or more specific terminology codes. MyCarePlanner uses this parameter for vital sign queries to retrieve specific types  
  * Observation?code=http://loinc.org|85354-9  
  * This query returns only Blood Pressure observations
