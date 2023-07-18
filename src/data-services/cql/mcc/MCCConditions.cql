library MCCConditions version '0.1.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'
include DataElementHelpers called DE
include MCCConcepts called Cx

context Patient

// View summary tuple for all active conditions
define ConditionSummary:
  flatten {
    ReportCategorizedConditions,
    ReportOtherConditions
  }

define ReportCategorizedConditions:
  flatten {
    ReportArthritisConditions,
    ReportCardiovascularConditions,
    ReportChronicKidneyDiseaseConditions,
    ReportDiabetesConditions,
    ReportMentalHealthConditions,
    ReportNutritionMetabolicConditions,
    ReportPainConditions,
    ReportRespiratoryConditions,
    ReportSocialDeterminantsOfHealthConditions
  }

/// Returns a list of Resource.id for all categorized conditions.
define CategorizedConditionIds:
  flatten( ReportCategorizedConditions C
    return { C.id }
  )

/// Returns a list of Conditions that are not classified into CategorizedConditions.
define OtherConditions:
  AllActiveConditions C
    where not (C.id in CategorizedConditionIds)

define ReportOtherConditions:
  DE.ReportConditions(OtherConditions, 'Other Conditions', null)

/// All active conditions sorted in descending order by recorded or onset date.
define AllActiveConditions:
  [Condition] C
    sort by Coalesce(recordedDate.value, (onset as FHIR.dateTime).value) descending

//
// Arthritis Conditions
//

define ReportArthritisConditions: 
  flatten {
    DE.ReportConditions("Arthritis Conditions", 'Arthritis', 'Arthritis'),
    DE.ReportConditions("Osteoarthritis", 'Arthritis', 'Osteoarthritis'),
    DE.ReportConditions("Rheumatoid Arthritis", 'Arthritis', 'Rheumatoid Arthritis')
  }

define "Arthritis Conditions":
  ("Arthritis Disorders"
    union "Infectious Arthritis"
    union "Psoriatic Arthritis"
    union "Reactive Arthritis"
  )
  except "Osteoarthritis"
  except "Rheumatoid Arthritis"

define "Arthritis Disorders":
  SelectActiveConditions([Condition: Cx."Arthritis Disorders"])

define "Infectious Arthritis":
  SelectActiveConditions([Condition: Cx."Infectious Arthritis"])

define "Osteoarthritis":
  SelectActiveConditions([Condition: Cx."Osteoarthritis"])

define "Psoriatic Arthritis":
  SelectActiveConditions([Condition: Cx."Psoriatic Arthritis"])

define "Reactive Arthritis":
  SelectActiveConditions([Condition: Cx."Reactive Arthritis"])

define "Rheumatoid Arthritis":
  SelectActiveConditions([Condition: Cx."Rheumatoid Arthritis"])

//
// Cardiovascular Conditions
//

define ReportCardiovascularConditions: 
  flatten {
    DE.ReportConditions("Hypertension Conditions", 'Cardiovascular Disease', 'High Blood Pressure'),
    DE.ReportConditions("Heart Attack Conditions", 'Cardiovascular Disease', 'Heart Attack'),
    DE.ReportConditions("American Heart Association Heart Failure Stage", 'Cardiovascular Disease', 'Heart Failure Stage'),
    DE.ReportConditions("Aneurysm", 'Cardiovascular Disease', 'Aneurysm'),
    DE.ReportConditions("Angina", 'Cardiovascular Disease', 'Heart Pain'),
    DE.ReportConditions("Aortic Disease", 'Cardiovascular Disease', 'Aortic Disease'),
    DE.ReportConditions("Arrhythmia", 'Cardiovascular Disease', 'Heart Rhythm Problem'),
    DE.ReportConditions("Atherosclerotic Cardiovascular Disease", 'Cardiovascular Disease', 'Coronary Blockages'),
    DE.ReportConditions("Cardiomyopathy", 'Cardiovascular Disease', 'Heart Structure Problem'),
    DE.ReportConditions("Carotid Stenosis", 'Cardiovascular Disease', 'Carotid Blockage'),
    DE.ReportConditions("Cerebrovascular Disease", 'Cardiovascular Disease', 'Cerebrovascular Disease'),
    DE.ReportConditions("Congestive heart failure Diagnosis", 'Cardiovascular Disease', 'Heart Failure'),
    DE.ReportConditions("Coronary Artery Disease No MI", 'Cardiovascular Disease', 'Coronary Blockage'),
    DE.ReportConditions("Heart Failure", 'Cardiovascular Disease', 'Heart Failure'),
    DE.ReportConditions("Intracranial Stenosis", 'Cardiovascular Disease', 'Heart Damage from Blockages'),
    DE.ReportConditions("Ischemic Heart Disease", 'Cardiovascular Disease', 'Thickened Left Heart'),
    DE.ReportConditions("Left Ventricular Hypertrophy", 'Cardiovascular Disease', 'Heart Functional Level'),
    DE.ReportConditions("NYHA Heart Failure Functional Classifications", 'Cardiovascular Disease', 'Blood Vessel Blockages away from Heart'),
    DE.ReportConditions("Peripheral Vascular Disease", 'Cardiovascular Disease', 'Fast Heart Rate due to Standing'),
    DE.ReportConditions("Postural tachycardia syndrome (POTS) Diagnosis", 'Cardiovascular Disease', 'Fluid Leakage in Lung'),
    DE.ReportConditions("Pulmonary Edema", 'Cardiovascular Disease', 'High Risk Heart Pains'),
    DE.ReportConditions("Stroke History", 'Cardiovascular Disease', 'Heart Valve Disease')
  }

