export const labTemplates = {
  "Full Blood Count": [
    { parameter: "Hemoglobin", loincCode: "718-7", unit: "g/dL", referenceRange: "M: 13.5-17.5 | F: 12.0-15.5" },
    { parameter: "White Blood Cells (WBC)", loincCode: "6690-2", unit: "x10³/µL", referenceRange: "4.5-11.0" },
    { parameter: "Red Blood Cells (RBC)", loincCode: "789-8", unit: "x10⁶/µL", referenceRange: "M: 4.5-5.9 | F: 4.1-5.1" },
    { parameter: "Platelets", loincCode: "777-3", unit: "x10³/µL", referenceRange: "150-400" },
    { parameter: "Hematocrit (HCT)", loincCode: "4544-3", unit: "%", referenceRange: "M: 41-53 | F: 36-46" },
    { parameter: "MCV", loincCode: "787-2", unit: "fL", referenceRange: "80-100" },
    { parameter: "MCH", loincCode: "785-6", unit: "pg", referenceRange: "27-33" },
    { parameter: "MCHC", loincCode: "786-4", unit: "g/dL", referenceRange: "31.5-35.7" },
    { parameter: "Neutrophils", loincCode: "770-8", unit: "%", referenceRange: "50-70" },
    { parameter: "Lymphocytes", loincCode: "731-0", unit: "%", referenceRange: "20-40" },
    { parameter: "Monocytes", loincCode: "742-7", unit: "%", referenceRange: "2-8" },
    { parameter: "Eosinophils", loincCode: "711-2", unit: "%", referenceRange: "1-4" },
    { parameter: "Basophils", loincCode: "704-7", unit: "%", referenceRange: "0-1" },
  ],

  "Liver Function Test": [
    { parameter: "Alanine Aminotransferase (ALT)", loincCode: "1742-6", unit: "U/L", referenceRange: "7-56" },
    { parameter: "Aspartate Aminotransferase (AST)", loincCode: "1920-8", unit: "U/L", referenceRange: "10-40" },
    { parameter: "Alkaline Phosphatase (ALP)", loincCode: "6768-6", unit: "U/L", referenceRange: "44-147" },
    { parameter: "Gamma-GT (GGT)", loincCode: "2324-2", unit: "U/L", referenceRange: "M: 8-61 | F: 5-36" },
    { parameter: "Total Bilirubin", loincCode: "1975-2", unit: "mg/dL", referenceRange: "0.2-1.2" },
    { parameter: "Direct Bilirubin", loincCode: "1968-7", unit: "mg/dL", referenceRange: "0.0-0.3" },
    { parameter: "Indirect Bilirubin", loincCode: "1971-1", unit: "mg/dL", referenceRange: "0.2-0.9" },
    { parameter: "Albumin", loincCode: "1751-7", unit: "g/dL", referenceRange: "3.5-5.0" },
    { parameter: "Total Protein", loincCode: "2885-2", unit: "g/dL", referenceRange: "6.3-8.2" },
    { parameter: "Prothrombin Time (PT)", loincCode: "5902-2", unit: "seconds", referenceRange: "11-13.5" },
  ],

  "Kidney Function Test": [
    { parameter: "Creatinine", loincCode: "2160-0", unit: "mg/dL", referenceRange: "M: 0.74-1.35 | F: 0.59-1.04" },
    { parameter: "Blood Urea Nitrogen (BUN)", loincCode: "3094-0", unit: "mg/dL", referenceRange: "7-20" },
    { parameter: "Urea", loincCode: "22664-7", unit: "mmol/L", referenceRange: "2.5-7.1" },
    { parameter: "Uric Acid", loincCode: "3084-1", unit: "mg/dL", referenceRange: "M: 3.4-7.0 | F: 2.4-6.0" },
    { parameter: "eGFR", loincCode: "62238-1", unit: "mL/min/1.73m²", referenceRange: ">60" },
    { parameter: "Sodium (Na)", loincCode: "2951-2", unit: "mmol/L", referenceRange: "136-145" },
    { parameter: "Potassium (K)", loincCode: "2823-3", unit: "mmol/L", referenceRange: "3.5-5.1" },
    { parameter: "Chloride (Cl)", loincCode: "2075-0", unit: "mmol/L", referenceRange: "98-107" },
    { parameter: "Bicarbonate (HCO3)", loincCode: "1963-8", unit: "mmol/L", referenceRange: "22-29" },
    { parameter: "Calcium (Ca)", loincCode: "17861-6", unit: "mg/dL", referenceRange: "8.5-10.5" },
    { parameter: "Phosphorus", loincCode: "2777-1", unit: "mg/dL", referenceRange: "2.5-4.5" },
  ],

  "Blood Sugar": [
    { parameter: "Fasting Blood Glucose", loincCode: "1558-6", unit: "mg/dL", referenceRange: "70-99" },
    { parameter: "Random Blood Glucose (RBS)", loincCode: "2345-7", unit: "mg/dL", referenceRange: "<140" },
    { parameter: "HbA1c", loincCode: "4548-4", unit: "%", referenceRange: "<5.7" },
    { parameter: "2-Hour Post Glucose", loincCode: "1504-0", unit: "mg/dL", referenceRange: "<140" },
  ],

  "Lipid Profile": [
    { parameter: "Total Cholesterol", loincCode: "2093-3", unit: "mg/dL", referenceRange: "<200" },
    { parameter: "LDL Cholesterol", loincCode: "2089-1", unit: "mg/dL", referenceRange: "<100" },
    { parameter: "HDL Cholesterol", loincCode: "2085-9", unit: "mg/dL", referenceRange: "M: >40 | F: >50" },
    { parameter: "Triglycerides", loincCode: "2571-8", unit: "mg/dL", referenceRange: "<150" },
    { parameter: "VLDL Cholesterol", loincCode: "13457-7", unit: "mg/dL", referenceRange: "2-30" },
    { parameter: "Total Cholesterol/HDL Ratio", loincCode: "9830-1", unit: "ratio", referenceRange: "<5.0" },
  ],

  "HIV Test": [
    { parameter: "HIV 1/2 Antibody", loincCode: "31201-7", unit: "", referenceRange: "Non-Reactive" },
    { parameter: "HIV Antigen (p24)", loincCode: "44871-2", unit: "", referenceRange: "Non-Reactive" },
    { parameter: "CD4 Count", loincCode: "24467-3", unit: "cells/µL", referenceRange: "500-1500" },
    { parameter: "CD8 Count", loincCode: "14136-6", unit: "cells/µL", referenceRange: "150-1000" },
    { parameter: "CD4/CD8 Ratio", loincCode: "44791-2", unit: "ratio", referenceRange: ">1.0" },
    { parameter: "Viral Load", loincCode: "20447-9", unit: "copies/mL", referenceRange: "Undetectable" },
  ],

  "Malaria Test": [
    { parameter: "Malaria Antigen (RDT)", loincCode: "32700-7", unit: "", referenceRange: "Negative" },
    { parameter: "Malaria Species", loincCode: "51587-4", unit: "", referenceRange: "None detected" },
    { parameter: "Parasite Density", loincCode: "51588-2", unit: "parasites/µL", referenceRange: "0" },
    { parameter: "Malaria Microscopy", loincCode: "634-6", unit: "", referenceRange: "Negative" },
  ],

  "Thyroid Function": [
    { parameter: "TSH (Thyroid Stimulating Hormone)", loincCode: "3016-3", unit: "mIU/L", referenceRange: "0.4-4.0" },
    { parameter: "Free T3 (FT3)", loincCode: "14927-8", unit: "pg/mL", referenceRange: "2.3-4.2" },
    { parameter: "Free T4 (FT4)", loincCode: "3024-7", unit: "ng/dL", referenceRange: "0.8-1.8" },
    { parameter: "Total T3", loincCode: "3053-6", unit: "ng/dL", referenceRange: "80-200" },
    { parameter: "Total T4", loincCode: "3026-2", unit: "µg/dL", referenceRange: "5.1-14.1" },
    { parameter: "Anti-TPO Antibody", loincCode: "8099-7", unit: "IU/mL", referenceRange: "<35" },
  ],

  "Urine Test": [
    { parameter: "Color", loincCode: "5778-6", unit: "", referenceRange: "Yellow/Pale Yellow" },
    { parameter: "Appearance", loincCode: "11279-7", unit: "", referenceRange: "Clear" },
    { parameter: "pH", loincCode: "2756-5", unit: "", referenceRange: "4.5-8.0" },
    { parameter: "Specific Gravity", loincCode: "2965-2", unit: "", referenceRange: "1.001-1.035" },
    { parameter: "Protein", loincCode: "2888-6", unit: "mg/dL", referenceRange: "Negative" },
    { parameter: "Glucose", loincCode: "25428-4", unit: "mg/dL", referenceRange: "Negative" },
    { parameter: "Ketones", loincCode: "2514-8", unit: "", referenceRange: "Negative" },
    { parameter: "Blood", loincCode: "5794-3", unit: "", referenceRange: "Negative" },
    { parameter: "Leukocytes", loincCode: "5799-2", unit: "", referenceRange: "Negative" },
    { parameter: "Nitrites", loincCode: "5802-4", unit: "", referenceRange: "Negative" },
    { parameter: "Urobilinogen", loincCode: "13658-0", unit: "mg/dL", referenceRange: "0.1-1.0" },
    { parameter: "Bilirubin", loincCode: "5770-3", unit: "", referenceRange: "Negative" },
    { parameter: "WBC (Microscopy)", loincCode: "5821-4", unit: "/HPF", referenceRange: "0-5" },
    { parameter: "RBC (Microscopy)", loincCode: "13945-1", unit: "/HPF", referenceRange: "0-2" },
    { parameter: "Epithelial Cells", loincCode: "11277-1", unit: "/HPF", referenceRange: "0-5" },
    { parameter: "Casts", loincCode: "24124-0", unit: "/LPF", referenceRange: "None" },
    { parameter: "Crystals", loincCode: "5787-7", unit: "", referenceRange: "None/Few" },
    { parameter: "Bacteria", loincCode: "630-4", unit: "", referenceRange: "None" },
  ],

  "Culture & Sensitivity": [
    { parameter: "Specimen Type", loincCode: "70241-5", unit: "", referenceRange: "N/A" },
    { parameter: "Organism Isolated", loincCode: "634-6", unit: "", referenceRange: "No Growth" },
    { parameter: "Colony Count", loincCode: "51480-2", unit: "CFU/mL", referenceRange: "<10,000" },
    { parameter: "Amoxicillin", loincCode: "18862-3", unit: "", referenceRange: "Sensitive" },
    { parameter: "Ciprofloxacin", loincCode: "18906-8", unit: "", referenceRange: "Sensitive" },
    { parameter: "Ampicillin", loincCode: "18864-9", unit: "", referenceRange: "Sensitive" },
    { parameter: "Trimethoprim", loincCode: "18996-9", unit: "", referenceRange: "Sensitive" },
    { parameter: "Gentamicin", loincCode: "18928-2", unit: "", referenceRange: "Sensitive" },
    { parameter: "Ceftriaxone", loincCode: "18900-1", unit: "", referenceRange: "Sensitive" },
    { parameter: "Metronidazole", loincCode: "18943-1", unit: "", referenceRange: "Sensitive" },
    { parameter: "Chloramphenicol", loincCode: "18907-6", unit: "", referenceRange: "Sensitive" },
  ],

  "Blood Test": [
    { parameter: "Hemoglobin", loincCode: "718-7", unit: "g/dL", referenceRange: "M: 13.5-17.5 | F: 12.0-15.5" },
    { parameter: "Blood Group", loincCode: "883-9", unit: "", referenceRange: "A/B/AB/O" },
    { parameter: "Rhesus Factor", loincCode: "10331-7", unit: "", referenceRange: "Positive/Negative" },
    { parameter: "ESR", loincCode: "30341-2", unit: "mm/hr", referenceRange: "M: 0-15 | F: 0-20" },
    { parameter: "CRP", loincCode: "1988-5", unit: "mg/L", referenceRange: "<10" },
  ],

  "Stool Test": [
    { parameter: "Color", loincCode: "32208-1", unit: "", referenceRange: "Brown" },
    { parameter: "Consistency", loincCode: "32209-9", unit: "", referenceRange: "Formed" },
    { parameter: "Blood (Occult)", loincCode: "2335-8", unit: "", referenceRange: "Negative" },
    { parameter: "Mucus", loincCode: "11474-4", unit: "", referenceRange: "Absent" },
    { parameter: "Ova & Parasites", loincCode: "634-6", unit: "", referenceRange: "None detected" },
    { parameter: "WBC (Microscopy)", loincCode: "5821-4", unit: "/HPF", referenceRange: "0-3" },
    { parameter: "RBC (Microscopy)", loincCode: "13945-1", unit: "/HPF", referenceRange: "None" },
    { parameter: "Reducing Substances", loincCode: "2349-9", unit: "", referenceRange: "Negative" },
    { parameter: "H. pylori Antigen", loincCode: "17780-8", unit: "", referenceRange: "Negative" },
  ],

  "Other": [
    { parameter: "Result", loincCode: "", unit: "", referenceRange: "" },
    { parameter: "Notes", loincCode: "", unit: "", referenceRange: "" },
  ],
};

export const getLabTemplate = (testType) => {
  return labTemplates[testType] || labTemplates["Other"];
};

export const calculateFlag = (value, referenceRange) => {
  if (!value || !referenceRange) return "NORMAL";
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "NORMAL";

  // Extract numeric range (handles "13.5-17.5" format)
  const rangeMatch = referenceRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
  if (!rangeMatch) return "NORMAL";

  const min = parseFloat(rangeMatch[1]);
  const max = parseFloat(rangeMatch[2]);

  if (numValue < min * 0.8) return "CRITICAL LOW";
  if (numValue < min) return "LOW";
  if (numValue > max * 1.2) return "CRITICAL HIGH";
  if (numValue > max) return "HIGH";
  return "NORMAL";
};