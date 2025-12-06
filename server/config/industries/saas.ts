import type { IndustryTemplate } from "../agent-config-schema";

export const saasTemplate: IndustryTemplate = {
  industryId: "saas",
  industryName: "Software as a Service (SaaS)",
  description: "B2B and B2C software products, platforms, and cloud services",
  
  specificKnowledge: [
    {
      id: "saas_value_proposition",
      title: "Clear Value Proposition Above the Fold",
      type: "principle",
      content: "SaaS homepages must communicate the core benefit in under 5 seconds. Hero section needs: headline stating the outcome (not feature), subheadline with supporting detail, single primary CTA, and social proof or demo visual.",
      applicability: ["content", "visual_design", "ux"],
      weight: 0.95
    },
    {
      id: "saas_pricing_transparency",
      title: "Pricing Page Best Practices",
      type: "best_practice",
      content: "Pricing should be easy to find and understand. Comparison tables for tiers work well. Highlight recommended plan. Show annual vs monthly savings. Include feature lists. FAQ section for common objections. Enterprise 'Contact Us' option.",
      applicability: ["ux", "content"],
      weight: 0.9
    },
    {
      id: "saas_onboarding_flow",
      title: "Product-Led Onboarding",
      type: "principle",
      content: "Free trials and freemium models require excellent onboarding. Progressive disclosure of features. Time-to-value is critical—get users to 'aha moment' fast. Checklists, tooltips, and empty states guide users.",
      applicability: ["ux"],
      weight: 0.92
    },
    {
      id: "saas_social_proof",
      title: "B2B Social Proof Standards",
      type: "best_practice",
      content: "Logo bars of recognizable customers. Case studies with metrics ('increased productivity 40%'). G2/Capterra badges and ratings. Customer testimonials with photos, names, titles. Industry awards and certifications.",
      applicability: ["content", "visual_design"],
      weight: 0.88
    },
    {
      id: "saas_demo_cta",
      title: "Demo and Trial Optimization",
      type: "best_practice",
      content: "Multiple pathways: self-service trial, interactive demo, scheduled call. Reduce signup friction (social login, minimal fields). Product tours for complex products. Video demos for quick overview.",
      applicability: ["ux", "content"],
      weight: 0.87
    },
    {
      id: "saas_feature_communication",
      title: "Feature-Benefit Translation",
      type: "principle",
      content: "Features mean nothing without benefits. 'AI-powered analytics' → 'Make smarter decisions in half the time'. Use icons with short descriptions. Interactive demos > screenshots > static images.",
      applicability: ["content", "visual_design"],
      weight: 0.85
    },
    {
      id: "saas_integration_showcase",
      title: "Integration Ecosystem Display",
      type: "best_practice",
      content: "Show integrations with tools users already use (Slack, Salesforce, etc.). Integration logos build credibility and answer 'Will it work with my stack?' Filter by category for large ecosystems.",
      applicability: ["content", "ux"],
      weight: 0.82
    }
  ],

  scoringAdjustments: {
    value_proposition_clarity: 1.35,
    cta_effectiveness: 1.3,
    pricing_transparency: 1.25,
    social_proof: 1.2,
    demo_accessibility: 1.2,
    documentation_quality: 1.15,
    mobile_experience: 1.1
  },

  priorityAreas: [
    "Hero section value proposition",
    "CTA visibility and clarity",
    "Pricing page usability",
    "Social proof placement",
    "Demo/trial conversion flow"
  ],

  commonPatterns: [
    {
      pattern: "Hero with headline, subheadline, CTA, and product screenshot",
      frequency: "common",
      recommendation: "Show product in action, not abstract graphics. Include social proof element."
    },
    {
      pattern: "Logo bar of customer companies",
      frequency: "common",
      recommendation: "5-7 recognizable logos, grayscale for sophistication, above the fold or just below hero"
    },
    {
      pattern: "Three-column pricing comparison",
      frequency: "common",
      recommendation: "Highlight middle tier as 'popular', show annual savings, clear feature differentiation"
    },
    {
      pattern: "Feature sections alternating image left/right",
      frequency: "common",
      recommendation: "Keep to 3-5 key features, benefit-focused headlines, supporting screenshots or animations"
    },
    {
      pattern: "Testimonial cards or carousel",
      frequency: "common",
      recommendation: "Include photo, name, title, company. Quote should mention specific benefit or result."
    },
    {
      pattern: "FAQ accordion section",
      frequency: "common",
      recommendation: "Address top objections, pricing questions, integration concerns. Keep answers concise."
    }
  ],

  benchmarks: {
    average_trial_conversion: 15,
    average_demo_booking_rate: 8,
    average_bounce_rate: 45,
    average_time_on_page_seconds: 120,
    average_cta_click_rate: 3.5
  }
};