define "Hypertension Conditions":
  "Hypertension, Persistent"
    union "Hypertension, Primary and Secondary"
    union "Hypertension Stage"
    union "Hypertension, Essential or Primary"
    union "Hypertension, Pulmonary Hypertension"
    union "Hypertension, Secondary"

define "Heart Attack Conditions":
  "Acute Coronary Syndromes"
    union "Acute Myocardial Infarction"

define "Acute Coronary Syndromes":
  SelectActiveConditions([Condition: Cx."Acute Coronary Syndromes"])

define "Acute Myocardial Infarction":
  SelectActiveConditions([Condition: Cx."Acute Myocardial Infarction"])

define "American Heart Association Heart Failure Stage":
  SelectActiveConditions([Condition: Cx."American Heart Association Heart Failure Stage"])

define "Aneurysm":
  SelectActiveConditions([Condition: Cx."Aneurysm"])

define "Angina":
  SelectActiveConditions([Condition: Cx."Angina"])

define "Aortic Disease":
  SelectActiveConditions([Condition: Cx."Aortic Disease"])

define "Arrhythmia":
  SelectActiveConditions([Condition: Cx."Arrhythmia"])

define "Atherosclerotic Cardiovascular Disease":
  SelectActiveConditions([Condition: Cx."Atherosclerotic Cardiovascular Disease"])

define "Cardiomyopathy":
  SelectActiveConditions([Condition: Cx."Cardiomyopathy"])

define "Carotid Stenosis":
  SelectActiveConditions([Condition: Cx."Carotid Stenosis"])

define "Cerebrovascular Disease":
  SelectActiveConditions([Condition: Cx."Cerebrovascular Disease"])

define "Congestive heart failure Diagnosis":
  SelectActiveConditions([Condition: Cx."Congestive heart failure Diagnosis"])

define "Coronary Artery Disease No MI":
  SelectActiveConditions([Condition: Cx."Coronary Artery Disease No MI"])

define "Heart Failure":
  SelectActiveConditions([Condition: Cx."Heart Failure"])

define "Hypertension, Persistent":
  SelectActiveConditions([Condition: Cx."Hypertension, Persistent"])

define "Hypertension, Primary and Secondary":
  SelectActiveConditions([Condition: Cx."Hypertension, Primary and Secondary"])

define "Hypertension Stage":
  SelectActiveConditions([Condition: Cx."Hypertension Stage"])

define "Hypertension, Essential or Primary":
  SelectActiveConditions([Condition: Cx."Hypertension, Essential or Primary"])

define "Hypertension, Pulmonary Hypertension":
  SelectActiveConditions([Condition: Cx."Hypertension, Pulmonary Hypertension"])

define "Hypertension, Secondary":
  SelectActiveConditions([Condition: Cx."Hypertension, Secondary"])

define "Intracranial Stenosis":
  SelectActiveConditions([Condition: Cx."Intracranial Stenosis"])

define "Ischemic Heart Disease":
  SelectActiveConditions([Condition: Cx."Ischemic Heart Disease"])

define "Left Ventricular Hypertrophy":
  SelectActiveConditions([Condition: Cx."Left Ventricular Hypertrophy"])

