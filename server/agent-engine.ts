import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface SiteContent {
  url: string;
  title: string;
  html: string;
  text: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  links: string[];
  images: number;
  hasViewportMeta: boolean;
  hasMediaQueries: boolean;
  schemaOrg: boolean;
}

export interface SubAgentResult {
  name: string;
  finding: string;
  score: number;
  details: string[];
}

export interface AnalysisSection {
  observations: string;
  strengths: string[];
  weaknesses: string[];
  score: number;
  subagent_results: SubAgentResult[];
}

export interface SiteAnalysis {
  name: string;
  url: string;
  visual_design: AnalysisSection;
  user_experience: AnalysisSection;
  content_quality: AnalysisSection;
  technical_performance: AnalysisSection;
  overall_score: number;
}

export type LogCallback = (message: string) => void;

// ============================================================================
// SCRAPING ORCHESTRATOR
// ============================================================================

async function runDataExtractor(url: string, log?: LogCallback): Promise<{ html: string; text: string }> {
  log?.(`[Scraping_Orchestrator] > [Data_Extractor] Fetching raw DOM from ${url}...`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WebBenchmarkBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const html = await response.text();
  
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000);

  log?.(`[Scraping_Orchestrator] > [Data_Extractor] Extracted ${text.length} chars of clean text`);
  
  return { html, text };
}

async function runMetadataFetcher(html: string, url: string, log?: LogCallback): Promise<Omit<SiteContent, 'html' | 'text' | 'url'>> {
  log?.(`[Scraping_Orchestrator] > [Metadata_Fetcher] Extracting meta tags & headers...`);
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'No title';
  
  const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;
  
  const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h1Tags = Array.from(h1Matches).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 5);
  
  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h2Tags = Array.from(h2Matches).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 10);
  
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["']/gi);
  const links = Array.from(linkMatches).map(m => m[1]).filter(l => l.startsWith('/') || l.startsWith('http')).slice(0, 20);
  
  const imageMatches = html.matchAll(/<img[^>]*>/gi);
  const images = Array.from(imageMatches).length;
  
  const hasViewportMeta = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasMediaQueries = /@media/i.test(html);
  const schemaOrg = /schema\.org/i.test(html) || /"@type"/i.test(html);

  log?.(`[Scraping_Orchestrator] > [Metadata_Fetcher] Title: "${title}"`);
  log?.(`[Scraping_Orchestrator] > [Metadata_Fetcher] H1 Tags: ${h1Tags.length}, H2 Tags: ${h2Tags.length}`);
  log?.(`[Scraping_Orchestrator] > [Metadata_Fetcher] Links: ${links.length}, Images: ${images}`);
  log?.(`[Scraping_Orchestrator] > [Metadata_Fetcher] Viewport: ${hasViewportMeta}, MediaQueries: ${hasMediaQueries}, Schema.org: ${schemaOrg}`);

  return {
    title,
    metaDescription,
    h1Tags,
    h2Tags,
    links,
    images,
    hasViewportMeta,
    hasMediaQueries,
    schemaOrg,
  };
}

export async function fetchSiteContent(url: string, log?: LogCallback): Promise<SiteContent> {
  log?.(`[Scraping_Orchestrator] Targeted: ${url}`);
  
  const { html, text } = await runDataExtractor(url, log);
  const metadata = await runMetadataFetcher(html, url, log);
  
  log?.(`[Scraping_Orchestrator] Context acquisition complete.`);
  
  return {
    url,
    html,
    text,
    ...metadata,
  };
}

// ============================================================================
// SUBAGENT PROMPTS - VISUAL AESTHETICS AGENT (VAA)
// ============================================================================

const COLOR_PALETTE_ANALYZER_PROMPT = `You are COLOR_PALETTE_ANALYZER, a hyperspecialized AI focused ONLY on color analysis.

Analyze the website's color scheme based on the HTML/CSS content provided.

Evaluate:
- Primary, secondary, and accent colors used
- Color contrast ratios (accessibility)
- Brand color consistency throughout the site
- Emotional tone conveyed by the palette (corporate, playful, luxury, etc.)

Be critical: most sites score 5-7. Only exceptional color work gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about the color palette",
  "score": 7,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const TYPO_READABILITY_CHECKER_PROMPT = `You are TYPO_READABILITY_CHECKER, a hyperspecialized AI focused ONLY on typography analysis.

Analyze the website's typography based on the HTML content provided.

