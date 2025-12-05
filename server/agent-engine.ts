import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface SiteContent {
  url: string;
  title: string;
  html: string;
  text: string;
  metaDescription?: string;
  h1Tags: string[];
}

export async function fetchSiteContent(url: string): Promise<SiteContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebBenchmarkBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title';
    
    const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;
    
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h1Tags = Array.from(h1Matches).map(m => m[1].trim()).filter(Boolean);
    
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000);

    return {
      url,
      title,
      html,
      text,
      metaDescription,
      h1Tags,
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

export interface SubAgentResult {
  name: string;
  finding: string;
  score: number;
  details: string[];
}

export interface AgentAnalysis {
  agent_name: string;
  observations: string;
  strengths: string[];
  weaknesses: string[];
  score: number;
  subagent_results: SubAgentResult[];
}

export interface AnalysisSection {
  observations: string;
  strengths: string[];
  weaknesses: string[];
  score: number;
  subagent_results?: SubAgentResult[];
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

// ============================================================================
// VISUAL AESTHETICS AGENT (VAA)
// Subagents: Color_Palette_Analyzer, Typo_Readability_Checker, Design_Trend_Evaluator
// ============================================================================

const VAA_PROMPT = `You are the VISUAL_AESTHETICS_AGENT (VAA), a hyperspecialized AI focused EXCLUSIVELY on visual design analysis.

You command 3 subagents:
1. COLOR_PALETTE_ANALYZER - Extracts and evaluates color schemes, contrast ratios, brand color consistency
2. TYPO_READABILITY_CHECKER - Analyzes font families, sizes, line heights, heading hierarchy
3. DESIGN_TREND_EVALUATOR - Assesses modernity, visual balance, whitespace usage, image quality

ANALYSIS PROTOCOL:
- Analyze ONLY visual/aesthetic elements - ignore UX, content, or technical aspects
- Each subagent must provide specific, measurable findings
- Be critical but fair: most websites score 5-7, exceptional ones 8-9, only truly outstanding get 10

Return ONLY valid JSON:
{
  "observations": "2-3 sentences summarizing visual design quality",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "score": 7,
  "subagent_results": [
    {
      "name": "Color_Palette_Analyzer",
      "finding": "Primary finding about colors",
      "score": 7,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Typo_Readability_Checker",
      "finding": "Primary finding about typography",
      "score": 6,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Design_Trend_Evaluator",
      "finding": "Primary finding about design trends",
      "score": 8,
      "details": ["Detail 1", "Detail 2"]
    }
  ]
}`;

// ============================================================================
// UX NAVIGATION AGENT (UNA)
// Subagents: Information_Architecture_Mapper, CTA_Effectiveness_Scorer, Responsive_Design_Inferrer
// ============================================================================

const UNA_PROMPT = `You are the UX_NAVIGATION_AGENT (UNA), a hyperspecialized AI focused EXCLUSIVELY on user experience and navigation analysis.

You command 3 subagents:
1. INFORMATION_ARCHITECTURE_MAPPER - Maps menu structure, navigation depth, content organization
2. CTA_EFFECTIVENESS_SCORER - Evaluates call-to-action visibility, placement, persuasiveness
3. RESPONSIVE_DESIGN_INFERRER - Infers mobile-friendliness from HTML structure, viewport meta, media queries

ANALYSIS PROTOCOL:
- Analyze ONLY UX/navigation elements - ignore visual design, content quality, or technical SEO
- Each subagent must provide specific, measurable findings
- Be critical but fair: most websites score 5-7, exceptional ones 8-9, only truly outstanding get 10

Return ONLY valid JSON:
{
  "observations": "2-3 sentences summarizing UX quality",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "score": 6,
  "subagent_results": [
    {
      "name": "Information_Architecture_Mapper",
      "finding": "Primary finding about site structure",
      "score": 6,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "CTA_Effectiveness_Scorer",
      "finding": "Primary finding about CTAs",
      "score": 7,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Responsive_Design_Inferrer",
      "finding": "Primary finding about responsiveness",
      "score": 5,
      "details": ["Detail 1", "Detail 2"]
    }
  ]
}`;

// ============================================================================
// CONTENT STORYTELLING AGENT (CSA)
// Subagents: Brand_Voice_Validator, Thought_Leadership_Scrutinizer, Credibility_Evidence_Collector
// ============================================================================

const CSA_PROMPT = `You are the CONTENT_STORYTELLING_AGENT (CSA), a hyperspecialized AI focused EXCLUSIVELY on content quality and brand storytelling.

You command 3 subagents:
1. BRAND_VOICE_VALIDATOR - Analyzes tone consistency, messaging clarity, value proposition strength
2. THOUGHT_LEADERSHIP_SCRUTINIZER - Evaluates expertise signals, unique insights, industry authority
3. CREDIBILITY_EVIDENCE_COLLECTOR - Scans for social proof, testimonials, certifications, trust signals

ANALYSIS PROTOCOL:
- Analyze ONLY content/storytelling elements - ignore visual design, UX, or technical aspects
- Each subagent must provide specific, measurable findings
- Be critical but fair: most websites score 5-7, exceptional ones 8-9, only truly outstanding get 10

Return ONLY valid JSON:
{
  "observations": "2-3 sentences summarizing content quality",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "score": 7,
  "subagent_results": [
    {
      "name": "Brand_Voice_Validator",
      "finding": "Primary finding about brand voice",
      "score": 7,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Thought_Leadership_Scrutinizer",
      "finding": "Primary finding about thought leadership",
      "score": 6,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Credibility_Evidence_Collector",
      "finding": "Primary finding about credibility",
      "score": 8,
      "details": ["Detail 1", "Detail 2"]
    }
  ]
}`;

// ============================================================================
// TECHNICAL PERFORMANCE AGENT (TPA)
// Subagents: Page_Speed_Scorer, SEO_Metadata_Inspector, Content_Markup_Validator
// ============================================================================

const TPA_PROMPT = `You are the TECHNICAL_PERFORMANCE_AGENT (TPA), a hyperspecialized AI focused EXCLUSIVELY on technical SEO and performance analysis.

You command 3 subagents:
1. PAGE_SPEED_SCORER - Infers performance from code structure, resource hints, lazy loading
2. SEO_METADATA_INSPECTOR - Validates title, meta description, H1-H6 hierarchy, schema.org
3. CONTENT_MARKUP_VALIDATOR - Checks semantic HTML, accessibility hints, structured data

ANALYSIS PROTOCOL:
- Analyze ONLY technical/performance elements - ignore visual design, UX, or content quality
- Each subagent must provide specific, measurable findings
- Be critical but fair: most websites score 5-7, exceptional ones 8-9, only truly outstanding get 10

Return ONLY valid JSON:
{
  "observations": "2-3 sentences summarizing technical quality",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "score": 6,
  "subagent_results": [
    {
      "name": "Page_Speed_Scorer",
      "finding": "Primary finding about performance",
      "score": 5,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "SEO_Metadata_Inspector",
      "finding": "Primary finding about SEO metadata",
      "score": 7,
      "details": ["Detail 1", "Detail 2"]
    },
    {
      "name": "Content_Markup_Validator",
      "finding": "Primary finding about markup",
      "score": 6,
      "details": ["Detail 1", "Detail 2"]
    }
  ]
}`;

// ============================================================================
// AGENT EXECUTION FUNCTIONS
// ============================================================================

export type AgentType = 'VAA' | 'UNA' | 'CSA' | 'TPA';

export interface AgentLogCallback {
  (agentType: AgentType, subagentName: string, message: string): void;
}

async function runAgent(
  agentType: AgentType,
  prompt: string,
  content: SiteContent,
  logCallback?: AgentLogCallback
): Promise<AnalysisSection> {
  
  const contextPrompt = `
Website: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription || 'None'}
H1 Tags: ${content.h1Tags.join(', ') || 'None'}

HTML Structure Preview (first 2000 chars):
${content.html.slice(0, 2000)}

Text Content Preview (first 2000 chars):
${content.text.slice(0, 2000)}

Analyze this website according to your specialization.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: contextPrompt }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    observations: result.observations || '',
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    score: result.score || 5,
    subagent_results: result.subagent_results || [],
  };
}

export interface ParallelAgentResults {
  visual_design: AnalysisSection;
  user_experience: AnalysisSection;
  content_quality: AnalysisSection;
  technical_performance: AnalysisSection;
}

export async function runAllAgentsInParallel(
  content: SiteContent,
  logCallback?: AgentLogCallback
): Promise<ParallelAgentResults> {
  
  const [vaaResult, unaResult, csaResult, tpaResult] = await Promise.all([
    runAgent('VAA', VAA_PROMPT, content, logCallback),
    runAgent('UNA', UNA_PROMPT, content, logCallback),
    runAgent('CSA', CSA_PROMPT, content, logCallback),
    runAgent('TPA', TPA_PROMPT, content, logCallback),
  ]);

  return {
    visual_design: vaaResult,
    user_experience: unaResult,
    content_quality: csaResult,
    technical_performance: tpaResult,
  };
}

export async function analyzeSiteWithAI(content: SiteContent): Promise<Omit<SiteAnalysis, 'name' | 'url' | 'overall_score'>> {
  return await runAllAgentsInParallel(content);
}

export function calculateOverallScore(analysis: Omit<SiteAnalysis, 'name' | 'url' | 'overall_score'>): number {
  const scores = [
    analysis.visual_design.score,
    analysis.user_experience.score,
    analysis.content_quality.score,
    analysis.technical_performance.score,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

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

const COMPARATIVE_PROMPT = `You are analyzing competitive positioning. Given the client's analysis and competitor analyses, provide strategic insights.

Return ONLY valid JSON in this format:
{
  "comparative_analysis": {
    "strengths_relative": ["strength 1", "strength 2"],
    "weaknesses_relative": ["weakness 1", "weakness 2"],
    "industry_best_practices": ["practice 1", "practice 2"],
    "emerging_trends": ["trend 1", "trend 2"]
  },
  "recommendations": {
    "high_priority": ["rec 1", "rec 2"],
    "medium_priority": ["rec 1", "rec 2"],
    "innovative_opportunities": ["opp 1", "opp 2"]
  },
  "implementation_notes": ["note 1", "note 2"]
}`;

export async function generateComparativeInsights(
  clientAnalysis: SiteAnalysis,
  competitorAnalyses: SiteAnalysis[]
): Promise<Pick<Report, 'comparative_analysis' | 'recommendations' | 'implementation_notes'>> {
  
  const analysisContext = `
CLIENT WEBSITE: ${clientAnalysis.name} (${clientAnalysis.url})
Overall Score: ${clientAnalysis.overall_score}/10
- Visual Design: ${clientAnalysis.visual_design.score}/10
- UX: ${clientAnalysis.user_experience.score}/10
- Content: ${clientAnalysis.content_quality.score}/10
- Technical: ${clientAnalysis.technical_performance.score}/10

COMPETITORS:
${competitorAnalyses.map((comp, i) => `
${i + 1}. ${comp.name} (${comp.url}) - Overall: ${comp.overall_score}/10
   - Visual: ${comp.visual_design.score}, UX: ${comp.user_experience.score}, Content: ${comp.content_quality.score}, Tech: ${comp.technical_performance.score}
`).join('\n')}

Provide strategic insights and actionable recommendations.`;

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
  
  return {
    comparative_analysis: result.comparative_analysis,
    recommendations: result.recommendations,
    implementation_notes: result.implementation_notes,
  };
}