define "NYHA Heart Failure Functional Classifications":
  SelectActiveConditions([Condition: Cx."NYHA Heart Failure Functional Classifications"])

define "Peripheral Vascular Disease":
  SelectActiveConditions([Condition: Cx."Peripheral Vascular Disease"])

define "Postural tachycardia syndrome (POTS) Diagnosis":
  SelectActiveConditions([Condition: Cx."Postural tachycardia syndrome (POTS) Diagnosis"])

define "Pulmonary Edema":
  SelectActiveConditions([Condition: Cx."Pulmonary Edema"])

define "Stroke History":
  SelectActiveConditions([Condition: Cx."Stroke History"])


//
// Chronic Kidney Disease Conditions
//

define ReportChronicKidneyDiseaseConditions: 
  flatten {
    DE.ReportConditions("Acute Renal Failure", 'Chronic Kidney Disease', 'Kidney Attack'),
    DE.ReportConditions("Chronic Kidney Disease Conditions", 'Chronic Kidney Disease', 'Chronic Kidney Disease')
  }

define "Chronic Kidney Disease Conditions":
  "Chronic Kidney Disease All Stages"
    union "Chronic Kidney Disease Type or Cause"

define "Acute Renal Failure":
  SelectActiveConditions([Condition: Cx."Acute Renal Failure"])

define "Chronic Kidney Disease All Stages":
  SelectActiveConditions([Condition: Cx."Chronic Kidney Disease All Stages"])

define "Chronic Kidney Disease Type or Cause":
  SelectActiveConditions([Condition: Cx."Chronic Kidney Disease Type or Cause"])

//
// Cognitive and Neurological Conditions
//


//
// Diabetes Conditions
//

define ReportDiabetesConditions: 
  flatten {
    DE.ReportConditions("Acanthosis Nigricans", 'Diabetes Conditions', 'Thickening/Darkening of Skin from Diabetes'),
    DE.ReportConditions("Amputated Limb (Not Traumatic)", 'Diabetes Conditions', 'Amputated Limb (not due to injury)'),
    DE.ReportConditions("Blindness", 'Diabetes Conditions', 'Blindness'),
    DE.ReportConditions("Cataract of the eye", 'Diabetes Conditions', 'Cataracts'),
    DE.ReportConditions("Cellulitis", 'Diabetes Conditions', 'Blindness'),
    DE.ReportConditions("Charcot Foot", 'Diabetes Conditions', 'Foot numbness'),
    DE.ReportConditions("Complication due to Diabetes Mellitus", 'Diabetes Conditions', 'Complication of Diabetes'),
    DE.ReportConditions("Diabetic Coma", 'Diabetes Conditions', 'Coma from Diabetes'),
    DE.ReportConditions("Diabetic Foot", 'Diabetes Conditions', 'Foot Problems from Diabetes'),
    DE.ReportConditions("Diabetic Foot Ulcer", 'Diabetes Conditions', 'Foot Sore from Diabetes'),
    DE.ReportConditions("Diabetic hand/ Diabetic cheiroarthropathy", 'Diabetes Conditions', 'Hand Problems from Diabetes'),
    DE.ReportConditions("Diabetic Neuropathy Conditions", 'Diabetes Conditions', 'Nerve Damage from Diabetes'),
    DE.ReportConditions("Diabetic Peripheral Angiopathy", 'Diabetes Conditions', 'Artery Damage from Diabetes'),
    DE.ReportConditions("Diabetic Retinopathy", 'Diabetes Conditions', 'Vision Loss from Diabetes'),
    DE.ReportConditions("Dupuytren's Contracture", 'Diabetes Conditions', 'Finger Stiffening'),
    DE.ReportConditions("Emotional Distress caused by Chronic Condition", 'Diabetes Conditions', 'Stress from Chronic Illness'),
    DE.ReportConditions("Eruptive Xanthomatosis", 'Diabetes Conditions', 'Skin Bumps from Cholesterol'),
    DE.ReportConditions("Gangrene", 'Diabetes Conditions', 'Gangrene'),
    DE.ReportConditions("Gestational Diabetes", 'Diabetes Conditions', 'Diabetes in Pregnancy'),
    DE.ReportConditions("Hyperglycemic Hyperosmolar Nonketotic Syndrome HHNS", 'Diabetes Conditions', 'Coma from Diabetes'),
    DE.ReportConditions("Hypoglycemia unawareness", 'Diabetes Conditions', 'Drowsiness from Low Blood Sugar'),
    DE.ReportConditions("Hypoglycemic event", 'Diabetes Conditions', 'Low Blood Sugar Event'),
    DE.ReportConditions("Ketoacidosis", 'Diabetes Conditions', 'High Ketones from Low Blood pH'),
    DE.ReportConditions("Maturity Onset Diabetes of the Young (MODY)", 'Diabetes Conditions', 'Diabetes'),
    DE.ReportConditions("Necrobiosis Lipoidica (Skin Lesions)", 'Diabetes Conditions', 'Skin Injury from Small Artery Disease'),
    DE.ReportConditions("Periodontitis", 'Diabetes Conditions', 'Inflammation around the Teeth'),
    DE.ReportConditions("Prediabetes (borderline diabetes)", 'Diabetes Conditions', 'Prediabetes'),
    DE.ReportConditions("Rubeosis Iridis", 'Diabetes Conditions', 'Iris Reddening from Diabetes'),
    DE.ReportConditions("Scleroderma or Thick Skin Syndrome", 'Diabetes Conditions', 'Skin Thickening'),
    DE.ReportConditions("Type 1 Diabetes", 'Diabetes Conditions', 'Autoimmune Diabetes'),
    DE.ReportConditions("Type II Diabetes", 'Diabetes Conditions', 'Diabetes')
  }