Evaluate:
- Font families used (serif, sans-serif, display)
- Heading hierarchy (H1-H6 proper usage)
- Text readability (line height, spacing, contrast)
- Typography consistency and professionalism

Be critical: most sites score 5-7. Only exceptional typography gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about typography",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const DESIGN_TREND_EVALUATOR_PROMPT = `You are DESIGN_TREND_EVALUATOR, a hyperspecialized AI focused ONLY on design modernity and trends.

Analyze the website's visual design trends based on the content provided.

Evaluate:
- Design modernity (current vs outdated patterns)
- Use of whitespace and visual balance
- Image quality and relevance (inferred from alt tags, image count)
- Overall aesthetic quality and professionalism
- Alignment with current web design best practices

Be critical: most sites score 5-7. Only truly modern designs get 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about design trends",
  "score": 7,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

// ============================================================================
// SUBAGENT PROMPTS - UX NAVIGATION AGENT (UNA)
// ============================================================================

const INFORMATION_ARCHITECTURE_MAPPER_PROMPT = `You are INFORMATION_ARCHITECTURE_MAPPER, a hyperspecialized AI focused ONLY on site structure analysis.

Analyze the website's information architecture based on the navigation and links provided.

Evaluate:
- Menu structure and organization
- Navigation depth (how many clicks to reach content)
- Content categorization logic
- Sitemap clarity and discoverability

Be critical: most sites score 5-7. Only exceptional IA gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about information architecture",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const CTA_EFFECTIVENESS_SCORER_PROMPT = `You are CTA_EFFECTIVENESS_SCORER, a hyperspecialized AI focused ONLY on call-to-action analysis.

Analyze the website's CTAs based on the content provided.

Evaluate:
- CTA visibility and prominence
- CTA clarity and persuasiveness
- Strategic placement of CTAs
- Alignment with business objectives
- Button/link design effectiveness

Be critical: most sites score 5-7. Only exceptional CTA strategy gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about CTA effectiveness",
  "score": 5,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const RESPONSIVE_DESIGN_INFERRER_PROMPT = `You are RESPONSIVE_DESIGN_INFERRER, a hyperspecialized AI focused ONLY on mobile optimization analysis.

Analyze the website's responsive design based on the HTML structure provided.

Evaluate:
- Viewport meta tag presence and configuration
- Media query usage (inferred from CSS patterns)
- Mobile-friendly navigation patterns
- Touch-friendly element sizing
- Responsive image handling

Be critical: most sites score 5-7. Only truly mobile-optimized sites get 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about responsive design",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

// ============================================================================
// SUBAGENT PROMPTS - CONTENT STORYTELLING AGENT (CSA)
// ============================================================================

const BRAND_VOICE_VALIDATOR_PROMPT = `You are BRAND_VOICE_VALIDATOR, a hyperspecialized AI focused ONLY on brand voice and messaging analysis.

Analyze the website's brand voice based on the content provided.

Evaluate:
- Tone consistency (formal, casual, professional, innovative)
- Value proposition clarity
- Messaging coherence across sections
- Brand personality expression
- Emotional connection with target audience

Be critical: most sites score 5-7. Only exceptional brand voice gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about brand voice",
  "score": 7,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const THOUGHT_LEADERSHIP_SCRUTINIZER_PROMPT = `You are THOUGHT_LEADERSHIP_SCRUTINIZER, a hyperspecialized AI focused ONLY on thought leadership content analysis.

Analyze the website's thought leadership signals based on the content provided.

Evaluate:
- Quality and depth of insights/publications
- Expertise demonstration
- Industry authority signals
- Content relevance to target audience (C-Suite, professionals)
- Unique perspectives and original thinking

Be critical: most sites score 5-7. Only true thought leaders get 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about thought leadership",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const CREDIBILITY_EVIDENCE_COLLECTOR_PROMPT = `You are CREDIBILITY_EVIDENCE_COLLECTOR, a hyperspecialized AI focused ONLY on trust signals and social proof.

Analyze the website's credibility signals based on the content provided.

Evaluate:
- Social proof (testimonials, case studies, client logos)
- Awards and recognitions displayed
- Industry rankings and certifications
- Professional credentials
- Trust-building elements (guarantees, policies)

Be critical: most sites score 5-7. Only excellent credibility display gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about credibility evidence",
  "score": 7,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

// ============================================================================
// SUBAGENT PROMPTS - TECHNICAL PERFORMANCE AGENT (TPA)
// ============================================================================

