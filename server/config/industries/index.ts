import { fintechTemplate } from "./fintech";
import { ecommerceTemplate } from "./ecommerce";
import { saasTemplate } from "./saas";
import { healthcareTemplate } from "./healthcare";
import type { IndustryTemplate } from "../agent-config-schema";

export const industryTemplates: IndustryTemplate[] = [
  fintechTemplate,
  ecommerceTemplate,
  saasTemplate,
  healthcareTemplate,
];

export const industryTemplateMap: Record<string, IndustryTemplate> = {
  fintech: fintechTemplate,
  ecommerce: ecommerceTemplate,
  saas: saasTemplate,
  healthcare: healthcareTemplate,
};

export {
  fintechTemplate,
  ecommerceTemplate,
  saasTemplate,
  healthcareTemplate,
};
