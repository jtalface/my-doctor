import { State } from "./types/states";
import { StateMachineDefinition } from "./types/state-machine";

export const Machine: StateMachineDefinition = {
  // === Original nodes ===
  [State.GREET]: {
    id: State.GREET,
    prompt: "You are a friendly wellness assistant. Greet the patient and ask how you can help today.",
    inputType: "text",
    transitions: [{ condition: "always", next: State.COLLECT_BASIC_INFO }]
  },

  [State.COLLECT_BASIC_INFO]: {
    id: State.COLLECT_BASIC_INFO,
    prompt: "Collect age, gender, weight, height, and main concern.",
    inputType: "structured",
    transitions: [
      { condition: "always", next: State.SCREENING }
    ]
  },

  [State.SCREENING]: {
    id: State.SCREENING,
    prompt: "Ask targeted screening questions based on patient concern.",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.WELLNESS_EDUCATION }
    ]
  },

  [State.WELLNESS_EDUCATION]: {
    id: State.WELLNESS_EDUCATION,
    prompt: "Provide general wellness advice based on data.",
    inputType: "text",
    transitions: [{ condition: "always", next: State.FOLLOW_UP }]
  },

  [State.FOLLOW_UP]: {
    id: State.FOLLOW_UP,
    prompt: "Ask if they need anything else.",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [{ condition: "always", next: State.END }]
  },

  // === Extended nodes from upgrade ===
  [State.START]: {
    id: State.START,
    prompt: "Hello — I'm a health assistant here to help with a routine check-in. I'm not a substitute for a clinician. Is it OK if I ask some health questions and store your answers to help with future visits? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no", "ask_about_privacy"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.AGENDA },
      { condition: "equals(input,'no')", next: State.EPHEMERAL_CONSENT },
      { condition: "equals(input,'ask_about_privacy')", next: State.PRIVACY_SUMMARY }
    ]
  },

  [State.PRIVACY_SUMMARY]: {
    id: State.PRIVACY_SUMMARY,
    prompt: "Your data is stored securely and only used to improve your care. You can request deletion at any time. Would you like to proceed?",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.AGENDA },
      { condition: "equals(input,'no')", next: State.EPHEMERAL_CONSENT }
    ]
  },

  [State.EPHEMERAL_CONSENT]: {
    id: State.EPHEMERAL_CONSENT,
    prompt: "No problem. I can still help, but I won't save anything after this session. Ready to continue?",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.AGENDA },
      { condition: "equals(input,'no')", next: State.END_NOSESSION }
    ]
  },

  [State.AGENDA]: {
    id: State.AGENDA,
    prompt: "What would you like to focus on today? (routine checkup, symptom, meds review, screenings…) — or describe.",
    inputType: "text",
    controller: "agendaController",
    transitions: [
      { condition: "match(input,/chest|pain|faint|breath|shortness/i)", next: State.ESCALATE },
      { condition: "always", next: State.DEMOGRAPHICS }
    ]
  },

  [State.DEMOGRAPHICS]: {
    id: State.DEMOGRAPHICS,
    prompt: "Please confirm your age (or year of birth) and sex assigned at birth. You may type 'prefer not to say'.",
    inputType: "structured",
    controller: "demographicsController",
    transitions: [
      { condition: "is_missing(input.age_or_birthyear)", next: State.DEMOGRAPHICS_ASKAGE },
      { condition: "always", next: State.MEDICAL_HISTORY }
    ]
  },

  [State.DEMOGRAPHICS_ASKAGE]: {
    id: State.DEMOGRAPHICS_ASKAGE,
    prompt: "I didn't catch your age. Could you please provide your age or year of birth?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.MEDICAL_HISTORY }]
  },

  [State.MEDICAL_HISTORY]: {
    id: State.MEDICAL_HISTORY,
    prompt: "Do you have any chronic conditions or past surgeries I should know about?",
    inputType: "text",
    transitions: [
      { condition: "has_conditions", next: State.MED_HISTORY_FOLLOWUP },
      { condition: "always", next: State.MEDICATIONS }
    ]
  },

  [State.MED_HISTORY_FOLLOWUP]: {
    id: State.MED_HISTORY_FOLLOWUP,
    prompt: "Can you tell me more about when these conditions were diagnosed and how they're being managed?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.MEDICATIONS }]
  },

  [State.MEDICATIONS]: {
    id: State.MEDICATIONS,
    prompt: "What medications are you currently taking, including any supplements or over-the-counter drugs?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.ALLERGIES }]
  },

  [State.ALLERGIES]: {
    id: State.ALLERGIES,
    prompt: "Do you have any known allergies to medications, foods, or other substances?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SOCIAL_HISTORY }]
  },

  [State.SOCIAL_HISTORY]: {
    id: State.SOCIAL_HISTORY,
    prompt: "A few lifestyle questions: Do you smoke, drink alcohol, or use any recreational substances? How would you describe your activity level?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SYSTEMS_REVIEW_INTRO }]
  },

  [State.SYSTEMS_REVIEW_INTRO]: {
    id: State.SYSTEMS_REVIEW_INTRO,
    prompt: "Now I'll ask about different body systems. This helps identify any areas that need attention.",
    inputType: "none",
    transitions: [{ condition: "always", next: State.SYSTEMS_CARDIO }]
  },

  [State.SYSTEMS_CARDIO]: {
    id: State.SYSTEMS_CARDIO,
    prompt: "Have you experienced any chest pain, palpitations, shortness of breath, or swelling in your legs?",
    inputType: "text",
    transitions: [
      { condition: "has_symptoms", next: State.SYSTEMS_CARDIO_FOLLOWUP },
      { condition: "always", next: State.SYSTEMS_RESP }
    ]
  },

  [State.SYSTEMS_CARDIO_FOLLOWUP]: {
    id: State.SYSTEMS_CARDIO_FOLLOWUP,
    prompt: "Can you describe these symptoms in more detail? When do they occur and how severe are they?",
    inputType: "text",
    transitions: [
      { condition: "is_urgent", next: State.ESCALATE },
      { condition: "always", next: State.SYSTEMS_RESP }
    ]
  },

  [State.SYSTEMS_RESP]: {
    id: State.SYSTEMS_RESP,
    prompt: "Any coughing, wheezing, or difficulty breathing?",
    inputType: "text",
    transitions: [
      { condition: "has_symptoms", next: State.SYSTEMS_RESP_FOLLOWUP },
      { condition: "always", next: State.SYSTEMS_GI }
    ]
  },

  [State.SYSTEMS_RESP_FOLLOWUP]: {
    id: State.SYSTEMS_RESP_FOLLOWUP,
    prompt: "How long have you had these respiratory symptoms? Is it getting worse?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SYSTEMS_GI }]
  },

  [State.SYSTEMS_GI]: {
    id: State.SYSTEMS_GI,
    prompt: "Any nausea, vomiting, abdominal pain, or changes in bowel habits?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SYSTEMS_NEURO }]
  },

  [State.SYSTEMS_NEURO]: {
    id: State.SYSTEMS_NEURO,
    prompt: "Any headaches, dizziness, numbness, or tingling sensations?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SYSTEMS_MSK }]
  },

  [State.SYSTEMS_MSK]: {
    id: State.SYSTEMS_MSK,
    prompt: "Any joint pain, muscle aches, or limitation in movement?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SYSTEMS_PSYCH }]
  },

  [State.SYSTEMS_PSYCH]: {
    id: State.SYSTEMS_PSYCH,
    prompt: "How has your mood been lately? Any concerns about stress, anxiety, or sleep?",
    inputType: "text",
    transitions: [
      { condition: "needs_phq2", next: State.PHQ2 },
      { condition: "always", next: State.PREVENTIVE_SCREENINGS }
    ]
  },

  [State.PHQ2]: {
    id: State.PHQ2,
    prompt: "Over the past 2 weeks, how often have you had little interest or pleasure in doing things? (not at all / several days / more than half the days / nearly every day)",
    inputType: "choice",
    choices: ["not at all", "several days", "more than half the days", "nearly every day"],
    transitions: [{ condition: "always", next: State.PHQ2_Q2 }]
  },

  [State.PHQ2_Q2]: {
    id: State.PHQ2_Q2,
    prompt: "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?",
    inputType: "choice",
    choices: ["not at all", "several days", "more than half the days", "nearly every day"],
    transitions: [{ condition: "always", next: State.PREVENTIVE_SCREENINGS }]
  },

  [State.PREVENTIVE_SCREENINGS]: {
    id: State.PREVENTIVE_SCREENINGS,
    prompt: "Let's review your preventive health. When was your last general checkup?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.PREVENTIVE_CHECKLIST }]
  },

  [State.PREVENTIVE_CHECKLIST]: {
    id: State.PREVENTIVE_CHECKLIST,
    prompt: "Have you had any of these recently: blood pressure check, cholesterol test, diabetes screening, cancer screenings appropriate for your age?",
    inputType: "text",
    transitions: [
      { condition: "needs_lipids", next: State.PREVENTIVE_LIPIDS },
      { condition: "needs_diabetes", next: State.PREVENTIVE_DIABETES },
      { condition: "always", next: State.VACCINATIONS }
    ]
  },

  [State.PREVENTIVE_LIPIDS]: {
    id: State.PREVENTIVE_LIPIDS,
    prompt: "A lipid panel checks your cholesterol levels. When was your last one?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.PREVENTIVE_DIABETES }]
  },

  [State.PREVENTIVE_DIABETES]: {
    id: State.PREVENTIVE_DIABETES,
    prompt: "Have you ever had your blood sugar or HbA1c tested? Any family history of diabetes?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.VACCINATIONS }]
  },

  [State.VACCINATIONS]: {
    id: State.VACCINATIONS,
    prompt: "Are your vaccinations up to date? This includes flu, COVID, tetanus, and any others recommended for your age group.",
    inputType: "text",
    transitions: [{ condition: "always", next: State.SUMMARY_PLAN }]
  },

  [State.SUMMARY_PLAN]: {
    id: State.SUMMARY_PLAN,
    prompt: "Thank you for all that information. Let me summarize what we discussed and suggest some next steps.",
    inputType: "none",
    transitions: [{ condition: "always", next: State.SAVING_AND_REMINDERS }]
  },

  [State.SAVING_AND_REMINDERS]: {
    id: State.SAVING_AND_REMINDERS,
    prompt: "Would you like me to save this summary and set any reminders for follow-up appointments or screenings?",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.SAVING },
      { condition: "equals(input,'no')", next: State.END_OK }
    ]
  },

  [State.SAVING]: {
    id: State.SAVING,
    prompt: "I've saved your health summary. You can access it anytime. Is there anything else I can help with?",
    inputType: "text",
    transitions: [{ condition: "always", next: State.END_OK }]
  },

  [State.ESCALATE]: {
    id: State.ESCALATE,
    prompt: "Based on what you've described, I recommend speaking with a healthcare provider soon. This could be urgent.",
    inputType: "none",
    transitions: [{ condition: "always", next: State.ESCALATE_SUMMARY }]
  },

  [State.ESCALATE_SUMMARY]: {
    id: State.ESCALATE_SUMMARY,
    prompt: "I'm preparing a summary of your symptoms to share with the clinical team. Please seek care promptly.",
    inputType: "none",
    transitions: [{ condition: "always", next: State.END_ESCALATED }]
  },

  [State.END_OK]: {
    id: State.END_OK,
    prompt: "Take care! Remember to follow up on any recommended screenings. Goodbye!",
    inputType: "none",
    transitions: []
  },

  [State.END_ESCALATED]: {
    id: State.END_ESCALATED,
    prompt: "Please contact your healthcare provider or visit urgent care. Take care and stay safe.",
    inputType: "none",
    transitions: []
  },

  [State.END_EPHEMERAL]: {
    id: State.END_EPHEMERAL,
    prompt: "Session complete. No data was saved. Take care!",
    inputType: "none",
    transitions: []
  },

  [State.END_NOSESSION]: {
    id: State.END_NOSESSION,
    prompt: "No problem. Feel free to return whenever you're ready. Goodbye!",
    inputType: "none",
    transitions: []
  },

  [State.END]: {
    id: State.END,
    prompt: "SESSION CLOSED",
    inputType: "none",
    transitions: []
  }
};
