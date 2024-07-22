library MCCLabResults version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

define LabResultSummary: 
  (List {
    DE.ReportMostRecentResult("24 Hour Urine Protein Excretion", '24 Hour Urine Protein Excretion'),
    DE.ReportMostRecentResult("24 Hour Urine Volume", '24 Hour Urine Volume'),
    DE.ReportMostRecentResult("Alanine Aminotransferase (ALT), Bld/Ser/Plas", 'ALT'),
    DE.ReportMostRecentResult("Albumin in Blood, Plasma, or Serum", 'Albumin'),
    DE.ReportMostRecentResult("Aldosterone/Renin Ratio", 'Aldosterone/Renin Ratio'),
    DE.ReportMostRecentResult("Alkaline Phosphatase (Alp) in Blood, Serum or Plasma", 'ALP'),
    DE.ReportMostRecentResult("Anion Gap", 'Anion Gap'),
    DE.ReportMostRecentResult("Arterial Blood Gas (ABG)", 'Arterial Blood Gas'),
    DE.ReportMostRecentResult("Aspartate Aminotransferase (AST), Ser/Plas", 'AST'),
    DE.ReportMostRecentResult("Aspartate Transaminase or Alanine Aminotransferase Ratio", 'Aspartate Transaminase or Alanine Aminotransferase Ratio'),
    DE.ReportMostRecentResult("B Type Natriuretic Peptide [Bnp] in Blood, Serum or Plasma", 'B Type Natriuretic Peptide [Bnp]'),
    DE.ReportMostRecentResult("Bicarbonate in blood, serum or plasma", 'Bicarbonate'),
    DE.ReportMostRecentResult("Bilirubin, Total, Bld/Ser/Plas", 'Bilirubin'),
    DE.ReportMostRecentResult("Blood Ethanol Level", 'Blood Ethanol Level'),
    DE.ReportMostRecentResult("Blood Urea Nitrogen", 'Blood Urea Nitrogen'),
    DE.ReportMostRecentResult("Bone Biopsy Report", 'Bone Biopsy Report'),
    DE.ReportMostRecentResult("C reactive Protein (CRP), Bld/Ser/Plas", 'C reactive Protein (CRP)'),
    DE.ReportMostRecentResult("Calcium (Not Corrected for Serum Albumin) in Blood, Plasms, or Serum", 'Calcium (Not Corrected for Serum Albumin)'),
    DE.ReportMostRecentResult("Cerebral Spinal Fluid (CSF) Analysis", 'Cerebral Spinal Fluid (CSF) Analysis'),
    DE.ReportMostRecentResult("Chloride in blood, serum or plasma", 'Chloride'),
    DE.ReportMostRecentResult("Coagulation Assay (PT, aPTT, Fibrinogen)", 'Coagulation Assay'),
    // DE.ReportMostRecentResult("Complete Blood Count (with Diff)", 'Complete Blood Count'),
    // DE.ReportMostRecentResult("Comprehensive Metabolic Panel (CMP)", 'Comprehensive Metabolic Panel (CMP)'),
    DE.ReportMostRecentResult("Corrected Calcium", 'Calcium'),
    DE.ReportMostRecentResult("COVID 19 (SARS CoV 2), SARS CoV, Influenza virus A and B Tests", 'COVID 19 Test'),
    DE.ReportMostRecentResult("Creatine Kinase (CK, CK MB) in Blood, Serum, or Plasma", 'Creatine Kinase (CK, CK MB)'),
    DE.ReportMostRecentResult("Creatinine in blood, serum or plasma", 'Creatinine'),
    DE.ReportMostRecentResult("Cystatin C", 'Cystatin C'),
    DE.ReportMostRecentResult("D Dimer Test", 'D Dimer'),
    DE.ReportMostRecentResult("Drugs of Abuse Screen", 'Drugs of Abuse Screen'),
    DE.ReportMostRecentResult("Erythrocyte Distribution Width", 'Erythrocyte Distribution Width'),
    DE.ReportMostRecentResult("Erythrocyte Sedimentation Rate (ESR), Blood", 'Erythrocyte Sedimentation Rate (ESR)'),
    DE.ReportMostRecentResult("Estimated Average Glucose", 'Estimated Average Glucose'),
    DE.ReportMostRecentResult("Estimated Glomerular Filtration Rate (eGFR)", 'eGFR'),
    DE.ReportMostRecentResult("Fasting Blood Glucose", 'Fasting Blood Glucose'),
    DE.ReportMostRecentResult(Ferritin"", 'Ferritin'),
    DE.ReportMostRecentResult("Free T4 (Thyroxine) Test", 'Free T4 (Thyroxine)'),
    DE.ReportMostRecentResult("Gamma Glutamyl Transpeptidase (Ggt) in blood, serum or plasma", 'Gamma Glutamyl Transpeptidase (Ggt)'),
    DE.ReportMostRecentResult("Gastric Tissue Biopsy Report", 'Gastric Tissue Biopsy Report'),
    DE.ReportMostRecentResult("Glucose Tolerance Test Results", 'Glucose Tolerance'),
    DE.ReportMostRecentResult("Hematocrit", 'Hematocrit'),
    DE.ReportMostRecentResult("Hemoglobin", 'Hemoglobin'),
    DE.ReportMostRecentResult("Hemoglobin A1C", 'Hemoglobin A1c %'),
    DE.ReportMostRecentResult("High Density Lipoprotein", 'HDL Cholesterol'),
    DE.ReportMostRecentResult("High Sensitivity Troponin", 'High Sensitivity Troponin'),
    DE.ReportMostRecentResult("INR", 'INR'),
    DE.ReportMostRecentResult("Intact Parathyroid Hormone", 'Intact Parathyroid Hormone'),
    DE.ReportMostRecentResult("Iron Saturation (Transferrin Saturation/TSAT)", 'Iron Saturation'),
    DE.ReportMostRecentResult("Kidney Biopsy Report", 'Kidney Biopsy Report'),
    DE.ReportMostRecentResult("KT/V Hemodialysis Ratio", 'KT/V Hemodialysis Ratio'),
    DE.ReportMostRecentResult("Low Density Lipoprotein", 'LDL Cholesterol'),
    DE.ReportMostRecentResult("Mean Corpuscular Hemoglobin Concentration", 'Mean Corpuscular Hemoglobin Concentration'),
    DE.ReportMostRecentResult("Mean Corpuscular Volume", 'Mean Corpuscular Volume'),
    DE.ReportMostRecentResult("Microorganisms Detection by Blood Culture", 'Microorganisms Detection by Blood Culture'),
    DE.ReportMostRecentResult("Microorganisms Detection by Sputum Culture", 'Microorganisms Detection by Sputum Culture'),
    DE.ReportMostRecentResult("Muscle Biopsy Report", 'Muscle Biopsy Report'),
    DE.ReportMostRecentResult("N Terminal Pro_B_Type Natriuretic Peptide [Nt_Probnp] in blood, serum or plasma", 'N Terminal Pro_B_Type Natriuretic Peptide'),
    DE.ReportMostRecentResult("Oxygen Saturation, Blood", 'Oxygen Saturation'),
    DE.ReportMostRecentResult("Phosphorus in blood, serum or plasma", 'Phosphorus'),
    DE.ReportMostRecentResult("Platelet Count", 'Platelet Count'),
    DE.ReportMostRecentResult("Platelet Distribution Width", 'Platelet Distribution Width'),
    DE.ReportMostRecentResult("Platelet Mean Volume", 'Platelet Mean Volume'),
    DE.ReportMostRecentResult("Potassium in blood, serum or plasma", 'Potassium'),
    DE.ReportMostRecentResult("Procalcitonin in Blood, Serum, or Plasma", 'Procalcitonin'),
    DE.ReportMostRecentResult("Random Blood Glucose Test", 'Random Blood Glucose Test'),
    DE.ReportMostRecentResult("Red Blood Cell Count (Erythrocytes)", 'Red Blood Cell Count (Erythrocytes)'),
    DE.ReportMostRecentResult("Serum Rheumatoid Factor", 'Serum Rheumatoid Factor'),
    DE.ReportMostRecentResult("Skin Biopsy Report", 'Skin Biopsy Report'),
    DE.ReportMostRecentResult("Sodium in blood, serum or plasma", 'Sodium'),
    DE.ReportMostRecentResult("Thyroid Stimulating Hormone (TSH) Test", 'Thyroid Stimulating Hormone (TSH)'),
    DE.ReportMostRecentResult("Total Carbon Dioxide or Bicarbonate in blood, serum or plasma", 'Total Carbon Dioxide or Bicarbonate'),
    DE.ReportMostRecentResult("Total Cholesterol", 'Total Cholesterol'),
    DE.ReportMostRecentResult("Triglyceride in blood, serum or plasma", 'Triglycerides'),
    DE.ReportMostRecentResult("Triiodothyronine in serum or plasma", 'Triiodothyronine'),
    DE.ReportMostRecentResult("Troponin I, Bld/Ser/Plas", 'Troponin I'),
    DE.ReportMostRecentResult("Troponin T, Bld/Ser/Pla", 'Troponin T'),
    DE.ReportMostRecentResult("Urea Reduction Ratio", 'Urea Reduction Ratio'),
    DE.ReportMostRecentResult("Uric Acid (Urate) in blood, serum or plasma", 'Uric Acid (Urate)'),
    DE.ReportMostRecentResult("Urine Albumin Creatinine Ratio", 'Urine Albumin Creatinine Ratio'),
    DE.ReportMostRecentResult("Urine Protein to Creatinine Ratio (UPCR)", 'Urine Protein to Creatinine Ratio (UPCR)'),
    DE.ReportMostRecentResult("Urine Sediment", 'Urine Sediment'),
    DE.ReportMostRecentResult("Urine Urea Nitrogen", 'Urine Urea Nitrogen'),
    DE.ReportMostRecentResult("Uroflowmetry", 'Uroflowmetry'),
    DE.ReportMostRecentResult("Vitamin D Levels", 'Vitamin D'),
    DE.ReportMostRecentResult("White Blood Cell (Leukocytes) Count", 'White Blood Cell (Leukocytes) Count')
    // DE.ReportMostRecentResult("", ''),

  }) Result where Result is not null

