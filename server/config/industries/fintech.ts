import type { IndustryTemplate } from "../agent-config-schema";

export const fintechTemplate: IndustryTemplate = {
  industryId: "fintech",
  industryName: "Financial Technology (Fintech)",
  description: "Financial services, banking, payments, investing, and insurance technology platforms",
  
  specificKnowledge: [
    {
      id: "fintech_trust_signals",
      title: "Trust Signals in Financial Services",
      type: "principle",
      content: "Financial websites must prominently display trust indicators: regulatory compliance badges (SEC, FINRA, FCA), security certifications (SOC 2, PCI DSS), FDIC/SIPC insurance notices, and encryption indicators. Users need constant reassurance when dealing with money.",
      applicability: ["visual_design", "content", "technical"],
      weight: 0.95
    },
    {
      id: "fintech_simplicity",
      title: "Financial Complexity Simplified",
      type: "principle",
      content: "The best fintech UX transforms complex financial concepts into simple, actionable interfaces. Progressive disclosure hides complexity until needed. Avoid jargon; translate APY, basis points, and financial terms into plain language.",
      applicability: ["ux", "content"],
      weight: 0.9
    },
    {
      id: "fintech_data_viz",
      title: "Financial Data Visualization Standards",
      type: "best_practice",
      content: "Charts should follow conventions: green for gains/positive, red for losses/negative. Use consistent scales. Show context (benchmarks, time periods). Include accessibility alternatives for colorblind users (patterns, labels).",
      applicability: ["visual_design", "technical"],
      weight: 0.85
    },
    {
      id: "fintech_security_ux",
      title: "Security Without Friction",
      type: "best_practice",
      content: "Multi-factor authentication is expected but should feel seamless. Biometric options, magic links, and passwordless auth reduce friction while maintaining security. Session timeouts should balance security with user convenience.",
      applicability: ["ux", "technical"],
      weight: 0.88
    },
    {
      id: "fintech_regulatory_content",
      title: "Regulatory Content Requirements",
      type: "standard",
      content: "Required disclosures must be accessible but shouldn't dominate UX. Risk warnings, fee disclosures, and legal notices should be clear but not alarmist. APR/APY calculations must be accurate and prominent for lending/savings products.",
      applicability: ["content", "ux"],
      weight: 0.92
    },
    {
      id: "fintech_mobile_first",
      title: "Mobile-First Financial Services",
      type: "best_practice",
      content: "Mobile banking has surpassed desktop. Quick actions (check balance, transfer, pay) should be prominent. Face/fingerprint authentication for fast access. Offline functionality for viewing account info.",
      applicability: ["ux", "technical"],
      weight: 0.87
    }
  ],

  scoringAdjustments: {
    trust_signals: 1.2,
    security_indicators: 1.3,
    data_visualization: 1.15,
    accessibility: 1.1,
    mobile_responsiveness: 1.2,
    page_speed: 1.25,
    regulatory_compliance: 1.3
  },

  priorityAreas: [
    "Trust and security visualization",
    "Data accuracy and clarity",
    "Mobile experience optimization",
    "Regulatory compliance visibility",
    "Transaction flow simplicity"
  ],

  commonPatterns: [
    {
      pattern: "Dashboard with account overview prominently displayed",
      frequency: "common",
      recommendation: "Include quick-glance balance, recent transactions, and action shortcuts"
    },
    {
      pattern: "Multi-step onboarding with KYC verification",
      frequency: "common",
      recommendation: "Show progress indicators, allow save-and-resume, minimize required fields per step"
    },
    {
      pattern: "Real-time balance and transaction updates",
      frequency: "common",
      recommendation: "Use optimistic UI updates with confirmation, show last-updated timestamp"
    },
    {
      pattern: "Fee transparency before confirmation",
      frequency: "common",
      recommendation: "Show all fees clearly before final action, include total cost breakdown"
    },
    {
      pattern: "Two-factor authentication for sensitive actions",
      frequency: "common",
      recommendation: "Implement step-up authentication only when needed, offer biometric options"
    }
  ],

  benchmarks: {
    average_trust_score: 7.5,
    average_ux_score: 7.0,
    average_mobile_score: 7.8,
    average_load_time_seconds: 2.5,
    average_accessibility_score: 6.8
  }
};
