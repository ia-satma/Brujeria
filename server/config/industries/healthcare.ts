import type { IndustryTemplate } from "../agent-config-schema";

export const healthcareTemplate: IndustryTemplate = {
  industryId: "healthcare",
  industryName: "Healthcare & Medical",
  description: "Healthcare providers, medical practices, telehealth, health tech, and wellness platforms",
  
  specificKnowledge: [
    {
      id: "healthcare_trust_credibility",
      title: "Medical Credibility Signals",
      type: "principle",
      content: "Healthcare requires highest trust levels. Display credentials prominently (MD, board certifications). Hospital affiliations matter. Awards and recognitions. HIPAA compliance badges. Accreditations (Joint Commission, AAAHC).",
      applicability: ["content", "visual_design"],
      weight: 0.95
    },
    {
      id: "healthcare_accessibility",
      title: "Accessibility as Priority",
      type: "standard",
      content: "Healthcare serves diverse populations including elderly and disabled. WCAG AAA is ideal. Large text options. High contrast. Screen reader optimization. Voice navigation for telehealth. Translations for multilingual communities.",
      applicability: ["technical", "ux", "visual_design"],
      weight: 0.93
    },
    {
      id: "healthcare_patient_experience",
      title: "Patient-Centered Digital Experience",
      type: "principle",
      content: "Patients are often anxious or in pain. Calm, reassuring design. Easy appointment scheduling. Clear next steps. Symptom checkers should guide, not diagnose. Emergency resources always visible.",
      applicability: ["ux", "visual_design", "content"],
      weight: 0.92
    },
    {
      id: "healthcare_privacy",
      title: "Privacy and Data Protection",
      type: "standard",
      content: "HIPAA compliance is non-negotiable. Clear privacy policies. Secure patient portals. Two-factor authentication for health data. Explicit consent for data use. No health data in URLs or analytics.",
      applicability: ["technical", "content"],
      weight: 0.95
    },
    {
      id: "healthcare_findability",
      title: "Location and Provider Search",
      type: "best_practice",
      content: "Find a doctor/location features are critical. Filter by specialty, insurance, location, availability. Provider profiles with photos, credentials, languages spoken. Real-time scheduling integration.",
      applicability: ["ux", "technical"],
      weight: 0.88
    },
    {
      id: "healthcare_education",
      title: "Health Education Content",
      type: "best_practice",
      content: "Educational content builds trust and SEO. Avoid medical jargon. Include sources and last-reviewed dates. Disclaimer that content doesn't replace professional advice. Condition pages should link to relevant providers.",
      applicability: ["content"],
      weight: 0.85
    },
    {
      id: "healthcare_mobile_telehealth",
      title: "Mobile and Telehealth Optimization",
      type: "best_practice",
      content: "Mobile booking is essential. Telehealth platforms need camera/mic access guidance. Virtual waiting rooms with estimated wait times. Post-visit summaries accessible on mobile. Prescription and referral tracking.",
      applicability: ["ux", "technical"],
      weight: 0.87
    }
  ],

  scoringAdjustments: {
    accessibility: 1.4,
    trust_signals: 1.35,
    privacy_compliance: 1.4,
    appointment_booking: 1.25,
    mobile_experience: 1.2,
    content_accuracy: 1.3,
    emergency_visibility: 1.25
  },

  priorityAreas: [
    "Accessibility compliance",
    "Trust and credential display",
    "Appointment scheduling ease",
    "Privacy and security visibility",
    "Provider findability"
  ],

  commonPatterns: [
    {
      pattern: "Find a Doctor search with filters",
      frequency: "common",
      recommendation: "Include specialty, location, insurance, gender preferences. Show availability status."
    },
    {
      pattern: "Provider profile pages with credentials",
      frequency: "common",
      recommendation: "Professional photo, full credentials, specialties, languages, patient reviews, direct scheduling"
    },
    {
      pattern: "Online appointment scheduling widget",
      frequency: "common",
      recommendation: "Real-time availability, new vs existing patient flows, appointment type selection, confirmation emails/SMS"
    },
    {
      pattern: "Patient portal login prominently placed",
      frequency: "common",
      recommendation: "Secure login area, password recovery, first-time registration clearly marked"
    },
    {
      pattern: "Condition/treatment information pages",
      frequency: "common",
      recommendation: "Reviewed-by credentials, last updated date, related providers and services, clear disclaimer"
    },
    {
      pattern: "Emergency contact or urgent care finder",
      frequency: "common",
      recommendation: "Always visible, never hidden in menus. Clear distinction between emergency and urgent care."
    }
  ],

  benchmarks: {
    average_accessibility_score: 7.0,
    average_mobile_score: 7.5,
    average_load_time_seconds: 3.0,
    average_booking_completion: 65,
    average_trust_score: 7.8
  }
};