// View summary tuple for each lab result data element in CKD minimum data set (MDS)
/*
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
*/

// Lists of Lab result FHIR Observations

define "24 Hour Urine Protein Excretion":
  DE.SelectByStatus([Observation: Cx."24 Hour Urine Protein Excretion"])

define "24 Hour Urine Volume":
  DE.SelectByStatus([Observation: Cx."24 Hour Urine Volume"])

define "Alanine Aminotransferase (ALT), Bld/Ser/Plas":
  DE.SelectByStatus([Observation: Cx."Alanine Aminotransferase (ALT), Bld/Ser/Plas"])

define "Albumin in Blood, Plasma, or Serum":
  DE.SelectByStatus([Observation: Cx."Albumin in Blood, Plasma, or Serum"])

define "Aldosterone/Renin Ratio":
  DE.SelectByStatus([Observation: Cx."Aldosterone/Renin Ratio"])

define "Alkaline Phosphatase (Alp) in Blood, Serum or Plasma":
  DE.SelectByStatus([Observation: Cx."Alkaline Phosphatase (Alp) in Blood, Serum or Plasma"])

define "Anion Gap":
  DE.SelectByStatus([Observation: Cx."Anion Gap"])

define "Arterial Blood Gas (ABG)":
  DE.SelectByStatus([Observation: Cx."Arterial Blood Gas (ABG)"])