const PAGE_SPEED_SCORER_PROMPT = `You are PAGE_SPEED_SCORER, a hyperspecialized AI focused ONLY on performance analysis.

Analyze the website's performance signals based on the HTML structure provided.

Evaluate:
- Resource loading patterns (lazy loading, defer, async)
- Image optimization signals
- Script and stylesheet management
- Critical rendering path optimization
- Perceived performance factors

Be critical: most sites score 5-7. Only highly optimized sites get 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about page speed",
  "score": 5,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const SEO_METADATA_INSPECTOR_PROMPT = `You are SEO_METADATA_INSPECTOR, a hyperspecialized AI focused ONLY on SEO metadata analysis.

Analyze the website's SEO signals based on the metadata provided.

Evaluate:
- Title tag optimization (length, keywords, uniqueness)
- Meta description quality and persuasiveness
- Heading hierarchy (H1-H6) proper usage
- Schema.org implementation
- URL structure and friendliness

Be critical: most sites score 5-7. Only excellent SEO gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about SEO metadata",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

const CONTENT_MARKUP_VALIDATOR_PROMPT = `You are CONTENT_MARKUP_VALIDATOR, a hyperspecialized AI focused ONLY on HTML structure and semantic markup.

Analyze the website's markup quality based on the HTML structure provided.

Evaluate:
- Semantic HTML usage (article, section, nav, header, footer)
- Accessibility attributes (alt tags, ARIA labels)
- Heading hierarchy correctness
- Structured data implementation
- Clean and maintainable markup

Be critical: most sites score 5-7. Only excellent markup gets 8+.

Return ONLY valid JSON:
{
  "finding": "One sentence primary finding about content markup",
  "score": 6,
  "details": ["Specific detail 1", "Specific detail 2", "Specific detail 3"]
}`;

// ============================================================================
// SUBAGENT EXECUTION
// ============================================================================

async function runSubagent(
  name: string,
  prompt: string,
  context: string,
  log?: LogCallback
): Promise<SubAgentResult> {
  log?.(`    > [${name}] Analyzing...`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: context }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    log?.(`    > [${name}] Score: ${result.score}/10 - ${result.finding}`);
    
    return {
      name,
      finding: result.finding || 'Analysis complete',
      score: result.score || 5,
      details: result.details || [],
    };
  } catch (error) {
    log?.(`    > [${name}] ERROR: ${error}`);
    return {
      name,
      finding: 'Analysis failed',
      score: 5,
      details: ['Error during analysis'],
    };
  }
}

function buildContext(content: SiteContent): string {
  return `
Website: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription || 'None'}

H1 Tags: ${content.h1Tags.join(' | ') || 'None'}
H2 Tags: ${content.h2Tags.join(' | ') || 'None'}

Navigation Links (sample): ${content.links.slice(0, 10).join(', ')}
Total Images: ${content.images}

Technical Signals:
- Viewport Meta: ${content.hasViewportMeta ? 'Yes' : 'No'}
- Media Queries Detected: ${content.hasMediaQueries ? 'Yes' : 'No'}
- Schema.org: ${content.schemaOrg ? 'Yes' : 'No'}

HTML Preview (first 2500 chars):
${content.html.slice(0, 2500)}

Text Content Preview (first 2500 chars):
${content.text.slice(0, 2500)}
`;
}

function aggregateSubagentResults(results: SubAgentResult[]): { observations: string; strengths: string[]; weaknesses: string[]; score: number } {
  const avgScore = Math.round((results.reduce((sum, r) => sum + r.score, 0) / results.length) * 10) / 10;
  
  const observations = results.map(r => r.finding).join(' ');
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  for (const r of results) {
    if (r.score >= 7) {
      strengths.push(...r.details.slice(0, 2));
    } else if (r.score <= 5) {
      weaknesses.push(...r.details.slice(0, 2));
    } else {
      strengths.push(r.details[0] || r.finding);
    }
  }
  
  return {
    observations,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    score: avgScore,
  };
}

// ============================================================================
// AGENT EXECUTION - Visual Aesthetics Agent (VAA)
// ============================================================================