define "Acanthosis Nigricans":
  SelectActiveConditions([Condition: Cx."Acanthosis Nigricans"])

define "Amputated Limb (Not Traumatic)":
  SelectActiveConditions([Condition: Cx."Amputated Limb (Not Traumatic)"])

define "Blindness":
  SelectActiveConditions([Condition: Cx."Blindness"])

define "Cataract of the eye":
  SelectActiveConditions([Condition: Cx."Cataract of the eye"])

define "Cellulitis":
  SelectActiveConditions([Condition: Cx."Cellulitis"])

define "Charcot Foot":
  SelectActiveConditions([Condition: Cx."Charcot Foot"])

define "Complication due to Diabetes Mellitus":
  SelectActiveConditions([Condition: Cx."Complication due to Diabetes Mellitus"])

define "Diabetic Coma":
  SelectActiveConditions([Condition: Cx."Diabetic Coma"])

define "Diabetic Foot":
  SelectActiveConditions([Condition: Cx."Diabetic Foot"])

define "Diabetic Foot Ulcer":
  SelectActiveConditions([Condition: Cx."Diabetic Foot Ulcer"])

define "Diabetic hand/ Diabetic cheiroarthropathy":
  SelectActiveConditions([Condition: Cx."Diabetic hand/ Diabetic cheiroarthropathy"])

define "Diabetic Neuropathy Conditions":
  SelectActiveConditions([Condition: Cx."Diabetic Neuropathy Conditions"])

define "Diabetic Peripheral Angiopathy":
  SelectActiveConditions([Condition: Cx."Diabetic Peripheral Angiopathy"])

define "Diabetic Retinopathy":
  SelectActiveConditions([Condition: Cx."Diabetic Retinopathy"])

define "Dupuytren's Contracture":
  SelectActiveConditions([Condition: Cx."Dupuytren's Contracture"])

define "Emotional Distress caused by Chronic Condition":
  SelectActiveConditions([Condition: Cx."Emotional Distress caused by Chronic Condition"])

define "Eruptive Xanthomatosis":
  SelectActiveConditions([Condition: Cx."Eruptive Xanthomatosis"])

define "Gangrene":
  SelectActiveConditions([Condition: Cx."Gangrene"])

define "Gestational Diabetes":
  SelectActiveConditions([Condition: Cx."Gestational Diabetes"])

define "Hyperglycemic Hyperosmolar Nonketotic Syndrome HHNS":
  SelectActiveConditions([Condition: Cx."Hyperglycemic Hyperosmolar Nonketotic Syndrome HHNS"])

define "Hypoglycemia unawareness":
  SelectActiveConditions([Condition: Cx."Hypoglycemia unawareness"])

define "Hypoglycemic event":
  SelectActiveConditions([Condition: Cx."Hypoglycemic event"])

define "Ketoacidosis":
  SelectActiveConditions([Condition: Cx."Ketoacidosis"])

define "Maturity Onset Diabetes of the Young (MODY)":
  SelectActiveConditions([Condition: Cx."Maturity Onset Diabetes of the Young (MODY)"])