define "Aspartate Aminotransferase (AST), Ser/Plas":
  DE.SelectByStatus([Observation: Cx."Aspartate Aminotransferase (AST), Ser/Plas"])

define "Aspartate Transaminase or Alanine Aminotransferase Ratio":
  DE.SelectByStatus([Observation: Cx."Aspartate Transaminase or Alanine Aminotransferase Ratio"])

define "B Type Natriuretic Peptide [Bnp] in Blood, Serum or Plasma":
  DE.SelectByStatus([Observation: Cx."B Type Natriuretic Peptide [Bnp] in Blood, Serum or Plasma"])

define "Bicarbonate in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Bicarbonate in blood, serum or plasma"])

define "Bilirubin, Total, Bld/Ser/Plas":
  DE.SelectByStatus([Observation: Cx."Bilirubin, Total, Bld/Ser/Plas"])

define "Blood Ethanol Level":
  DE.SelectByStatus([Observation: Cx."Blood Ethanol Level"])

define "Blood Urea Nitrogen":
  DE.SelectByStatus([Observation: Cx."Blood Urea Nitrogen"])

define "Bone Biopsy Report":
  DE.SelectByStatus([Observation: Cx."Bone Biopsy Report"])

define "C reactive Protein (CRP), Bld/Ser/Plas":
  DE.SelectByStatus([Observation: Cx."C reactive Protein (CRP), Bld/Ser/Plas"])

define "Calcium (Not Corrected for Serum Albumin) in Blood, Plasms, or Serum":
  DE.SelectByStatus([Observation: Cx."Calcium (Not Corrected for Serum Albumin) in Blood, Plasms, or Serum"])

