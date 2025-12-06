import type { IndustryTemplate } from "../agent-config-schema";

export const ecommerceTemplate: IndustryTemplate = {
  industryId: "ecommerce",
  industryName: "E-Commerce & Retail",
  description: "Online retail, marketplaces, D2C brands, and digital storefronts",
  
  specificKnowledge: [
    {
      id: "ecom_conversion_optimization",
      title: "Conversion Rate Optimization Fundamentals",
      type: "principle",
      content: "Every element should move users toward purchase. Reduce clicks to checkout. Prominent CTAs ('Add to Cart', 'Buy Now'). Minimize distractions on product pages. A/B testing is essential for continuous improvement.",
      applicability: ["ux", "visual_design"],
      weight: 0.95
    },
    {
      id: "ecom_product_photography",
      title: "Product Imagery Standards",
      type: "best_practice",
      content: "High-quality, zoomable product images from multiple angles. Lifestyle shots showing products in use. Consistent backgrounds and lighting. 360° views and video increase conversions. Alt text for SEO and accessibility.",
      applicability: ["visual_design", "technical"],
      weight: 0.9
    },
    {
      id: "ecom_social_proof",
      title: "Social Proof Integration",
      type: "principle",
      content: "Reviews and ratings near buy buttons increase conversions 15-20%. Show review counts, average ratings, verified purchase badges. User-generated content (photos) builds trust. Display 'X people bought this' or stock levels for urgency.",
      applicability: ["content", "ux"],
      weight: 0.88
    },
    {
      id: "ecom_cart_abandonment",
      title: "Cart Abandonment Prevention",
      type: "best_practice",
      content: "Guest checkout option is essential. Show total cost early (no surprise fees). Progress indicators in checkout. Save cart across sessions. Trust badges near payment. Multiple payment options including digital wallets.",
      applicability: ["ux", "technical"],
      weight: 0.92
    },
    {
      id: "ecom_search_filter",
      title: "Product Discovery Excellence",
      type: "best_practice",
      content: "Robust search with autocomplete and typo tolerance. Faceted navigation for filtering. Sort by relevance, price, rating, newest. Visual filters (color swatches). Remember user preferences.",
      applicability: ["ux", "technical"],
      weight: 0.85
    },
    {
      id: "ecom_mobile_commerce",
      title: "Mobile Commerce Optimization",
      type: "standard",
      content: "Mobile drives 70%+ of e-commerce traffic. Thumb-friendly tap targets. Sticky add-to-cart buttons. Simplified mobile checkout with autofill. Apple Pay/Google Pay integration for one-tap purchase.",
      applicability: ["ux", "technical"],
      weight: 0.93
    },
    {
      id: "ecom_page_speed",
      title: "Speed as Conversion Factor",
      type: "principle",
      content: "Each second of delay reduces conversions 7%. Image optimization is critical. Lazy loading for product grids. Prefetch checkout pages. Core Web Vitals directly impact both SEO and sales.",
      applicability: ["technical"],
      weight: 0.9
    }
  ],

  scoringAdjustments: {
    product_imagery: 1.3,
    cta_visibility: 1.25,
    checkout_flow: 1.35,
    mobile_experience: 1.3,
    page_speed: 1.4,
    search_functionality: 1.2,
    social_proof: 1.15
  },

  priorityAreas: [
    "Product page conversion optimization",
    "Checkout flow simplification",
    "Mobile shopping experience",
    "Product imagery quality",
    "Search and navigation efficiency"
  ],

  commonPatterns: [
    {
      pattern: "Product grid with hover effects showing quick actions",
      frequency: "common",
      recommendation: "Include quick-view, wishlist, and add-to-cart on hover. Maintain clean grid on mobile."
    },
    {
      pattern: "Mega menu navigation for categories",
      frequency: "common",
      recommendation: "Group logically, include featured products/promotions, ensure mobile-friendly alternative"
    },
    {
      pattern: "Persistent cart icon with item count",
      frequency: "common",
      recommendation: "Show item count badge, animate on add, mini-cart preview on hover/click"
    },
    {
      pattern: "Size/color variant selectors on product pages",
      frequency: "common",
      recommendation: "Visual swatches for colors, clear availability indicators, update images on selection"
    },
    {
      pattern: "Related/recommended products section",
      frequency: "common",
      recommendation: "Show 4-6 items, use AI recommendations if possible, include 'frequently bought together'"
    },
    {
      pattern: "Promotional banners and sale indicators",
      frequency: "common",
      recommendation: "Show original vs sale price, percentage saved. Countdown timers for limited offers."
    }
  ],

  benchmarks: {
    average_conversion_rate: 2.5,
    average_cart_abandonment: 70,
    average_load_time_seconds: 2.8,
    average_mobile_score: 7.2,
    average_checkout_steps: 4
  }
};