define "Necrobiosis Lipoidica (Skin Lesions)":
  SelectActiveConditions([Condition: Cx."Necrobiosis Lipoidica (Skin Lesions)"])

define "Periodontitis":
  SelectActiveConditions([Condition: Cx."Periodontitis"])

define "Prediabetes (borderline diabetes)":
  SelectActiveConditions([Condition: Cx."Prediabetes (borderline diabetes)"])

define "Rubeosis Iridis":
  SelectActiveConditions([Condition: Cx."Rubeosis Iridis"])

define "Scleroderma or Thick Skin Syndrome":
  SelectActiveConditions([Condition: Cx."Scleroderma or Thick Skin Syndrome"])

define "Type 1 Diabetes":
  SelectActiveConditions([Condition: Cx."Type 1 Diabetes"])

define "Type II Diabetes":
  SelectActiveConditions([Condition: Cx."Type II Diabetes"])

//
// Digestive System/Gastrointestinal Conditions
//

//
// Dissimilar Conditions
//

//
// Functional Health Conditions
//

//
// Genitourinary Conditions
//

//
// Hormonal Conditions
//

//
// Infectious Disease Conditions
//

//
// Long Covid Diagnosis Condition
//

//
// Mental Health Conditions
//

define ReportMentalHealthConditions: 
  flatten {
    DE.ReportConditions("Anxiety Excluding PTSD", 'Mental Health', 'Anxiety'),
    DE.ReportConditions("PostTraumatic Stress Disorder PTSD", 'Mental Health', 'PTSD'),
    DE.ReportConditions("Depression Conditions", 'Mental Health', 'Depression'),
    DE.ReportConditions("Post Partum Depression", 'Mental Health', 'Depression after Pregnancy'),
    DE.ReportConditions("Bipolar Diagnosis", 'Mental Health', 'Bipolar'),
    DE.ReportConditions("Trauma Conditions", 'Mental Health', 'Trauma'),
    DE.ReportConditions("Grief or Loss", 'Mental Health', 'Grief'),
    DE.ReportConditions("Suicide Risk", 'Mental Health', 'Risk of Suicide')
  }

define "Anxiety Excluding PTSD":
  "Anxiety"
    except "PostTraumatic Stress Disorder PTSD"

define "Trauma Conditions":
  "Experience of Traumatic Events"
    union "Psychological Trauma"

define "Depression Conditions":
  "Depression Diagnosis"
    union "Dysthymia"
    union "Major Depression"
    union "Psychotic Depression"
    union "Seasonal Affective Disorder"

define "Anxiety":
  SelectActiveConditions([Condition: Cx."Anxiety"])

define "Bipolar Diagnosis":
  SelectActiveConditions([Condition: Cx."Bipolar Diagnosis"])

define "Depression Diagnosis":
  SelectActiveConditions([Condition: Cx."Depression Diagnosis"])

define "Dysthymia":
  SelectActiveConditions([Condition: Cx."Dysthymia"])

define "Experience of Traumatic Events":
  SelectActiveConditions([Condition: Cx."Experience of Traumatic Events"])

define "Grief or Loss":
  SelectActiveConditions([Condition: Cx."Grief or Loss"])

define "Major Depression":
  SelectActiveConditions([Condition: Cx."Major Depression"])

define "Post Partum Depression":
  SelectActiveConditions([Condition: Cx."Post Partum Depression"])

define "PostTraumatic Stress Disorder PTSD":
  SelectActiveConditions([Condition: Cx."PostTraumatic Stress Disorder PTSD"])

define "Psychological Trauma":
  SelectActiveConditions([Condition: Cx."Psychological Trauma"])

define "Psychotic Depression":
  SelectActiveConditions([Condition: Cx."Psychotic Depression"])

define "Seasonal Affective Disorder":
  SelectActiveConditions([Condition: Cx."Seasonal Affective Disorder"])

define "Suicide Risk":
  SelectActiveConditions([Condition: Cx."Suicide Risk"])

//
// Musculoskeletal Conditions
//

//
// Nutrition / Metabolic Conditions
//