define "Cerebral Spinal Fluid (CSF) Analysis":
  DE.SelectByStatus([Observation: Cx."Cerebral Spinal Fluid (CSF) Analysis"])

define "Chloride in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Chloride in blood, serum or plasma"])

define "Coagulation Assay (PT, aPTT, Fibrinogen)":
  DE.SelectByStatus([Observation: Cx."Coagulation Assay (PT, aPTT, Fibrinogen)"])

define "Complete Blood Count (with Diff)":
  DE.SelectByStatus([Observation: Cx."Complete Blood Count (with Diff)"])

define "Comprehensive Metabolic Panel (CMP)":
  DE.SelectByStatus([Observation: Cx."Comprehensive Metabolic Panel (CMP)"])

define "Corrected Calcium":
  DE.SelectByStatus([Observation: Cx."Corrected Calcium"])

define "COVID 19 (SARS CoV 2), SARS CoV, Influenza virus A and B Tests":
  DE.SelectByStatus([Observation: Cx."COVID 19 (SARS CoV 2), SARS CoV, Influenza virus A and B Tests"])

define "Creatine Kinase (CK, CK MB) in Blood, Serum, or Plasma":
  DE.SelectByStatus([Observation: Cx."Creatine Kinase (CK, CK MB) in Blood, Serum, or Plasma"])

define "Creatinine in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Creatinine in blood, serum or plasma"])

define "Cystatin C":
  DE.SelectByStatus([Observation: Cx."Cystatin C"])

define "D Dimer Test":
  DE.SelectByStatus([Observation: Cx."D Dimer Test"])

define "Drugs of Abuse Screen":
  DE.SelectByStatus([Observation: Cx."Drugs of Abuse Screen"])

define "Erythrocyte Distribution Width":
  DE.SelectByStatus([Observation: Cx."Erythrocyte Distribution Width"])

define "Erythrocyte Sedimentation Rate (ESR), Blood":
  DE.SelectByStatus([Observation: Cx."Erythrocyte Sedimentation Rate (ESR), Blood"])

define "Estimated Average Glucose":
  DE.SelectByStatus([Observation: Cx."Estimated Average Glucose"])

define "Estimated Glomerular Filtration Rate (eGFR)":
  DE.SelectByStatus([Observation: Cx."Estimated Glomerular Filtration Rate (eGFR)"])

define "Fasting Blood Glucose":
  DE.SelectByStatus([Observation: Cx."Fasting Blood Glucose"])

define "Ferritin":
  DE.SelectByStatus([Observation: Cx."Ferritin"])

define "Free T4 (Thyroxine) Test":
  DE.SelectByStatus([Observation: Cx."Free T4 (Thyroxine) Test"])

define "Gamma Glutamyl Transpeptidase (Ggt) in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Gamma Glutamyl Transpeptidase (Ggt) in blood, serum or plasma"])

define "Gastric Tissue Biopsy Report":
  DE.SelectByStatus([Observation: Cx."Gastric Tissue Biopsy Report"])

define "Glucose Tolerance Test Results":
  DE.SelectByStatus([Observation: Cx."Glucose Tolerance Test Results"])

define "Hematocrit":
  DE.SelectByStatus([Observation: Cx."Hematocrit"])

define "Hemoglobin":
  DE.SelectByStatus([Observation: Cx."Hemoglobin"])

define "Hemoglobin A1C":
  DE.SelectByStatus([Observation: Cx."Hemoglobin A1C"])

define "High Density Lipoprotein":
  DE.SelectByStatus([Observation: Cx."High Density Lipoprotein"])

define "High Sensitivity Troponin":
  DE.SelectByStatus([Observation: Cx."High Sensitivity Troponin"])

define "INR":
  DE.SelectByStatus([Observation: Cx."INR"])

define "Intact Parathyroid Hormone":
  DE.SelectByStatus([Observation: Cx."Intact Parathyroid Hormone"])

define "Iron Saturation (Transferrin Saturation/TSAT)":
  DE.SelectByStatus([Observation: Cx."Iron Saturation (Transferrin Saturation/TSAT)"])

define "Kidney Biopsy Report":
  DE.SelectByStatus([Observation: Cx."Kidney Biopsy Report"])

define "KT/V Hemodialysis Ratio":
  DE.SelectByStatus([Observation: Cx."KT/V Hemodialysis Ratio"])

define "Low Density Lipoprotein":
  DE.SelectByStatus([Observation: Cx."Low Density Lipoprotein"])

