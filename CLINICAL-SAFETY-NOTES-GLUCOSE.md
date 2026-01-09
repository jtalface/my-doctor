# 🩸 GlucoGuide - Clinical Safety Notes

## Overview

GlucoGuide is a **diabetes data tracking and educational tool**. It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment recommendations.

## What This Application DOES

✅ **Tracks glucose readings** with timestamps and context  
✅ **Identifies patterns** using transparent, rule-based algorithms  
✅ **Provides educational information** about diabetes management  
✅ **Generates reports** for sharing with healthcare providers  
✅ **Stores data securely** with user control over export and deletion  

## What This Application DOES NOT Do

❌ **Does NOT diagnose** diabetes or any medical condition  
❌ **Does NOT prescribe** medications or insulin doses  
❌ **Does NOT recommend** changes to medication or insulin doses  
❌ **Does NOT replace** professional medical care  
❌ **Does NOT provide** medical advice or emergency services  

---

## Safety Boundaries

### Glucose Value Validation

All glucose values are validated against clinical safety boundaries:

| Boundary | mg/dL | mmol/L | Purpose |
|----------|-------|--------|---------|
| **ABSOLUTE_MIN** | 20 | 1.1 | Below this likely indicates meter error or critical emergency |
| **ABSOLUTE_MAX** | 600 | 33.3 | Above this likely indicates meter error or critical emergency |
| **TYPICAL_MIN** | 40 | 2.2 | Typical minimum for conscious patient |
| **TYPICAL_MAX** | 500 | 27.8 | Typical maximum for home monitoring |

**Implementation:** `packages/webapp-backend/src/utils/glucose-validation.ts`

---

## Suggestion Engine Rules

The suggestion engine uses **transparent, rule-based logic**. All rules are fully documented and testable.

### Rule A1: Severe Hypoglycemia (<54 mg/dL / 3.0 mmol/L)

**Trigger:** Latest reading < 54 mg/dL  
**Severity:** `urgent`  
**Clinical Reference:** ADA Standards of Care 2024 - Level 3 Hypoglycemia

**Suggestion Includes:**
- Immediate treatment instructions (15-20g fast-acting carbs)
- 15-minute recheck guidance
- Emergency instructions (call 911 if unconscious, seizing, or unable to swallow)
- Glucagon use if available

**What It Does NOT Include:**
- Insulin dose adjustments
- Medication changes

### Rule A2: Mild Hypoglycemia (54-70 mg/dL / 3.0-3.9 mmol/L)

**Trigger:** Latest reading 54-69 mg/dL  
**Severity:** `warn`  
**Clinical Reference:** ADA Standards of Care 2024 - Level 2 Hypoglycemia

**Suggestion Includes:**
- 15-15 rule education
- Treatment and recheck guidance
- Snack suggestion if meal delayed

**What It Does NOT Include:**
- Medication or insulin dose changes

### Rule B1: Severe Hyperglycemia with DKA Risk (>300 mg/dL, T1 Only)

**Trigger:** Latest reading > 300 mg/dL AND diabetes type = T1  
**Severity:** `urgent`  
**Clinical Reference:** ADA Standards of Care 2024 - DKA Management

**Suggestion Includes:**
- Ketone testing guidance (urine or blood)
- Hydration instructions
- Warning signs of DKA (nausea, vomiting, rapid breathing, fruity breath, confusion)
- Seek immediate care if ketones present or symptoms occur

**What It Does NOT Include:**
- Insulin dose recommendations
- Specific medication instructions

**Important:** This rule ONLY triggers for Type 1 diabetes due to higher DKA risk.

### Rule B2: Persistent Hyperglycemia Pattern

**Trigger:** ≥3 readings above 250 mg/dL in past 7 days  
**Severity:** `warn`  
**Clinical Reference:** ADA Standards of Care 2024

**Suggestion Includes:**
- Schedule healthcare provider appointment
- Review meal plan and carbohydrate intake
- Medication adherence check
- Hydration reminder

**What It Does NOT Include:**
- Specific medication or dose changes

### Rule C: Post-Meal Spikes Pattern

**Trigger:** ≥3 out of ≥3 post-meal readings above target in past 7 days  
**Severity:** `info`

**Suggestion Includes:**
- Meal portion and food choice suggestions
- Physical activity recommendations (10-15 min walk after meals)
- Fiber and protein suggestions
- Food diary recommendation

**What It Does NOT Include:**
- Insulin-to-carb ratio adjustments
- Specific medication changes

### Rule D: Fasting Highs Pattern

**Trigger:** ≥3 out of ≥3 fasting readings above target in past 7 days  
**Severity:** `info`

**Suggestion Includes:**
- Evening routine review
- Late snack timing discussion
- Medication timing discussion with provider
- Sleep quality considerations