async function runVisualAestheticsAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Visual_Aesthetics_Agent] Starting analysis...`);
  
  const context = buildContext(content);
  
  const [colorResult, typoResult, trendResult] = await Promise.all([
    runSubagent('Color_Palette_Analyzer', COLOR_PALETTE_ANALYZER_PROMPT, context, log),
    runSubagent('Typo_Readability_Checker', TYPO_READABILITY_CHECKER_PROMPT, context, log),
    runSubagent('Design_Trend_Evaluator', DESIGN_TREND_EVALUATOR_PROMPT, context, log),
  ]);

  const aggregated = aggregateSubagentResults([colorResult, typoResult, trendResult]);
  
  log?.(`[Visual_Aesthetics_Agent] COMPLETED - Score: ${aggregated.score}/10`);
  
  return {
    ...aggregated,
    subagent_results: [colorResult, typoResult, trendResult],
  };
}

// ============================================================================
// AGENT EXECUTION - UX Navigation Agent (UNA)
// ============================================================================

async function runUXNavigationAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[UX_Navigation_Agent] Starting analysis...`);
  
  const context = buildContext(content);
  
  const [iaResult, ctaResult, responsiveResult] = await Promise.all([
    runSubagent('Information_Architecture_Mapper', INFORMATION_ARCHITECTURE_MAPPER_PROMPT, context, log),
    runSubagent('CTA_Effectiveness_Scorer', CTA_EFFECTIVENESS_SCORER_PROMPT, context, log),
    runSubagent('Responsive_Design_Inferrer', RESPONSIVE_DESIGN_INFERRER_PROMPT, context, log),
  ]);

  const aggregated = aggregateSubagentResults([iaResult, ctaResult, responsiveResult]);
  
  log?.(`[UX_Navigation_Agent] COMPLETED - Score: ${aggregated.score}/10`);
  
  return {
    ...aggregated,
    subagent_results: [iaResult, ctaResult, responsiveResult],
  };
}

// ============================================================================
// AGENT EXECUTION - Content Storytelling Agent (CSA)
// ============================================================================

async function runContentStorytellingAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Content_Storytelling_Agent] Starting analysis...`);
  
  const context = buildContext(content);
  
  const [voiceResult, thoughtResult, credibilityResult] = await Promise.all([
    runSubagent('Brand_Voice_Validator', BRAND_VOICE_VALIDATOR_PROMPT, context, log),
    runSubagent('Thought_Leadership_Scrutinizer', THOUGHT_LEADERSHIP_SCRUTINIZER_PROMPT, context, log),
    runSubagent('Credibility_Evidence_Collector', CREDIBILITY_EVIDENCE_COLLECTOR_PROMPT, context, log),
  ]);

  const aggregated = aggregateSubagentResults([voiceResult, thoughtResult, credibilityResult]);
  
  log?.(`[Content_Storytelling_Agent] COMPLETED - Score: ${aggregated.score}/10`);
  
  return {
    ...aggregated,
    subagent_results: [voiceResult, thoughtResult, credibilityResult],
  };
}

// ============================================================================
// AGENT EXECUTION - Technical Performance Agent (TPA)
// ============================================================================

async function runTechnicalPerformanceAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Technical_Performance_Agent] Starting analysis...`);
  
  const context = buildContext(content);
  
  const [speedResult, seoResult, markupResult] = await Promise.all([
    runSubagent('Page_Speed_Scorer', PAGE_SPEED_SCORER_PROMPT, context, log),
    runSubagent('SEO_Metadata_Inspector', SEO_METADATA_INSPECTOR_PROMPT, context, log),
    runSubagent('Content_Markup_Validator', CONTENT_MARKUP_VALIDATOR_PROMPT, context, log),
  ]);

  const aggregated = aggregateSubagentResults([speedResult, seoResult, markupResult]);
  
  log?.(`[Technical_Performance_Agent] COMPLETED - Score: ${aggregated.score}/10`);
  
  return {
    ...aggregated,
    subagent_results: [speedResult, seoResult, markupResult],
  };
}

// ============================================================================
// MAIN PARALLEL AGENT EXECUTION
// ============================================================================

export interface ParallelAgentResults {
  visual_design: AnalysisSection;
  user_experience: AnalysisSection;
  content_quality: AnalysisSection;
  technical_performance: AnalysisSection;
}

export async function runAllAgentsInParallel(
  content: SiteContent,
  log?: LogCallback
): Promise<ParallelAgentResults> {
  
  log?.(`[Benchmarking_Manager] Dispatching 4 Agents in PARALLEL...`);
  
  const [vaaResult, unaResult, csaResult, tpaResult] = await Promise.all([
    runVisualAestheticsAgent(content, log),
    runUXNavigationAgent(content, log),
    runContentStorytellingAgent(content, log),
    runTechnicalPerformanceAgent(content, log),
  ]);

  return {
    visual_design: vaaResult,
    user_experience: unaResult,
    content_quality: csaResult,
    technical_performance: tpaResult,
  };
}

