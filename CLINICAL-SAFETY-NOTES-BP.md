# Clinical Safety Notes - HeartPal (Blood Pressure Tracker)

## ⚕️ Overview

This document details the clinical safety design, rule-based logic, thresholds, and limitations of the **HeartPal** blood pressure tracking feature.

**Critical Disclaimer**: HeartPal is for **tracking and educational purposes only**. It is NOT a medical device, does NOT provide medical advice, and should NOT replace professional medical care.

---

## 🛡️ Safety-First Design Principles

### 1. **Transparent Rule-Based System**
- All suggestions are generated from explicit, documented rules
- No "black box" AI/ML recommendations
- Every suggestion includes:
  - Clear rationale (why it triggered)
  - Supporting data (which readings triggered it)
  - Explicit disclaimer
  - Clinical references where applicable

### 2. **Non-Prescriptive Guidance**
- **We NEVER recommend:**
  - Medication changes or dose adjustments
  - Starting or stopping medications
  - Specific medical treatments
- **We DO provide:**
  - Educational information
  - Lifestyle suggestions (general wellness)
  - Reminders to consult healthcare providers

### 3. **Emergency Recognition**
- High-severity rules for **hypertensive crisis** (≥180/120 mmHg)
- Differentiate crisis WITH symptoms (emergency) vs WITHOUT (urgent follow-up)
- Clear "Call 911" messaging

### 4. **Measurement Quality Focus**
- 4-point core quality checklist (rested, positioning)
- Optional checklist for additional accuracy
- Quality score displayed to users
- Suggestions triggered if poor technique patterns detected

---

## 📊 Blood Pressure Classification

Based on **ACC/AHA 2017 Guidelines**:

| Classification | Systolic (mmHg) | Diastolic (mmHg) |
|----------------|-----------------|------------------|
| **Normal**     | < 120          | < 80             |
| **Elevated**   | 120-129        | < 80             |
| **Stage 1**    | 130-139        | 80-89            |
| **Stage 2**    | 140-179        | 90-119           |
| **Crisis**     | ≥ 180          | ≥ 120            |

**Note**: Classification determined by the HIGHER of systolic or diastolic category.

---

## 🚨 Critical Safety Rules

### Rule A1: Hypertensive Crisis WITH Symptoms (EMERGENCY)

**Trigger:**
- BP ≥ 180/120 mmHg **AND**
- User reports ANY symptom:
  - Chest pain
  - Shortness of breath
  - Severe headache
  - Vision changes (blurred, spots, loss)
  - Confusion/disorientation
  - Weakness/numbness

**Suggestion:**
- **Severity**: URGENT (🚨 red alert)
- **Title**: "EMERGENCY: High Blood Pressure with Symptoms"
- **Message**: Explicit "Call 911 or go to ER immediately. Do NOT wait or try to treat at home."
- **Rationale**: "BP ≥180/120 with symptoms indicates possible organ damage requiring immediate medical attention."

**Reference**: ACC/AHA 2017 Hypertensive Crisis Guidelines

**Actions:**
- Call 911 immediately
- Do NOT drive yourself
- Sit down and stay calm while waiting for help
- Have someone stay with you

---

### Rule A2: Hypertensive Crisis WITHOUT Symptoms (URGENT)

**Trigger:**
- BP ≥ 180/120 mmHg **AND**
- No symptoms reported (or "none" selected)

**Suggestion:**
- **Severity**: URGENT (⚠️ orange alert)
- **Title**: "Very High Blood Pressure - Recheck and Contact Doctor"
- **Message**: "Rest for 5 minutes, then recheck. If still ≥180/120, contact healthcare provider urgently or visit urgent care today. Do NOT adjust medications on your own."
- **Rationale**: "BP ≥180/120 without symptoms is called 'hypertensive urgency' and requires prompt medical evaluation, typically within hours to days."

**Reference**: ACC/AHA 2017 Hypertensive Crisis Guidelines

**Actions:**
- Rest 5 minutes in quiet place
- Recheck BP
- If still ≥180/120, contact doctor or go to urgent care TODAY
- Do NOT take extra BP medication without doctor approval

---

## ⚠️ Warning-Level Rules

### Rule B: Persistently Above Target

**Trigger:**
- ≥3 resting BP readings in last 7 days are above user's target (default 130/80)

**Suggestion:**
- **Severity**: WARN (⚠️ yellow)
- **Title**: "Pattern: Blood Pressure Above Target"
- **Message**: "You've had [X] out of [Y] resting readings above target. Persistent high BP requires evaluation and adjustment of treatment plan."
- **Rationale**: "Multiple readings above target suggest current management may need modification."