define ReportNutritionMetabolicConditions:
  flatten {
    DE.ReportConditions("Alkaline Phosphatase Deficiency Conditions", 'Nutrition / Metabolic Conditions', 'Low Alkaline Phosphatase'),
    DE.ReportConditions("Anemia Conditions", 'Nutrition / Metabolic Conditions', 'Anemia'),
    DE.ReportConditions("Familial Hypercholesterolemia", 'Nutrition / Metabolic Conditions', 'Genetic High Cholesterol'),
    DE.ReportConditions("Gout", 'Nutrition / Metabolic Conditions', 'Gout'),
    DE.ReportConditions("Hypercalcemia Conditions", 'Nutrition / Metabolic Conditions', 'High Calcium'),
    DE.ReportConditions("Hyperkalemia Conditions", 'Nutrition / Metabolic Conditions', 'High Potassium'),
    DE.ReportConditions("Hyperlipidemia Conditions", 'Nutrition / Metabolic Conditions', 'High Blood Fats'),
    DE.ReportConditions("Hyperphosphatemia Conditions", 'Nutrition / Metabolic Conditions', 'High Phosphates in Blood'),
    DE.ReportConditions("Hypertriglyceridemia", 'Nutrition / Metabolic Conditions', 'High Triglycerides'),
    DE.ReportConditions("Hyperuricemia Conditions", 'Nutrition / Metabolic Conditions', 'High Uric Acid in Blood'),
    DE.ReportConditions("Hypoalbuminemia Conditions", 'Nutrition / Metabolic Conditions', 'Low Albumin'),
    DE.ReportConditions("Hypocalcemia Conditions", 'Nutrition / Metabolic Conditions', 'Low Calcium'),
    DE.ReportConditions("Malnutrition Diagnosis", 'Nutrition / Metabolic Conditions', 'Malnutrition'),
    DE.ReportConditions("Metabolic Acidosis Conditions", 'Nutrition / Metabolic Conditions', 'Low Blood pH due to Kidney Problems'),
    DE.ReportConditions("Metabolic syndrome", 'Nutrition / Metabolic Conditions', 'Diabetes'),
    DE.ReportConditions("Obesity Conditions", 'Nutrition / Metabolic Conditions', 'High BMI'),
    DE.ReportConditions("Vitamin D Deficiency Conditions", 'Nutrition / Metabolic Conditions', 'Low Vitamin D')
  }

define "Alkaline Phosphatase Deficiency Conditions":
  SelectActiveConditions([Condition: Cx."Alkaline Phosphatase Deficiency Conditions"])

define "Anemia Conditions":
  SelectActiveConditions([Condition: Cx."Anemia Conditions"])

define "Familial Hypercholesterolemia":
  SelectActiveConditions([Condition: Cx."Familial Hypercholesterolemia"])

define "Gout":
  SelectActiveConditions([Condition: Cx."Gout"])

define "Hypercalcemia Conditions":
  SelectActiveConditions([Condition: Cx."Hypercalcemia Conditions"])

define "Hyperkalemia Conditions":
  SelectActiveConditions([Condition: Cx."Hyperkalemia Conditions"])

define "Hyperlipidemia Conditions":
  SelectActiveConditions([Condition: Cx."Hyperlipidemia Conditions"])

define "Hyperphosphatemia Conditions":
  SelectActiveConditions([Condition: Cx."Hyperphosphatemia Conditions"])

define "Hypertriglyceridemia":
  SelectActiveConditions([Condition: Cx."Hypertriglyceridemia"])

define "Hyperuricemia Conditions":
  SelectActiveConditions([Condition: Cx."Hyperuricemia Conditions"])

define "Hypoalbuminemia Conditions":
  SelectActiveConditions([Condition: Cx."Hypoalbuminemia Conditions"])

define "Hypocalcemia Conditions":
  SelectActiveConditions([Condition: Cx."Hypocalcemia Conditions"])

define "Malnutrition Diagnosis":
  SelectActiveConditions([Condition: Cx."Malnutrition Diagnosis"])

define "Metabolic Acidosis Conditions":
  SelectActiveConditions([Condition: Cx."Metabolic Acidosis Conditions"])

define "Metabolic syndrome":
  SelectActiveConditions([Condition: Cx."Metabolic syndrome"])

define "Obesity Conditions":
  SelectActiveConditions([Condition: Cx."Obesity Conditions"])

define "Vitamin D Deficiency Conditions":
  SelectActiveConditions([Condition: Cx."Vitamin D Deficiency Conditions"])

//
// Pain Conditions
//

