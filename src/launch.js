import FHIR from 'fhirclient'

const allscriptsScope = "launch/patient openid fhirUser offline_access patient/*.read"

// const athenaScopePilot = "launch/patient openid fhirUser offline_access patient/Patient.read patient/Practitioner.read patient/CarePlan.read patient/CareTeam.read patient/Condition.read patient/Goal.read patient/Immunization.read patient/Observation.read patient/Procedure.read patient/MedicationRequest.read patient/RelatedPerson.read patient/ServiceRequest.read patient/Provenance.read";
const athenaScopePilot = "launch/patient openid fhirUser offline_access patient/*.read"

const epicPilotScope = "launch launch/patient openid fhirUser patient/Patient.read patient/Practitioner.read patient/RelatedPerson.read patient/Condition.read patient/DiagnosticReport.read patient/Observation.read patient/Procedure.read patient/CarePlan.read patient/CareTeam.read patient/Goal.read patient/Immunization.read patient/MedicationRequest.read patient/Medication.read patient/ServiceRequest.read patient/Provenance.read patient/Organization.read"
// eslint-disable-next-line no-unused-vars
const epicProviderScope = "launch launch/patient openid fhirUser user/Patient.read user/Practitioner.read user/RelatedPerson.read user/Condition.read user/DiagnosticReport.read user/Observation.read user/Procedure.read user/CarePlan.read user/CareTeam.read user/Goal.read user/Immunization.read user/MedicationRequest.read user/Medication.read user/ServiceRequest.read user/Provenance.read user/Organization.read"

const cernerScopeUSCDI = "launch/patient openid fhirUser offline_access patient/Patient.read user/Practitioner.read user/Location.read user/Organization.read patient/CarePlan.read patient/CareTeam.read patient/Condition.read patient/Goal.read patient/Immunization.read patient/Observation.read patient/MedicationRequest.read patient/RelatedPerson.read patient/Provenance.read"
const cernerScopePilot = process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_SCOPE

const nextgenScope = "launch launch/patient openid fhirUser offline_access patient/Patient.read patient/Practitioner.read patient/RelatedPerson.read patient/Condition.read patient/DiagnosticReport.read patient/Observation.read patient/Procedure.read patient/CarePlan.read patient/CareTeam.read patient/Goal.read patient/Immunization.read patient/MedicationRequest.read patient/Medication.read patient/Provenance.read patient/Organization.read"
const meldScope = "launch launch/patient openid fhirUser patient/Patient.read patient/Practitioner.read patient/RelatedPerson.read patient/Condition.read patient/DiagnosticReport.read patient/Observation.read patient/Procedure.read patient/CarePlan.read patient/CareTeam.read patient/Goal.read patient/Immunization.read patient/MedicationRequest.read patient/ServiceRequest.read patient/Task.read patient/Questionnaire.read patient/QuestionnaireResponse.write patient/Goal.write patient/MedicationRequest.write patient/Condition.write"


const meldmatch = "https://gw.interop.community/"+process.env.REACT_APP_MELD_SANDBOX_NAME+"/data"

 
const availableEndpoints = [
    {
        // OHSU FHIR dev
        issMatch: /\bepicmobile.ohsu.edu\/FHIRDEV\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_ohsu_fhirdev,
        scope: epicPilotScope
    },
    {
        // OHSU FHIR production
        issMatch: /\bepicmobile.ohsu.edu\/FHIRPRD\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_ohsu_fhirprd,
        scope: epicPilotScope
    },
    {
        // Meld Synthea test data sandbox
        issMatch: iss => iss.startsWith(meldmatch),
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_MELD_SANDBOX_CLIENT_ID,
        scope:meldScope
    },
    {
        // Logica sandbox
        issMatch: /\blogicahealth\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_logica,
        scope: "launch launch/patient openid fhirUser patient/Patient.read patient/Practitioner.read patient/RelatedPerson.read patient/Condition.read patient/DiagnosticReport.read patient/Observation.read patient/Procedure.read patient/CarePlan.read patient/Goal.read patient/Immunization.read patient/MedicationRequest.read patient/ServiceRequest.read patient/Task.read patient/Questionnaire.read patient/QuestionnaireResponse.write"
    },
    {
        // Allscripts sandbox
        issMatch: "https://allscriptsfhirconnect.open.allscripts.com/R4/fhir-InfernoStageStandalone",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_allscripts_sandbox,
        scope: allscriptsScope
    },
    {
        // Allscripts sandbox (open)
        issMatch: "https://allscriptsfhirconnect.open.allscripts.com/R4/open-InfernoStageStandalone",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_allscripts_sandbox,
        scope: allscriptsScope
    },
    {
        // Athena Practice sandbox
        issMatch: "https://ap22sandbox.fhirapi.athenahealth.com/demoAPIServer/fhir/r4",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_athena_practice_sandbox,
        scope: athenaScopePilot
    },
    {
        // NextGen production and sandbox
        issMatch: "https://fhir.nextgen.com/nge/prod/fhir-api-r4/fhir/r4",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_nextgen,
        scope: nextgenScope
    },
    {
        // Cerner sandbox
        issMatch: process.env.REACT_APP_CERNER_SANDBOX_ENDPOINT_ISS,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_cerner_sandbox,
        scope: cernerScopePilot
    },
    {
        // Cerner production client for USCDI patient app
        issMatch: /\bfhir-myrecord.cerner.com\/r4\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_cerner,
        scope: cernerScopeUSCDI
    },
    {
        // VA sandbox
        issMatch: "https://sandbox-api.va.gov/services/fhir/v0/r4",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_va,
        scope: process.env.REACT_APP_VA_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
        // "unsafeV1" - Use against Smart v1 servers. Smart v1 does not define conformance, so validate your server supports PKCE before using this setting
    },
    {
        // Epic sandbox
        issMatch: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic_sandbox,
        scope: epicPilotScope,
        pkceMode: "unsafeV1"
    },
    {
        // Production Epic instance, if the ISS contains the word "epic"
        issMatch: /\bepic\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
    },
    {
        // For any other enpoints, try using Epic (not all contain string 'epic')
        issMatch: /\bR4\b/i,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_CLIENT_ID_epic,
        scope: process.env.REACT_APP_EPIC_SANDBOX_ENDPOINT_SCOPE,
        pkceMode: "unsafeV1"
    }
]

if (process.env.REACT_APP_SHARED_DATA_CLIENT_ID 
        && process.env.REACT_APP_SHARED_DATA_ENDPOINT && process.env.REACT_APP_SHARED_DATA_SCOPE) {
    availableEndpoints.push(
      {
        issMatch: process.env.REACT_APP_SHARED_DATA_ENDPOINT,
        redirectUri: "./index.html",
        clientId: process.env.REACT_APP_SHARED_DATA_CLIENT_ID,
        scope: process.env.REACT_APP_SHARED_DATA_SCOPE
      }
    )
  }

FHIR.oauth2.authorize(availableEndpoints)