**Actions:**
- Schedule appointment with healthcare provider
- Review medication adherence (taking as prescribed)
- Discuss lifestyle factors: diet, exercise, stress, sleep
- Bring BP log to appointment
- Do NOT adjust medications without doctor approval

**Reference**: ACC/AHA 2017 Blood Pressure Guidelines

---

### Rule C: Poor Measurement Quality

**Trigger:**
- ≥3 readings in last 7 days missing core quality items (rested, feet flat, back supported, arm at heart level)

**Suggestion:**
- **Severity**: INFO (ℹ️ blue)
- **Title**: "Improve Measurement Technique"
- **Message**: "Several recent readings were taken without proper technique. Incorrect technique can lead to inaccurate readings, affecting treatment decisions."
- **Rationale**: "Proper measurement technique is essential for accurate BP readings."

**Actions:**
- Rest 5 minutes before taking BP
- Sit with feet flat on floor
- Back supported against chair
- Arm supported at heart level on table
- Use correct cuff size (covers 80% of arm)
- Avoid caffeine, exercise, smoking for 30 minutes before
- Take 2-3 readings 1 minute apart and record average

**Reference**: AHA Blood Pressure Measurement Guidelines

---

### Rule D: Non-Resting Context Readings

**Trigger:**
- ≥3 readings in last 7 days taken in non-resting context (after exercise, stressed)

**Suggestion:**
- **Severity**: INFO (ℹ️ blue)
- **Title**: "Take Readings at Rest"
- **Message**: "Many recent readings were taken after exercise or while stressed. BP naturally rises during activity and stress. For accurate assessment, most readings should be taken at rest."
- **Rationale**: "Resting BP is the standard for diagnosis and treatment decisions."

**Actions:**
- Take most readings while resting
- Wait 30+ minutes after exercise
- Take readings at same times daily (e.g., morning & evening)
- Sit quietly for 5 minutes before measuring

**Reference**: ACC/AHA BP Monitoring Guidelines

---

### Rule E: Adherence Gap (Missed Measurements)

**Trigger:**
- No BP readings in >48 hours (but <168 hours / 7 days)

**Suggestion:**
- **Severity**: INFO (ℹ️ blue)
- **Title**: "Reminder: Check Your Blood Pressure"
- **Message**: "It's been [X] hours since your last reading. Regular monitoring helps you and your provider track trends and adjust treatment."
- **Rationale**: "Consistent BP monitoring is important for effective hypertension management."

**Actions:**
- Aim to check BP at same times each day
- Set phone reminders
- Keep BP monitor in visible place
- Track both AM and PM if recommended

---

### Rule F: Schedule Adherence

**Trigger:**
- User has AM & PM schedule **AND**
- Actual readings < 70% of expected over 7 days with ≥3 days of readings

**Suggestion:**
- **Severity**: INFO (ℹ️ blue)
- **Title**: "Measurement Schedule Reminder"
- **Message**: "You have [X] readings over [Y] days. With your AM/PM schedule, aim for [Z] readings. Consistent timing helps detect patterns."
- **Rationale**: "Regular AM and PM readings provide better insight into BP patterns throughout the day."

**Actions:**
- Take readings at same times daily (e.g., 7 AM & 7 PM)
- Set phone reminders
- Morning: Before medications and breakfast
- Evening: Before dinner or at bedtime

---

### Rule G: High BP Variability

**Trigger:**
- ≥10 resting readings in 7 days **AND**
- Range (max systolic - min systolic) > 40 mmHg

**Suggestion:**
- **Severity**: INFO (ℹ️ blue)
- **Title**: "Variable Blood Pressure Readings"
- **Message**: "Your BP readings show significant variation (range: [X] mmHg). High variability may be related to measurement technique, timing, lifestyle factors, or medication adherence."
- **Rationale**: "BP variability can provide insights into contributing factors and treatment effectiveness."

**Actions:**
- Ensure consistent measurement technique
- Take readings at same times daily
- Review factors: sodium intake, alcohol, stress, sleep quality
- Take medications at same time each day
- Discuss variability with healthcare provider

**Reference**: Research on Blood Pressure Variability

---

## 🔒 Data Validation & Safety Boundaries

All user inputs are validated against **clinically plausible ranges**:

### Blood Pressure Values
- **Systolic**: 70-300 mmHg
- **Diastolic**: 40-200 mmHg
- **Systolic MUST be > Diastolic**

### Heart Rate (Pulse)
- **Pulse**: 30-220 bpm