export function calculateOverallScore(analysis: ParallelAgentResults): number {
  const scores = [
    analysis.visual_design.score,
    analysis.user_experience.score,
    analysis.content_quality.score,
    analysis.technical_performance.score,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

// ============================================================================
// COMPARATIVE INSIGHTS ENGINE
// ============================================================================

export interface Report {
  report_title: string;
  client_website_analysis: SiteAnalysis;
  competitor_analyses: SiteAnalysis[];
  comparative_analysis: {
    strengths_relative: string[];
    weaknesses_relative: string[];
    industry_best_practices: string[];
    emerging_trends: string[];
  };
  recommendations: {
    high_priority: string[];
    medium_priority: string[];
    innovative_opportunities: string[];
  };
  implementation_notes: string[];
}

const COMPARATIVE_PROMPT = `You are the COMPARATIVE_INSIGHTS_ENGINE, analyzing competitive positioning.

Given the client's analysis and competitor analyses, provide strategic insights.

Be specific and actionable. Reference actual score differences and specific areas.

Return ONLY valid JSON in this format:
{
  "comparative_analysis": {
    "strengths_relative": ["Client's specific advantage 1", "Client's specific advantage 2"],
    "weaknesses_relative": ["Area where competitors outperform 1", "Area where competitors outperform 2"],
    "industry_best_practices": ["Best practice observed 1", "Best practice observed 2"],
    "emerging_trends": ["Trend 1", "Trend 2"]
  },
  "recommendations": {
    "high_priority": ["Urgent action 1", "Urgent action 2"],
    "medium_priority": ["Important improvement 1", "Important improvement 2"],
    "innovative_opportunities": ["Innovation opportunity 1", "Innovation opportunity 2"]
  },
  "implementation_notes": ["Implementation detail 1", "Implementation detail 2"]
}`;

export async function generateComparativeInsights(
  clientAnalysis: SiteAnalysis,
  competitorAnalyses: SiteAnalysis[],
  log?: LogCallback
): Promise<Pick<Report, 'comparative_analysis' | 'recommendations' | 'implementation_notes'>> {
  
  log?.(`[Comparative_Insights_Engine] Cross-referencing competitive data...`);
  
  const analysisContext = `
CLIENT WEBSITE: ${clientAnalysis.name} (${clientAnalysis.url})
Overall Score: ${clientAnalysis.overall_score}/10
- Visual Design: ${clientAnalysis.visual_design.score}/10
  Strengths: ${clientAnalysis.visual_design.strengths.join(', ')}
  Weaknesses: ${clientAnalysis.visual_design.weaknesses.join(', ')}
- UX: ${clientAnalysis.user_experience.score}/10
  Strengths: ${clientAnalysis.user_experience.strengths.join(', ')}
  Weaknesses: ${clientAnalysis.user_experience.weaknesses.join(', ')}
- Content: ${clientAnalysis.content_quality.score}/10
  Strengths: ${clientAnalysis.content_quality.strengths.join(', ')}
  Weaknesses: ${clientAnalysis.content_quality.weaknesses.join(', ')}
- Technical: ${clientAnalysis.technical_performance.score}/10
  Strengths: ${clientAnalysis.technical_performance.strengths.join(', ')}
  Weaknesses: ${clientAnalysis.technical_performance.weaknesses.join(', ')}

COMPETITORS:
${competitorAnalyses.map((comp, i) => `
${i + 1}. ${comp.name} (${comp.url}) - Overall: ${comp.overall_score}/10
   - Visual: ${comp.visual_design.score}, UX: ${comp.user_experience.score}, Content: ${comp.content_quality.score}, Tech: ${comp.technical_performance.score}
   - Key Strengths: ${[...comp.visual_design.strengths.slice(0,1), ...comp.user_experience.strengths.slice(0,1)].join(', ')}
`).join('\n')}

Provide strategic insights comparing the client to competitors. Be specific about score gaps and opportunities.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: COMPARATIVE_PROMPT },
      { role: "user", content: analysisContext }
    ],
    temperature: 0.8,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  log?.(`[Comparative_Insights_Engine] Analysis complete.`);
  
  return {
    comparative_analysis: result.comparative_analysis || {
      strengths_relative: [],
      weaknesses_relative: [],
      industry_best_practices: [],
      emerging_trends: [],
    },
    recommendations: result.recommendations || {
      high_priority: [],
      medium_priority: [],
      innovative_opportunities: [],
    },
    implementation_notes: result.implementation_notes || [],
  };
}
