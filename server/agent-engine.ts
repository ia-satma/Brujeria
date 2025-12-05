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
    
    // Extract basic information
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title';
    
    const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;
    
    // Extract H1 tags
    const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
    const h1Tags = Array.from(h1Matches).map(m => m[1].trim()).filter(Boolean);
    
    // Clean HTML to text (basic version)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Limit to 15k chars for LLM context

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

export interface AnalysisSection {
  observations: string;
  strengths: string[];
  weaknesses: string[];
  score: number;
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

const ANALYSIS_PROMPT = `You are a hyperspecialized web benchmarking analyst. You will receive website content and must analyze it across 4 dimensions.

For EACH dimension, provide:
1. Detailed observations (2-3 sentences)
2. 2-3 specific strengths
3. 1-2 specific weaknesses
4. A score from 1-10 (be critical but fair)

Scoring guidelines:
- 9-10: Exceptional, industry-leading
- 7-8: Strong, above average
- 5-6: Adequate, meets basic expectations
- 3-4: Below average, needs improvement
- 1-2: Poor, requires major overhaul

DIMENSIONS TO ANALYZE:

1. Visual Design & Aesthetics
   - Color palette coherence and brand alignment
   - Typography hierarchy and readability
   - Use of whitespace and visual balance
   - Image quality and relevance
   - Overall modernity and professionalism

2. User Experience & Navigation
   - Information architecture and menu structure
   - Navigation clarity and depth
   - Mobile responsiveness (inferred from structure)
   - CTA visibility and effectiveness
   - Perceived load speed and interaction patterns

3. Content Quality & Storytelling
   - Brand voice clarity and consistency
   - Value proposition strength
   - Message persuasiveness and engagement
   - Content organization and hierarchy
   - Professional credibility signals

4. Technical Performance
   - Page structure and semantic HTML
   - SEO metadata quality (title, description, H1-H6)
   - Inferred performance characteristics
   - URL structure and optimization

Return ONLY valid JSON in this exact format:
{
  "visual_design": {
    "observations": "...",
    "strengths": ["...", "..."],
    "weaknesses": ["..."],
    "score": 7
  },
  "user_experience": {
    "observations": "...",
    "strengths": ["...", "..."],
    "weaknesses": ["..."],
    "score": 6
  },
  "content_quality": {
    "observations": "...",
    "strengths": ["...", "..."],
    "weaknesses": ["..."],
    "score": 8
  },
  "technical_performance": {
    "observations": "...",
    "strengths": ["...", "..."],
    "weaknesses": ["..."],
    "score": 7
  }
}`;

export async function analyzeSiteWithAI(content: SiteContent): Promise<Omit<SiteAnalysis, 'name' | 'url' | 'overall_score'>> {
  const contextPrompt = `
Website: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription || 'None'}
H1 Tags: ${content.h1Tags.join(', ') || 'None'}

Content Preview (first 3000 chars):
${content.text.slice(0, 3000)}

Analyze this website comprehensively.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      { role: "user", content: contextPrompt }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    visual_design: result.visual_design,
    user_experience: result.user_experience,
    content_quality: result.content_quality,
    technical_performance: result.technical_performance,
  };
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