**What It Does NOT Include:**
- Basal insulin dose changes
- Specific medication adjustments

### Rule E: Repeated Lows (Hypoglycemia Pattern)

**Trigger:** ≥2 readings below 70 mg/dL in past 7 days  
**Severity:** `warn`  
**Clinical Reference:** ADA Standards of Care 2024 - Hypoglycemia Prevention

**Suggestion Includes:**
- Contact healthcare provider guidance
- Pattern identification suggestions
- Pre-activity snack recommendations
- Always carry fast-acting carbs

**Explicit Warning:**
- "DO NOT reduce medications without medical guidance"

**What It Does NOT Include:**
- Medication or insulin dose reduction recommendations

### Rule F: High Glucose Variability

**Trigger:** Coefficient of variation (CV) > 36% with ≥10 readings  
**Severity:** `info`  
**Clinical Reference:** Clinical Guidelines on Glucose Variability

**Suggestion Includes:**
- Healthcare provider discussion
- CGM consideration suggestion
- Meal timing consistency
- Medication timing adherence check

**What It Does NOT Include:**
- Specific dose or timing changes

### Rule G: Logging Engagement Reminder

**Trigger:** No readings in 24-72 hours  
**Severity:** `info`

**Suggestion Includes:**
- Reminder to check and log glucose
- Importance of regular monitoring education

---

## Disclaimers

Every suggestion generated by the system includes:

### Standard Disclaimer
> "This information is for educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider."

### Emergency Situations Disclaimer (for urgent suggestions)
> "This is an emergency situation - seek immediate medical attention."

### Medication Disclaimer (where relevant)
> "Never adjust medications without consulting your healthcare provider."

---

## Audit Trail

All suggestions are logged to the database for safety and compliance:

**Logged Data:**
- User ID
- Timestamp
- Suggestion ID (rule ID)
- Suggestion type
- Severity level
- Full message and rationale
- Supporting data (readings that triggered the rule)
- User action (viewed/dismissed)

**Implementation:** `packages/webapp-backend/src/models/suggestion-audit.model.ts`

---

## Clinical References

1. **American Diabetes Association (ADA) Standards of Medical Care in Diabetes—2024**
   - Hypoglycemia classification and management
   - DKA risk assessment and management
   - Glycemic targets

2. **Clinical Guidelines on Glucose Variability**
   - Coefficient of variation (CV) thresholds
   - Time in range recommendations

---

## Testing

The suggestion engine has comprehensive unit tests covering all rules:

**Test Coverage:**
- ✅ Severe hypoglycemia detection (<54 mg/dL)
- ✅ Mild hypoglycemia detection (54-70 mg/dL)
- ✅ DKA risk detection (>300 mg/dL, T1 only)
- ✅ Persistent hyperglycemia pattern
- ✅ Post-meal spike pattern
- ✅ Fasting highs pattern
- ✅ Repeated lows pattern
- ✅ High variability detection
- ✅ Logging engagement
- ✅ Disclaimer presence on ALL suggestions
- ✅ NO insulin/medication dose recommendations

**Test Location:** `packages/webapp-backend/src/services/__tests__/suggestion-engine.test.ts`

---

## User Safety Features

### Input Validation
- All glucose values validated against clinical boundaries
- Warnings for unusual but possible values
- Hard limits prevent impossible values

### Data Integrity
- Readings stored with original unit and normalized value
- Timestamp validation (cannot be future dates)
- Context selection required for every reading

### User Control
- Complete data export at any time
- Data deletion available in settings
- All data belongs to the user

### Transparency
- Every suggestion shows:
  - Why it was triggered (rationale)
  - What readings caused it (supporting data)
  - What actions to consider (educational only)
  - Clinical references where applicable

---

## Emergency Guidance

The application provides clear emergency guidance for:

- **Severe hypoglycemia:** Call 911, use glucagon if available
- **DKA risk:** Check ketones, seek immediate care if present
- **Any concerning symptoms:** "When in doubt, seek medical attention"

**Emergency guidance is ALWAYS paired with appropriate disclaimers.**

---

## Regulatory Compliance

### NOT a Medical Device
GlucoGuide is a general wellness application that helps users track and understand their glucose data. It is not intended to diagnose, treat, cure, or prevent any disease.

### User Responsibility
Users are responsible for:
- Making their own healthcare decisions in consultation with their providers
- Seeking appropriate medical care
- Following their prescribed treatment plans
- Using the application as a tracking tool only

---

## Support and Contact

For technical issues or questions, users are directed to contact their healthcare provider for medical questions and our support team for technical assistance.

**Important:** We do not provide medical advice via technical support channels.

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Reviewed by: Engineering Team*