define "Mean Corpuscular Hemoglobin Concentration":
  DE.SelectByStatus([Observation: Cx."Mean Corpuscular Hemoglobin Concentration"])

define "Mean Corpuscular Volume":
  DE.SelectByStatus([Observation: Cx."Mean Corpuscular Volume"])

define "Microorganisms Detection by Blood Culture":
  DE.SelectByStatus([Observation: Cx."Microorganisms Detection by Blood Culture"])

define "Microorganisms Detection by Sputum Culture":
  DE.SelectByStatus([Observation: Cx."Microorganisms Detection by Sputum Culture"])

define "Muscle Biopsy Report":
  DE.SelectByStatus([Observation: Cx."Muscle Biopsy Report"])

define "N Terminal Pro_B_Type Natriuretic Peptide [Nt_Probnp] in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."N Terminal Pro_B_Type Natriuretic Peptide [Nt_Probnp] in blood, serum or plasma"])

define "Oxygen Saturation, Blood":
  DE.SelectByStatus([Observation: Cx."Oxygen Saturation, Blood"])

define "Phosphorus in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Phosphorus in blood, serum or plasma"])

define "Platelet Count":
  DE.SelectByStatus([Observation: Cx."Platelet Count"])

define "Platelet Distribution Width":
  DE.SelectByStatus([Observation: Cx."Platelet Distribution Width"])

define "Platelet Mean Volume":
  DE.SelectByStatus([Observation: Cx."Platelet Mean Volume"])

define "Potassium in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Potassium in blood, serum or plasma"])

define "Procalcitonin in Blood, Serum, or Plasma":
  DE.SelectByStatus([Observation: Cx."Procalcitonin in Blood, Serum, or Plasma"])

define "Random Blood Glucose Test":
  DE.SelectByStatus([Observation: Cx."Random Blood Glucose Test"])

define "Red Blood Cell Count (Erythrocytes)":
  DE.SelectByStatus([Observation: Cx."Red Blood Cell Count (Erythrocytes)"])

define "Serum Rheumatoid Factor":
  DE.SelectByStatus([Observation: Cx."Serum Rheumatoid Factor"])

define "Skin Biopsy Report":
  DE.SelectByStatus([Observation: Cx."Skin Biopsy Report"])

define "Sodium in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Sodium in blood, serum or plasma"])
  
define "Thyroid Stimulating Hormone (TSH) Test":
  DE.SelectByStatus([Observation: Cx."Thyroid Stimulating Hormone (TSH) Test"])

define "Total Carbon Dioxide or Bicarbonate in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Total Carbon Dioxide or Bicarbonate in blood, serum or plasma"])

define "Total Cholesterol":
  DE.SelectByStatus([Observation: Cx."Total Cholesterol"])

define "Triglyceride in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Triglyceride in blood, serum or plasma"])

define "Triiodothyronine in serum or plasma":
  DE.SelectByStatus([Observation: Cx."Triiodothyronine in serum or plasma"])

define "Troponin I, Bld/Ser/Plas":
  DE.SelectByStatus([Observation: Cx."Troponin I, Bld/Ser/Plas"])

define "Troponin T, Bld/Ser/Pla":
  DE.SelectByStatus([Observation: Cx."Troponin T, Bld/Ser/Pla"])

define "Urea Reduction Ratio":
  DE.SelectByStatus([Observation: Cx."Urea Reduction Ratio"])

define "Uric Acid (Urate) in blood, serum or plasma":
  DE.SelectByStatus([Observation: Cx."Uric Acid (Urate) in blood, serum or plasma"])

define "Urine Albumin Creatinine Ratio":
  DE.SelectByStatus([Observation: Cx."Urine Albumin Creatinine Ratio"])

define "Urine Protein to Creatinine Ratio (UPCR)":
  DE.SelectByStatus([Observation: Cx."Urine Protein to Creatinine Ratio (UPCR)"])

define "Urine Sediment":
  DE.SelectByStatus([Observation: Cx."Urine Sediment"])

define "Urine Urea Nitrogen":
  DE.SelectByStatus([Observation: Cx."Urine Urea Nitrogen"])

define "Uroflowmetry":
  DE.SelectByStatus([Observation: Cx."Uroflowmetry"])

define "Vitamin D Levels":
  DE.SelectByStatus([Observation: Cx."Vitamin D Levels"])

define "White Blood Cell (Leukocytes) Count":
  DE.SelectByStatus([Observation: Cx."White Blood Cell (Leukocytes) Count"])

// define "":
//   DE.SelectByStatus([Observation: Cx.""])
