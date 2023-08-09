library MCCLabResults version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

define LabResultSummary: 
  (List {
    DE.ReportMostRecentResult("Total Cholesterol Results", 'Total Cholesterol'),
    DE.ReportMostRecentResult("High Density Lipoprotein Results", 'HDL Cholesterol'),
    DE.ReportMostRecentResult("Low Density Lipoprotein Results", 'LDL Cholesterol'),
    DE.ReportMostRecentResult("Triglyceride Results", 'Triglycerides'),
    DE.ReportMostRecentResult("Hemoglobin A1C Results", 'Hemoglobin A1c %'),
    DE.ReportMostRecentResult("eGFR Results", 'Estimated GFR'),
    DE.ReportMostRecentResult("Serum Albumin Results", 'Serum Albumin'),
    DE.ReportMostRecentResult("Serum Creatinine Results", 'Serum Creatinine'),
    DE.ReportMostRecentResult("UACR Results", 'Urine Albumin Creatinine Ratio')
  }) Result where Result is not null

// View summary tuple for each lab result data element in CKD minimum data set (MDS)
define "CKD Lab Result Summary": 
  (List {
    DE.ReportMostRecentResult("eGFR Results", 'eGFR'),
    DE.ReportMostRecentResult("High Density Lipoprotein Results", 'HDL Cholesterol'),
    DE.ReportMostRecentResult("Low Density Lipoprotein Results", 'LDL Cholesterol'),
    DE.ReportMostRecentResult("UACR Results", 'Urine Albumin Creatinine Ratio')
  }) Result where Result is not null

define "CVD Lab Result Summary": 
  (List {
    DE.ReportMostRecentResult("High Density Lipoprotein Results", 'HDL Cholesterol'),
    DE.ReportMostRecentResult("Low Density Lipoprotein Results", 'LDL Cholesterol'),
    DE.ReportMostRecentResult("Triglyceride Results", 'Triglycerides')
  }) Result where Result is not null

define "Diabetes Lab Result Summary": 
  (List {
    DE.ReportMostRecentResult("Hemoglobin A1C Results", 'Hemoglobin A1c %'),
    DE.ReportMostRecentResult("Triglyceride Results", 'Triglycerides')
  }) Result where Result is not null

define "Chronic Pain Lab Result Summary": {
  
}

// Lists of Lab result FHIR Observations

define "Total Cholesterol Results":
  DE.SelectByStatus([Observation: Cx."Total Cholesterol"])

define "High Density Lipoprotein Results":
  DE.SelectByStatus([Observation: Cx."High Density Lipoprotein"])

define "Low Density Lipoprotein Results":
  DE.SelectByStatus([Observation: Cx."Low Density Lipoprotein"])

define "Triglyceride Results":
  DE.SelectByStatus([Observation: Cx."Triglyceride Blood Serum Plasma"])

define "Hemoglobin A1C Results":
  DE.SelectByStatus([Observation: Cx."Hemoglobin A1C"])

define "eGFR Results":
  DE.SelectByStatus([Observation: Cx."Estimated Glomerular Filtration Rate"])

define "Serum Albumin Results":
  DE.SelectByStatus([Observation: Cx."Serum Albumin"])

define "Serum Creatinine Results":
  DE.SelectByStatus([Observation: Cx."Serum Creatinine"])

define "UACR Results":
  DE.SelectByStatus([Observation: Cx."Urine Albumin Creatinine Ratio"])