define ReportPainConditions: 
  flatten {
    DE.ReportConditions("Chronic Pain Conditions with Exceptions", 'Pain Conditions', 'Chronic Pain'),
    DE.ReportConditions("Low Back Pain", 'Pain Conditions', 'Low Back Pain'),
    DE.ReportConditions("Migraine", 'Pain Conditions', 'Migraine'),
    DE.ReportConditions("Chronic Tension-type Headache diagnosis", 'Pain Conditions', 'Chronic Headaches'),
    DE.ReportConditions("Neuropathic Pain (Neuralgia)", 'Pain Conditions', 'Nerve Pain'),
    DE.ReportConditions("Phantom Pain", 'Pain Conditions', 'Phantom Pain')
  }

define "Chronic Pain Conditions with Exceptions":
  "Chronic Pain Conditions"
    except "Low Back Pain"
    except "Migraine"
    except "Chronic Tension-type Headache diagnosis"
    except "Neuropathic Pain (Neuralgia)"
    except "Phantom Pain"

define "Chronic Pain Conditions":
  SelectActiveConditions([Condition: Cx."Chronic Pain Conditions"])

define "Low Back Pain":
  SelectActiveConditions([Condition: Cx."Low Back Pain"])

define "Migraine":
  SelectActiveConditions([Condition: Cx."Migraine"])

define "Chronic Tension-type Headache diagnosis":
  SelectActiveConditions([Condition: Cx."Chronic Tension-type Headache diagnosis"])

define "Neuropathic Pain (Neuralgia)":
  SelectActiveConditions([Condition: Cx."Neuropathic Pain (Neuralgia)"])

define "Phantom Pain":
  SelectActiveConditions([Condition: Cx."Phantom Pain"])

//
// Respiratory Conditions
//

define ReportRespiratoryConditions: 
  flatten {
    DE.ReportConditions("Asthma Diagnosis", 'Respiratory Conditions', 'Asthma'),
    DE.ReportConditions("Bronchiectasis Diagnosis", 'Respiratory Conditions', 'Lung Damage'),
    DE.ReportConditions("Chronic obstructive pulmonary disease (COPD) Diagnosis", 'Respiratory Conditions', 'COPD'),
    DE.ReportConditions("Interstitial lung disease Diagnosis", 'Respiratory Conditions', 'Interstitial Lung Damage'),
    DE.ReportConditions("Pulmonary embolism Diagnosis", 'Respiratory Conditions', 'Lung Clot'),
    DE.ReportConditions("Sleep Apnea Disorders", 'Respiratory Conditions', 'Sleep Apnea')
  }

define "Asthma Diagnosis":
  SelectActiveConditions([Condition: Cx."Asthma Diagnosis"])

define "Bronchiectasis Diagnosis":
  SelectActiveConditions([Condition: Cx."Bronchiectasis Diagnosis"])

define "Chronic obstructive pulmonary disease (COPD) Diagnosis":
  SelectActiveConditions([Condition: Cx."Chronic obstructive pulmonary disease (COPD) Diagnosis"])

define "Interstitial lung disease Diagnosis":
  SelectActiveConditions([Condition: Cx."Interstitial lung disease Diagnosis"])

define "Pulmonary embolism Diagnosis":
  SelectActiveConditions([Condition: Cx."Pulmonary embolism Diagnosis"])

define "Sleep Apnea Disorders":
  SelectActiveConditions([Condition: Cx."Sleep Apnea Disorders"])

//
// Social Determinants of Health Conditions
//

define ReportSocialDeterminantsOfHealthConditions: 
  DE.ReportConditions("Social Determinants of Health", 'Life(style) Problems', null)

define "Social Determinants of Health":
  SelectActiveConditions([Condition: Cx."Social Determinants of Health"])

//
// Substance Use / Misuse Conditions
//


// define "":
//   SelectActiveConditions([Condition: Cx.""])

// we currently select only 'active' conditions in the server query
define function SelectActiveConditions(conditions List<Condition>):
  conditions C
    sort by Coalesce(recordedDate.value, (onset as FHIR.dateTime).value) descending

// BUG: this works in VSCode but returns null in JavaScript execution.
// define function SelectActiveConditions(conditions List<Condition>):
//   conditions Cond
//     where (Cond.clinicalStatus ~ FC."active"
//           or Cond.clinicalStatus ~ FC."relapse"
//           or Cond.clinicalStatus ~ FC."recurrence")
//       and Cond.verificationStatus ~ FC."confirmed"
//     sort by recordedDate.value descending