### Rationale
- **Lower bounds**: Prevent accidental data entry errors while allowing for extreme but possible values (severe hypotension, bradycardia)
- **Upper bounds**: Allow for extreme hypertensive values and tachycardia while preventing implausible entries

**System Behavior**: Readings outside these ranges are **REJECTED** with a clear error message explaining the valid range.

---

## 📱 Measurement Quality Checklist

### Core Items (Required for Quality Score)
1. ✅ Rested for 5 minutes before measurement
2. ✅ Feet flat on floor (not crossed)
3. ✅ Back supported against chair
4. ✅ Arm supported at heart level on table

**Quality Score**: 4/4 = ✅ Good | < 4/4 = ⚠️ Suboptimal

### Optional Items (Recommended)
- Correct cuff size (covers 80% of arm circumference)
- No caffeine for 30 minutes
- No exercise for 30 minutes
- No smoking for 30 minutes

---

## 📈 Pattern Detection

### Patterns Analyzed (7-day window)
1. **Distribution by Classification**: % of readings in each category (normal, elevated, stage1, stage2, crisis)
2. **Above Target**: % of readings above user's target
3. **AM/PM Comparison**: If schedule includes both, compare morning vs evening averages
4. **Adherence Rate**: Actual readings / expected readings based on schedule

---

## 🚫 What We Do NOT Do

1. **Diagnose hypertension** - Only healthcare providers can diagnose
2. **Recommend specific medications** - All medication decisions are for providers
3. **Suggest dose changes** - Users must NEVER adjust doses without provider approval
4. **Replace professional monitoring** - Home BP is supplementary, not a replacement
5. **Provide emergency medical care** - We direct to emergency services only
6. **Use AI/ML for predictions** - Only transparent, rule-based logic

---

## 📚 Clinical References

1. **ACC/AHA 2017 Hypertension Guideline**: [Link](https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065)
2. **ACC/AHA 2017 Hypertensive Crisis Guidelines**
3. **AHA Blood Pressure Measurement Guidelines**
4. **ACC/AHA Blood Pressure Home Monitoring Guidelines**

---

## ⚠️ Limitations & Disclaimers

### Feature Limitations
- **Not FDA-cleared medical device**
- **No real-time monitoring** - User must manually enter readings
- **No automatic device sync** - Manual entry only (reduces device errors but increases user burden)
- **No medication interaction checking** - We track medications for context only
- **No personalized medical advice** - All suggestions are general educational information

### User Responsibilities
- Use a **validated, properly calibrated** BP monitor
- Use **correct cuff size** for arm circumference
- Follow **proper measurement technique**
- Report all **concerning symptoms** to healthcare provider immediately
- **Never adjust medications** without provider approval
- Seek **emergency care** for crisis + symptoms

### Suggested Disclaimer (Displayed Throughout App)
> "This information is for educational purposes only and is not a substitute for professional medical advice. If you feel unwell, seek medical care. Always consult your healthcare provider."

---

## 🔄 Audit & Transparency

### All Suggestions are Logged
- Each suggestion generated is stored in `BPSuggestionAudit` collection
- Includes:
  - Full suggestion text
  - Rationale
  - Supporting data (which readings triggered it)
  - Timestamp
  - User ID

### Activity Auditing
- All BP-related actions logged in `BPActivityAudit`
- Actions: create_session, delete_session, export_data, update_settings, etc.

---

## 🧪 Validation & Testing

While unit tests are not included in this implementation, the following should be tested:

### Classification Logic
- Verify correct classification for boundary values (119/79, 120/79, 130/80, etc.)
- Verify "higher category wins" logic (e.g., 135/79 = Stage 1, not Elevated)

### Suggestion Engine
- Test each rule with mock data
- Verify severity levels
- Verify disclaimers included
- Verify correct data in supportingData

### Validation Logic
- Test boundary values for all inputs
- Verify systolic > diastolic check
- Verify appropriate error messages

---

## 📞 Support & Escalation

### When to Direct Users to Care
1. **Immediate (911)**:
   - BP ≥180/120 with ANY symptoms
   - Chest pain, severe shortness of breath, confusion, weakness

2. **Urgent (same day)**:
   - BP ≥180/120 without symptoms (after recheck)
   - Persistent very high readings

3. **Prompt (within days)**:
   - Persistent readings above target
   - New concerning symptoms
   - Questions about medication management

---

## 🔐 Privacy & Security

- All BP data encrypted at rest (MongoDB)
- Transport encryption (HTTPS/TLS)
- Authentication required (JWT)
- User-specific data isolation (userId scoping)
- HIPAA-consideration (though not HIPAA-compliant as MVP)
- Export allows user data portability

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: MyDoctor Development Team

