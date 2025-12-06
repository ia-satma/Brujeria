import OpenAI from "openai";
import { 
  getAgentKnowledgeService, 
  getCrossAgentRAGService,
  AGENT_NAMES,
  type AgentName,
  type RAGResult,
  type RAGContext
} from "./agent-knowledge";
import { extractPatternsAfterAnalysis } from "./autonomy-engine";
import { getAgentConfigRegistry, type RegisteredAgentName } from "./config/agent-config-registry";
import { performMetacognition, type MetacognitionResult } from "./metacognition-service";
import { getEvolutionService } from "./evolution-service";
import { getSubagentFactory, type SubagentExecutionResult } from "./skills";
import {
  getCircuitBreaker,
  getAllCircuitBreakers,
  resetAllCircuitBreakers,
  retryWithBackoff,
  RETRY_PRESETS,
  executeWithFallback,
  executeSubagentWithFallback,
  getResilienceStats,
  clearResilienceCache,
  type CircuitBreakerSnapshot,
  type ResilienceStats,
} from "./resilience";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const knowledgeService = getAgentKnowledgeService();
const ragService = getCrossAgentRAGService();
const configRegistry = getAgentConfigRegistry();

console.log(`[AgentEngine] Loaded config registry with ${configRegistry.getAllAgentNames().length} agents`);

function getSubagentPromptFromRegistry(
  agentName: RegisteredAgentName,
  subagentId: string
): string {
  const tools = configRegistry.getSubagentPrompts(agentName);
  const tool = tools.find(t => t.id === subagentId);
  if (!tool) {
    throw new Error(`Subagent ${subagentId} not found for ${agentName}`);
  }
  return tool.subagentPrompt;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface PageContent {
  path: string;
  title: string;
  html: string;
  text: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  paragraphs: string[];
  ctas: string[];
  images: number;
  forms: number;
}

export interface SiteContent {
  url: string;
  pages: PageContent[];
  pagesScraped: number;
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
  metacognition?: MetacognitionResult;
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

export interface ExtractedDomains {
  sourceUrl: string;
  extractedCount: number;
  domains: string[];
}

// ============================================================================
// LLM COUNCIL INTERFACES
// ============================================================================

export interface CouncilFinding {
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
  evidence: string;
}

export interface CouncilOpinion {
  persona: 'critic' | 'strategist' | 'innovator';
  personaName: string;
  analysis: string;
  findings: CouncilFinding[];
  confidence: number;
}

export interface PeerReviewEvaluation {
  reviewed: string;
  agree: string[];
  disagree: string;
  rank: number;
}

export interface PeerReview {
  reviewer: 'critic' | 'strategist' | 'innovator';
  evaluations: PeerReviewEvaluation[];
  selfRank: number;
  rationale: string;
}

export interface ShuffleMappingEntry {
  reviewerIndex: number;
  mapping: { [label: string]: number };
}

export interface Stage2Result {
  reviews: PeerReview[];
  shuffleMappings: ShuffleMappingEntry[];
}

export interface FinalRankedIssue {
  issue: string;
  priority: 'P0' | 'P1' | 'P2';
  votes: number;
  severity: string;
}

export interface CouncilResult {
  consensusScore: number;
  finalRanking: FinalRankedIssue[];
  chairmanVerdict: string;
  dissentingOpinions: string[];
  stage1Opinions: CouncilOpinion[];
  stage2Reviews: PeerReview[];
}

// ============================================================================
// REPORT ENHANCEMENT INTERFACES
// ============================================================================

export interface ReportMetadata {
  generated_at: string;
  client_url: string;
  competitors_analyzed: number;
  council_consensus: number;
}

export interface ExecutiveSummary {
  overall_score: number;
  vs_competitors: string;
  critical_issues: number;
  estimated_conversion_loss: string;
}

export interface PrioritizedTask {
  id: string;
  priority: string;
  department: string;
  title: string;
  problem: string;
  solution: string;
  success_metrics: string[];
  estimated_hours: number;
  replit_code?: string | null;
}

export interface CompletionCriteria {
  phase_0: string;
  phase_1: string;
  phase_2: string;
}

// ============================================================================
// SCRAPING ORCHESTRATOR
// ============================================================================

async function runDataExtractor(url: string, log?: LogCallback): Promise<{ html: string; text: string }> {
  log?.(`[Scraping_Orchestrator] > [Data_Extractor] Fetching raw DOM from ${url}...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WebBenchmarkBot/1.0)',
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

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

async function runMetadataFetcher(html: string, url: string, log?: LogCallback): Promise<Omit<SiteContent, 'html' | 'text' | 'url' | 'pages' | 'pagesScraped'>> {
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

const MULTI_PAGE_PATHS = ['/', '/about', '/about-us', '/nosotros', '/services', '/servicios', '/practice-areas', '/contact', '/contacto'];

const CTA_ACTION_WORDS = [
  'contact', 'schedule', 'call', 'book', 'request', 'get started', 'sign up', 
  'subscribe', 'learn more', 'free', 'consultation', 'quote', 'demo', 'trial',
  'buy', 'order', 'shop', 'download', 'register', 'join', 'apply', 'submit'
];

function extractPageContent(html: string, path: string): PageContent {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'No title';
  
  const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1] : undefined;
  
  const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h1Tags = Array.from(h1Matches).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 5);
  
  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h2Tags = Array.from(h2Matches).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 10);
  
  const paragraphMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  const paragraphs = Array.from(paragraphMatches)
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 20)
    .slice(0, 10)
    .map(p => p.slice(0, 500));
  
  const ctaPattern = new RegExp(`<(a|button)[^>]*>([^<]*(?:${CTA_ACTION_WORDS.join('|')})[^<]*)<\\/(a|button)>`, 'gi');
  const ctaMatches = html.matchAll(ctaPattern);
  const ctas = Array.from(ctaMatches)
    .map(m => m[2].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 10);
  
  const imageMatches = html.matchAll(/<img[^>]*>/gi);
  const images = Array.from(imageMatches).length;
  
  const formMatches = html.matchAll(/<form[^>]*>/gi);
  const forms = Array.from(formMatches).length;
  
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  return {
    path,
    title,
    html,
    text,
    metaDescription,
    h1Tags,
    h2Tags,
    paragraphs,
    ctas,
    images,
    forms,
  };
}

async function scrapeMultiplePages(baseUrl: string, log?: LogCallback): Promise<PageContent[]> {
  log?.(`[Scraping_Orchestrator] > [Multi_Page_Scraper] Starting multi-page scraping for ${baseUrl}`);
  
  const parsedUrl = new URL(baseUrl);
  const origin = parsedUrl.origin;
  const pages: PageContent[] = [];
  const totalPaths = MULTI_PAGE_PATHS.length;
  
  for (let i = 0; i < MULTI_PAGE_PATHS.length; i++) {
    const path = MULTI_PAGE_PATHS[i];
    const fullUrl = `${origin}${path}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebBenchmarkBot/1.0)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        continue;
      }
      
      const html = await response.text();
      const pageContent = extractPageContent(html, path);
      pages.push(pageContent);
      
      log?.(`[Scraping_Orchestrator] > [Multi_Page_Scraper] Scraped ${path} (${pages.length}/${totalPaths})`);
      
    } catch (error) {
    }
    
    if (i < MULTI_PAGE_PATHS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  log?.(`[Scraping_Orchestrator] > [Multi_Page_Scraper] Completed: ${pages.length} pages scraped`);
  
  return pages;
}

export async function fetchSiteContent(url: string, log?: LogCallback): Promise<SiteContent> {
  log?.(`[Scraping_Orchestrator] Targeted: ${url}`);
  
  const { html, text } = await runDataExtractor(url, log);
  const metadata = await runMetadataFetcher(html, url, log);
  
  const pages = await scrapeMultiplePages(url, log);
  
  const allH1Tags = new Set<string>(metadata.h1Tags);
  const allH2Tags = new Set<string>(metadata.h2Tags);
  
  for (const page of pages) {
    page.h1Tags.forEach(tag => allH1Tags.add(tag));
    page.h2Tags.forEach(tag => allH2Tags.add(tag));
  }
  
  log?.(`[Scraping_Orchestrator] Context acquisition complete. Aggregated ${allH1Tags.size} H1s, ${allH2Tags.size} H2s from ${pages.length} pages.`);
  
  return {
    url,
    pages,
    pagesScraped: pages.length,
    html,
    text,
    ...metadata,
    h1Tags: Array.from(allH1Tags),
    h2Tags: Array.from(allH2Tags),
  };
}

// ============================================================================
// LINK EXTRACTOR AGENT
// ============================================================================

const FILTERED_DOMAIN_PATTERNS = [
  /^cdn\./i,
  /^fonts\./i,
  /^ajax\./i,
  /^apis\./i,
  /\.cdn\./i,
];

const FILTERED_DOMAINS = new Set([
  'facebook.com',
  'www.facebook.com',
  'twitter.com',
  'www.twitter.com',
  'linkedin.com',
  'www.linkedin.com',
  'instagram.com',
  'www.instagram.com',
  'youtube.com',
  'www.youtube.com',
  'x.com',
  'www.x.com',
  'google.com',
  'www.google.com',
  'googleapis.com',
  'gstatic.com',
  'fonts.googleapis.com',
  'ajax.googleapis.com',
  'apis.google.com',
]);

function extractDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.hostname.toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

function isFilteredDomain(domain: string): boolean {
  if (FILTERED_DOMAINS.has(domain)) {
    return true;
  }
  
  for (const pattern of FILTERED_DOMAIN_PATTERNS) {
    if (pattern.test(domain)) {
      return true;
    }
  }
  
  return false;
}

async function fetchWithRetry(
  url: string,
  maxAttempts: number = 3,
  log?: LogCallback
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log?.(`[Link_Extractor_Agent] Fetch attempt ${attempt}/${maxAttempts} for ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WebBenchmarkBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      log?.(`[Link_Extractor_Agent] Attempt ${attempt} failed: ${lastError.message}`);
      
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000;
        log?.(`[Link_Extractor_Agent] Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to fetch ${url} after ${maxAttempts} attempts: ${lastError?.message}`);
}

export async function extractExternalDomains(
  portfolioUrl: string,
  log?: LogCallback
): Promise<ExtractedDomains> {
  log?.(`[Link_Extractor_Agent] Starting external domain extraction from ${portfolioUrl}`);
  
  let sourceDomain: string;
  try {
    sourceDomain = new URL(portfolioUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`Invalid portfolio URL: ${portfolioUrl}`);
  }
  
  const html = await fetchWithRetry(portfolioUrl, 3, log);
  log?.(`[Link_Extractor_Agent] Fetched ${html.length} bytes of HTML`);
  
  const hrefMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
  const allHrefs = Array.from(hrefMatches).map(m => m[1]);
  log?.(`[Link_Extractor_Agent] Found ${allHrefs.length} anchor tags`);
  
  const externalDomains = new Set<string>();
  
  for (const href of allHrefs) {
    if (!href.startsWith('http://') && !href.startsWith('https://')) {
      continue;
    }
    
    const domain = extractDomainFromUrl(href);
    if (!domain) continue;
    
    if (domain === sourceDomain || domain.endsWith(`.${sourceDomain}`)) {
      continue;
    }
    
    if (isFilteredDomain(domain)) {
      continue;
    }
    
    externalDomains.add(domain);
  }
  
  const domains = Array.from(externalDomains)
    .sort()
    .map(domain => `https://${domain}`);
  
  log?.(`[Link_Extractor_Agent] Found ${domains.length} external domains from portfolio`);
  
  return {
    sourceUrl: portfolioUrl,
    extractedCount: domains.length,
    domains,
  };
}

// ============================================================================
// LLM COUNCIL PERSONA PROMPTS
// ============================================================================

const COUNCIL_PERSONAS = {
  critic: {
    name: "Critical Analyst",
    prompt: `You are a ruthless website auditor. Your job is to identify ALL failures, risks, and weaknesses.
Do not soften your analysis. Quantify the impact of each problem.
Prioritize issues that are causing conversion loss RIGHT NOW.
Focus on critical flaws that competitors don't have.

Analyze the website data and agent analysis results provided.

Return ONLY valid JSON:
{
  "analysis": "Comprehensive critical analysis text...",
  "findings": [
    {
      "issue": "Specific problem description",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "impact": "Quantified business impact",
      "evidence": "Specific data supporting this finding"
    }
  ],
  "confidence": 0.94
}`
  },
  strategist: {
    name: "Business Strategist",
    prompt: `You are a conversion and ROI consultant.
Evaluate every element from a business perspective.
Is the site optimized to capture high-value leads?
Does the conversion funnel have leaks? Where?
Compare to competitors and identify gaps.

Analyze the website data and agent analysis results provided.

Return ONLY valid JSON:
{
  "analysis": "Strategic business analysis text...",
  "findings": [
    {
      "issue": "Specific problem description",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "impact": "Quantified business impact",
      "evidence": "Specific data supporting this finding"
    }
  ],
  "confidence": 0.91
}`
  },
  innovator: {
    name: "UX Innovator",
    prompt: `You are a visionary designer specialized in modern web experiences.
Identify differentiation opportunities.
What are industry leaders doing that this site isn't?
Propose modern solutions and 2024-2025 trends.
Focus on innovative improvements that would set this site apart.

Analyze the website data and agent analysis results provided.

Return ONLY valid JSON:
{
  "analysis": "Innovative UX analysis text...",
  "findings": [
    {
      "issue": "Specific opportunity or improvement",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "impact": "Quantified potential benefit",
      "evidence": "Specific data supporting this finding"
    }
  ],
  "confidence": 0.88
}`
  }
};

const PEER_REVIEW_PROMPT = `You are reviewing anonymous analyses of a website.
Evaluate each analysis objectively based on quality of arguments, not personal bias.

For each of the 3 analyses provided (Analysis A, B, C):
1. Points you AGREE with (and why)
2. Points you DISAGREE with (and why)
3. Your RANKING of the 3 analyses (1=best, 3=worst)
4. Justification for your ranking

Return ONLY valid JSON:
{
  "evaluations": [
    {
      "reviewed": "Analysis A",
      "agree": ["point1", "point2"],
      "disagree": "reason for disagreement or 'None'",
      "rank": 2
    },
    {
      "reviewed": "Analysis B",
      "agree": ["point1"],
      "disagree": "reason for disagreement",
      "rank": 1
    },
    {
      "reviewed": "Analysis C",
      "agree": ["point1"],
      "disagree": "reason for disagreement",
      "rank": 3
    }
  ],
  "selfRank": 1,
  "rationale": "Justification for the ranking"
}`;

const CHAIRMAN_PROMPT = `You are the Council Chairman. You have access to:
1. The 3 initial opinions from Critic, Strategist, and Innovator
2. The peer reviews from each council member
3. Rankings from each reviewer

Your job:
1. Apply weighted Borda Count method (weight by severity: CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1)
2. Generate FINAL RANKING of issues to resolve
3. Identify CONSENSUS points (unanimous agreement)
4. Document DISSENTING opinions (important disagreements)
5. Issue FINAL VERDICT with prioritized action plan

Return ONLY valid JSON:
{
  "consensusScore": 0.87,
  "finalRanking": [
    {"issue": "Issue description", "priority": "P0", "votes": 3, "severity": "CRITICAL"},
    {"issue": "Issue description", "priority": "P0", "votes": 2, "severity": "HIGH"}
  ],
  "chairmanVerdict": "Action plan text with prioritized recommendations...",
  "dissentingOpinions": ["Minority opinion 1...", "Minority opinion 2..."]
}`;

// ============================================================================
// SUBAGENT EXECUTION
// ============================================================================

const API_TIMEOUT_MS = 60000;

async function runSubagentCore(
  name: string,
  prompt: string,
  context: string,
  log?: LogCallback,
  abortSignal?: AbortSignal
): Promise<SubAgentResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: context }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }, { signal: controller.signal });

    clearTimeout(timeoutId);
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      name,
      finding: result.finding || 'Analysis complete',
      score: result.score || 5,
      details: result.details || [],
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(`Timeout: Request exceeded ${API_TIMEOUT_MS/1000}s`);
    }
    
    throw error;
  }
}

async function runSubagent(
  name: string,
  prompt: string,
  context: string,
  log?: LogCallback,
  abortSignal?: AbortSignal,
  parentAgentName: string = 'Agent'
): Promise<SubAgentResult> {
  log?.(`    > [${name}] Analyzing...`);
  
  const result = await executeSubagentWithFallback(
    name,
    parentAgentName,
    async () => {
      return await runSubagentCore(name, prompt, context, log, abortSignal);
    },
    {
      useFallback: true,
      fallbackTimeout: 30000,
      retryConfig: RETRY_PRESETS.llmApi,
    },
    log
  );

  log?.(`    > [${name}] Score: ${result.score}/10 - ${result.finding}`);
  return result;
}

async function runDynamicSubagentsForAgent(
  parentAgentId: string,
  context: string,
  condition: string = "always",
  log?: LogCallback
): Promise<SubAgentResult[]> {
  try {
    const factory = getSubagentFactory();
    const activeSubagents = await factory.getActiveSubagentsForCondition(parentAgentId, condition);
    
    if (activeSubagents.length === 0) {
      return [];
    }
    
    log?.(`  [${parentAgentId}] Executing ${activeSubagents.length} dynamic subagents...`);
    
    const results = await Promise.all(
      activeSubagents.map(async (subagent) => {
        try {
          const execResult = await factory.executeSubagent(
            subagent.id,
            parentAgentId,
            context,
            log
          );
          
          await factory.evolveSkillExpertise(
            parentAgentId,
            subagent.skills[0],
            { score: execResult.score, successRate: execResult.confidence }
          );
          
          return {
            name: `[Dynamic] ${execResult.name}`,
            finding: execResult.finding,
            score: execResult.score,
            details: execResult.details,
          } as SubAgentResult;
        } catch (error: any) {
          log?.(`    > [${subagent.name}] ERROR: ${error.message}`);
          return {
            name: `[Dynamic] ${subagent.name}`,
            finding: 'Dynamic subagent execution failed',
            score: 5,
            details: [error.message || 'Unknown error'],
          } as SubAgentResult;
        }
      })
    );
    
    return results;
  } catch (error: any) {
    log?.(`  [${parentAgentId}] Dynamic subagent execution error: ${error.message}`);
    return [];
  }
}

async function learnFromAnalysis(
  parentAgentId: string,
  analysisResult: AnalysisSection,
  context: string,
  log?: LogCallback
): Promise<void> {
  try {
    const factory = getSubagentFactory();
    const skills = await factory.listSkills(parentAgentId);
    
    if (skills.length === 0) {
      return;
    }
    
    for (const result of analysisResult.subagent_results || []) {
      if (result.score >= 8 && result.details.length > 0) {
        const matchingSkill = skills.find(s => 
          result.finding.toLowerCase().includes(s.specialization.subDomain.toLowerCase()) ||
          s.name.toLowerCase().includes(result.name.toLowerCase().replace('_', ' '))
        );
        
        if (matchingSkill) {
          await factory.addLearningToSkill(parentAgentId, matchingSkill.id, {
            type: 'case_study',
            content: {
              title: `High-scoring analysis: ${result.finding.slice(0, 50)}`,
              industry: 'general',
              problem: 'Website analysis',
              strategy: result.finding,
              actions: result.details,
              results: {
                metrics: [{
                  metric: 'analysis_score',
                  before: 'N/A',
                  after: String(result.score),
                  improvement: 'N/A',
                }],
                summary: `Score: ${result.score}/10`,
              },
              lessonsLearned: result.details.slice(0, 2),
              applicablePatterns: [result.name],
            },
            source: `Analysis of ${context.slice(0, 100)}`,
            confidence: result.score / 10,
          });
          
          log?.(`  [${parentAgentId}] Learned from ${result.name} -> Skill: ${matchingSkill.name}`);
        }
      }
    }
  } catch (error: any) {
    console.error(`[learnFromAnalysis] Error for ${parentAgentId}:`, error.message);
  }
}

function buildContext(content: SiteContent): string {
  let pagesSection = '';
  
  if (content.pages && content.pages.length > 0) {
    pagesSection = `
=== MULTI-PAGE SITE DATA (${content.pagesScraped} pages scraped) ===
`;
    for (const page of content.pages) {
      pagesSection += `
--- Page: ${page.path} ---
Title: ${page.title}
Meta Description: ${page.metaDescription || 'None'}
H1 Tags: ${page.h1Tags.join(' | ') || 'None'}
H2 Tags: ${page.h2Tags.join(' | ') || 'None'}
CTAs Found: ${page.ctas.length > 0 ? page.ctas.join(', ') : 'None'}
Images: ${page.images}, Forms: ${page.forms}
Text Preview (500 chars): ${page.text.slice(0, 500)}
`;
    }
  }

  return `
Website: ${content.url}
Title: ${content.title}
Meta Description: ${content.metaDescription || 'None'}

=== AGGREGATED SITE DATA ===
All H1 Tags (across ${content.pagesScraped || 1} pages): ${content.h1Tags.join(' | ') || 'None'}
All H2 Tags (across ${content.pagesScraped || 1} pages): ${content.h2Tags.join(' | ') || 'None'}

Navigation Links (sample): ${content.links.slice(0, 10).join(', ')}
Total Images (homepage): ${content.images}

Technical Signals:
- Viewport Meta: ${content.hasViewportMeta ? 'Yes' : 'No'}
- Media Queries Detected: ${content.hasMediaQueries ? 'Yes' : 'No'}
- Schema.org: ${content.schemaOrg ? 'Yes' : 'No'}
${pagesSection}
=== HOMEPAGE CONTENT ===
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

function buildPriorKnowledgeContext(ragResults: RAGResult[]): string {
  if (ragResults.length === 0) return '';
  
  let context = '\n=== PRIOR KNOWLEDGE FROM MEMORY ===\n';
  context += `Found ${ragResults.length} relevant prior analyses:\n\n`;
  
  for (const result of ragResults.slice(0, 3)) {
    const doc = result.document;
    context += `--- From ${result.sourceAgent} (relevance: ${result.relevanceScore.toFixed(1)}) ---\n`;
    context += `Title: ${doc.title}\n`;
    if (doc.sourceUrl) context += `Source: ${doc.sourceUrl}\n`;
    
    const content = doc.content as Record<string, unknown>;
    if (content.observations) context += `Key Observations: ${content.observations}\n`;
    if (content.score) context += `Prior Score: ${content.score}/10\n`;
    if (content.strengths && Array.isArray(content.strengths)) {
      context += `Strengths Found: ${(content.strengths as string[]).slice(0, 2).join(', ')}\n`;
    }
    if (content.weaknesses && Array.isArray(content.weaknesses)) {
      context += `Weaknesses Found: ${(content.weaknesses as string[]).slice(0, 2).join(', ')}\n`;
    }
    context += '\n';
  }
  
  context += 'Use this prior knowledge to inform your analysis, but focus on the CURRENT website.\n';
  return context;
}

async function retrieveAgentKnowledge(
  agentName: AgentName,
  url: string,
  analysisType: 'visual' | 'ux' | 'content' | 'technical',
  log?: LogCallback
): Promise<RAGResult[]> {
  try {
    const context: RAGContext = {
      currentUrl: url,
      analysisType,
      minScore: 10,
    };
    
    const results = await ragService.retrieveRelevantKnowledge(agentName, context, 5);
    
    if (results.length > 0) {
      log?.(`  [${agentName}] Retrieved ${results.length} prior knowledge documents`);
    }
    
    return results;
  } catch (err) {
    console.error(`[${agentName}] Knowledge retrieval failed:`, err);
    return [];
  }
}

async function saveAgentAnalysisResult(
  agentName: AgentName,
  url: string,
  result: AnalysisSection,
  log?: LogCallback
): Promise<void> {
  try {
    await knowledgeService.saveAnalysisResult(agentName, {
      url,
      score: result.score,
      observations: result.observations,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      subagentResults: result.subagent_results,
    });
    log?.(`  [${agentName}] Saved analysis to knowledge base`);
    
    extractPatternsAfterAnalysis(agentName, {
      url,
      score: result.score,
      observations: result.observations,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    }, log).catch(err => {
      console.error(`[${agentName}] Pattern extraction failed:`, err);
    });
  } catch (err) {
    console.error(`[${agentName}] Failed to save analysis:`, err);
  }
}

// ============================================================================
// AGENT EXECUTION - Visual Aesthetics Agent (VAA)
// ============================================================================

async function runVisualAestheticsAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Visual_Aesthetics_Agent] Starting analysis...`);
  
  const priorKnowledge = await retrieveAgentKnowledge(
    AGENT_NAMES.VISUAL_AESTHETICS_AGENT,
    content.url,
    'visual',
    log
  );
  const knowledgeContext = buildPriorKnowledgeContext(priorKnowledge);
  const context = buildContext(content) + knowledgeContext;
  
  const [staticResults, dynamicResults] = await Promise.all([
    Promise.all([
      runSubagent('Color_Palette_Analyzer', getSubagentPromptFromRegistry("Visual_Aesthetics_Agent", "color_palette_analyzer"), context, log, undefined, "Visual_Aesthetics_Agent"),
      runSubagent('Typo_Readability_Checker', getSubagentPromptFromRegistry("Visual_Aesthetics_Agent", "typo_readability_checker"), context, log, undefined, "Visual_Aesthetics_Agent"),
      runSubagent('Design_Trend_Evaluator', getSubagentPromptFromRegistry("Visual_Aesthetics_Agent", "design_trend_evaluator"), context, log, undefined, "Visual_Aesthetics_Agent"),
    ]),
    runDynamicSubagentsForAgent("Visual_Aesthetics_Agent", context, "always", log),
  ]);

  const [colorResult, typoResult, trendResult] = staticResults;
  const allResults = [...staticResults, ...dynamicResults];
  
  const aggregated = aggregateSubagentResults(allResults);
  
  const analysisResult: AnalysisSection = {
    ...aggregated,
    subagent_results: allResults,
  };
  
  const metacognition = performMetacognition(
    "Visual_Aesthetics_Agent" as RegisteredAgentName,
    analysisResult,
    allResults,
    { htmlLength: content.html.length, pagesScraped: content.pagesScraped, hasMetadata: !!content.metaDescription }
  );
  analysisResult.metacognition = metacognition;
  log?.(`  [Visual_Aesthetics_Agent] Confidence: ${metacognition.confidence.overallConfidence.toFixed(2)}`);
  
  saveAgentAnalysisResult(AGENT_NAMES.VISUAL_AESTHETICS_AGENT, content.url, analysisResult, log).catch(err => {
    console.error('[Visual_Aesthetics_Agent] Knowledge save failed:', err.message);
  });
  
  learnFromAnalysis("Visual_Aesthetics_Agent", analysisResult, context, log).catch(err => {
    console.error('[Visual_Aesthetics_Agent] Learning failed:', err.message);
  });
  
  try {
    const evolutionService = getEvolutionService();
    evolutionService.recordLearningEvent({
      agentName: "Visual_Aesthetics_Agent",
      eventType: 'analysis_complete',
      details: {
        url: content.url,
        score: analysisResult.score,
        confidence: analysisResult.metacognition?.confidence.overallConfidence,
        dynamicSubagentsUsed: dynamicResults.length
      }
    });
    if (analysisResult.metacognition) {
      evolutionService.updatePerformanceStats("Visual_Aesthetics_Agent", analysisResult, analysisResult.metacognition);
    }
  } catch (error) {
    console.error('[Evolution] Visual_Aesthetics_Agent tracking failed:', error);
  }
  
  log?.(`[Visual_Aesthetics_Agent] COMPLETED - Score: ${aggregated.score}/10 (${dynamicResults.length} dynamic subagents)`);
  
  return analysisResult;
}

// ============================================================================
// AGENT EXECUTION - UX Navigation Agent (UNA)
// ============================================================================

async function runUXNavigationAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[UX_Navigation_Agent] Starting analysis...`);
  
  const priorKnowledge = await retrieveAgentKnowledge(
    AGENT_NAMES.UX_NAVIGATION_AGENT,
    content.url,
    'ux',
    log
  );
  const knowledgeContext = buildPriorKnowledgeContext(priorKnowledge);
  const context = buildContext(content) + knowledgeContext;
  
  const [staticResults, dynamicResults] = await Promise.all([
    Promise.all([
      runSubagent('Information_Architecture_Mapper', getSubagentPromptFromRegistry("UX_Navigation_Agent", "information_architecture_mapper"), context, log, undefined, "UX_Navigation_Agent"),
      runSubagent('CTA_Effectiveness_Scorer', getSubagentPromptFromRegistry("UX_Navigation_Agent", "cta_effectiveness_scorer"), context, log, undefined, "UX_Navigation_Agent"),
      runSubagent('Responsive_Design_Inferrer', getSubagentPromptFromRegistry("UX_Navigation_Agent", "responsive_design_inferrer"), context, log, undefined, "UX_Navigation_Agent"),
    ]),
    runDynamicSubagentsForAgent("UX_Navigation_Agent", context, "always", log),
  ]);
  
  const [iaResult, ctaResult, responsiveResult] = staticResults;
  const allResults = [...staticResults, ...dynamicResults];

  const aggregated = aggregateSubagentResults(allResults);
  
  const analysisResult: AnalysisSection = {
    ...aggregated,
    subagent_results: allResults,
  };
  
  const metacognition = performMetacognition(
    "UX_Navigation_Agent" as RegisteredAgentName,
    analysisResult,
    allResults,
    { htmlLength: content.html.length, pagesScraped: content.pagesScraped, hasMetadata: !!content.metaDescription }
  );
  analysisResult.metacognition = metacognition;
  log?.(`  [UX_Navigation_Agent] Confidence: ${metacognition.confidence.overallConfidence.toFixed(2)}`);
  
  saveAgentAnalysisResult(AGENT_NAMES.UX_NAVIGATION_AGENT, content.url, analysisResult, log).catch(err => {
    console.error('[UX_Navigation_Agent] Knowledge save failed:', err.message);
  });
  
  learnFromAnalysis("UX_Navigation_Agent", analysisResult, context, log).catch(err => {
    console.error('[UX_Navigation_Agent] Learning failed:', err.message);
  });
  
  try {
    const evolutionService = getEvolutionService();
    evolutionService.recordLearningEvent({
      agentName: "UX_Navigation_Agent",
      eventType: 'analysis_complete',
      details: {
        url: content.url,
        score: analysisResult.score,
        confidence: analysisResult.metacognition?.confidence.overallConfidence,
        dynamicSubagentsUsed: dynamicResults.length
      }
    });
    if (analysisResult.metacognition) {
      evolutionService.updatePerformanceStats("UX_Navigation_Agent", analysisResult, analysisResult.metacognition);
    }
  } catch (error) {
    console.error('[Evolution] UX_Navigation_Agent tracking failed:', error);
  }
  
  log?.(`[UX_Navigation_Agent] COMPLETED - Score: ${aggregated.score}/10 (${dynamicResults.length} dynamic subagents)`);
  
  return analysisResult;
}

// ============================================================================
// AGENT EXECUTION - Content Storytelling Agent (CSA)
// ============================================================================

async function runContentStorytellingAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Content_Storytelling_Agent] Starting analysis...`);
  
  const priorKnowledge = await retrieveAgentKnowledge(
    AGENT_NAMES.CONTENT_STORYTELLING_AGENT,
    content.url,
    'content',
    log
  );
  const knowledgeContext = buildPriorKnowledgeContext(priorKnowledge);
  const context = buildContext(content) + knowledgeContext;
  
  const [staticResults, dynamicResults] = await Promise.all([
    Promise.all([
      runSubagent('Brand_Voice_Validator', getSubagentPromptFromRegistry("Content_Storytelling_Agent", "brand_voice_validator"), context, log, undefined, "Content_Storytelling_Agent"),
      runSubagent('Thought_Leadership_Scrutinizer', getSubagentPromptFromRegistry("Content_Storytelling_Agent", "thought_leadership_scrutinizer"), context, log, undefined, "Content_Storytelling_Agent"),
      runSubagent('Credibility_Evidence_Collector', getSubagentPromptFromRegistry("Content_Storytelling_Agent", "credibility_evidence_collector"), context, log, undefined, "Content_Storytelling_Agent"),
    ]),
    runDynamicSubagentsForAgent("Content_Storytelling_Agent", context, "always", log),
  ]);
  
  const [voiceResult, thoughtResult, credibilityResult] = staticResults;
  const allResults = [...staticResults, ...dynamicResults];

  const aggregated = aggregateSubagentResults(allResults);
  
  const analysisResult: AnalysisSection = {
    ...aggregated,
    subagent_results: allResults,
  };
  
  const metacognition = performMetacognition(
    "Content_Storytelling_Agent" as RegisteredAgentName,
    analysisResult,
    allResults,
    { htmlLength: content.html.length, pagesScraped: content.pagesScraped, hasMetadata: !!content.metaDescription }
  );
  analysisResult.metacognition = metacognition;
  log?.(`  [Content_Storytelling_Agent] Confidence: ${metacognition.confidence.overallConfidence.toFixed(2)}`);
  
  saveAgentAnalysisResult(AGENT_NAMES.CONTENT_STORYTELLING_AGENT, content.url, analysisResult, log).catch(err => {
    console.error('[Content_Storytelling_Agent] Knowledge save failed:', err.message);
  });
  
  learnFromAnalysis("Content_Storytelling_Agent", analysisResult, context, log).catch(err => {
    console.error('[Content_Storytelling_Agent] Learning failed:', err.message);
  });
  
  try {
    const evolutionService = getEvolutionService();
    evolutionService.recordLearningEvent({
      agentName: "Content_Storytelling_Agent",
      eventType: 'analysis_complete',
      details: {
        url: content.url,
        score: analysisResult.score,
        confidence: analysisResult.metacognition?.confidence.overallConfidence,
        dynamicSubagentsUsed: dynamicResults.length
      }
    });
    if (analysisResult.metacognition) {
      evolutionService.updatePerformanceStats("Content_Storytelling_Agent", analysisResult, analysisResult.metacognition);
    }
  } catch (error) {
    console.error('[Evolution] Content_Storytelling_Agent tracking failed:', error);
  }
  
  log?.(`[Content_Storytelling_Agent] COMPLETED - Score: ${aggregated.score}/10 (${dynamicResults.length} dynamic subagents)`);
  
  return analysisResult;
}

// ============================================================================
// AGENT EXECUTION - Technical Performance Agent (TPA)
// ============================================================================

async function runTechnicalPerformanceAgent(content: SiteContent, log?: LogCallback): Promise<AnalysisSection> {
  log?.(`[Technical_Performance_Agent] Starting analysis...`);
  
  const priorKnowledge = await retrieveAgentKnowledge(
    AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT,
    content.url,
    'technical',
    log
  );
  const knowledgeContext = buildPriorKnowledgeContext(priorKnowledge);
  const context = buildContext(content) + knowledgeContext;
  
  const [staticResults, dynamicResults] = await Promise.all([
    Promise.all([
      runSubagent('Page_Speed_Scorer', getSubagentPromptFromRegistry("Technical_Performance_Agent", "page_speed_scorer"), context, log, undefined, "Technical_Performance_Agent"),
      runSubagent('SEO_Metadata_Inspector', getSubagentPromptFromRegistry("Technical_Performance_Agent", "seo_metadata_inspector"), context, log, undefined, "Technical_Performance_Agent"),
      runSubagent('Content_Markup_Validator', getSubagentPromptFromRegistry("Technical_Performance_Agent", "content_markup_validator"), context, log, undefined, "Technical_Performance_Agent"),
    ]),
    runDynamicSubagentsForAgent("Technical_Performance_Agent", context, "always", log),
  ]);
  
  const [speedResult, seoResult, markupResult] = staticResults;
  const allResults = [...staticResults, ...dynamicResults];

  const aggregated = aggregateSubagentResults(allResults);
  
  const analysisResult: AnalysisSection = {
    ...aggregated,
    subagent_results: allResults,
  };
  
  const metacognition = performMetacognition(
    "Technical_Performance_Agent" as RegisteredAgentName,
    analysisResult,
    allResults,
    { htmlLength: content.html.length, pagesScraped: content.pagesScraped, hasMetadata: !!content.metaDescription }
  );
  analysisResult.metacognition = metacognition;
  log?.(`  [Technical_Performance_Agent] Confidence: ${metacognition.confidence.overallConfidence.toFixed(2)}`);
  
  saveAgentAnalysisResult(AGENT_NAMES.TECHNICAL_PERFORMANCE_AGENT, content.url, analysisResult, log).catch(err => {
    console.error('[Technical_Performance_Agent] Knowledge save failed:', err.message);
  });
  
  learnFromAnalysis("Technical_Performance_Agent", analysisResult, context, log).catch(err => {
    console.error('[Technical_Performance_Agent] Learning failed:', err.message);
  });
  
  try {
    const evolutionService = getEvolutionService();
    evolutionService.recordLearningEvent({
      agentName: "Technical_Performance_Agent",
      eventType: 'analysis_complete',
      details: {
        url: content.url,
        score: analysisResult.score,
        confidence: analysisResult.metacognition?.confidence.overallConfidence,
        dynamicSubagentsUsed: dynamicResults.length
      }
    });
    if (analysisResult.metacognition) {
      evolutionService.updatePerformanceStats("Technical_Performance_Agent", analysisResult, analysisResult.metacognition);
    }
  } catch (error) {
    console.error('[Evolution] Technical_Performance_Agent tracking failed:', error);
  }
  
  log?.(`[Technical_Performance_Agent] COMPLETED - Score: ${aggregated.score}/10 (${dynamicResults.length} dynamic subagents)`);
  
  return analysisResult;
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

export interface ParallelAgentExecutionInfo {
  results: ParallelAgentResults;
  executionStats: {
    visual_design: { source: string; retryAttempts: number; circuitState: string };
    user_experience: { source: string; retryAttempts: number; circuitState: string };
    content_quality: { source: string; retryAttempts: number; circuitState: string };
    technical_performance: { source: string; retryAttempts: number; circuitState: string };
  };
}

function generateCacheKey(url: string, agentName: string): string {
  const urlHash = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
  return `${agentName}:${urlHash}`;
}

export async function runAllAgentsInParallel(
  content: SiteContent,
  log?: LogCallback
): Promise<ParallelAgentResults> {
  
  log?.(`[Benchmarking_Manager] Dispatching 4 Agents in PARALLEL with resilience patterns...`);
  
  const [vaaExecution, unaExecution, csaExecution, tpaExecution] = await Promise.all([
    executeWithFallback(
      'Visual_Aesthetics_Agent',
      () => runVisualAestheticsAgent(content, log),
      generateCacheKey(content.url, 'Visual_Aesthetics_Agent'),
      {},
      log
    ),
    executeWithFallback(
      'UX_Navigation_Agent',
      () => runUXNavigationAgent(content, log),
      generateCacheKey(content.url, 'UX_Navigation_Agent'),
      {},
      log
    ),
    executeWithFallback(
      'Content_Storytelling_Agent',
      () => runContentStorytellingAgent(content, log),
      generateCacheKey(content.url, 'Content_Storytelling_Agent'),
      {},
      log
    ),
    executeWithFallback(
      'Technical_Performance_Agent',
      () => runTechnicalPerformanceAgent(content, log),
      generateCacheKey(content.url, 'Technical_Performance_Agent'),
      {},
      log
    ),
  ]);

  log?.(`[Benchmarking_Manager] Execution sources: VAA=${vaaExecution.source}, UNA=${unaExecution.source}, CSA=${csaExecution.source}, TPA=${tpaExecution.source}`);

  return {
    visual_design: vaaExecution.result,
    user_experience: unaExecution.result,
    content_quality: csaExecution.result,
    technical_performance: tpaExecution.result,
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
  report_metadata?: ReportMetadata;
  executive_summary?: ExecutiveSummary;
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
  councilResult?: CouncilResult;
  prioritized_tasks?: PrioritizedTask[];
  execution_order?: string[];
  completion_criteria?: CompletionCriteria;
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

// ============================================================================
// LLM COUNCIL - 3-STAGE DELIBERATION SYSTEM
// ============================================================================

function buildCouncilContext(
  clientAnalysis: SiteAnalysis,
  competitorAnalyses: SiteAnalysis[]
): string {
  const avgCompetitorScore = competitorAnalyses.length > 0
    ? (competitorAnalyses.reduce((sum, c) => sum + c.overall_score, 0) / competitorAnalyses.length).toFixed(1)
    : 'N/A';
    
  return `
=== CLIENT WEBSITE ANALYSIS ===
URL: ${clientAnalysis.url}
Overall Score: ${clientAnalysis.overall_score}/10 (Competitor avg: ${avgCompetitorScore})

Visual Design: ${clientAnalysis.visual_design.score}/10
- Observations: ${clientAnalysis.visual_design.observations}
- Strengths: ${clientAnalysis.visual_design.strengths.join(', ')}
- Weaknesses: ${clientAnalysis.visual_design.weaknesses.join(', ')}

User Experience: ${clientAnalysis.user_experience.score}/10
- Observations: ${clientAnalysis.user_experience.observations}
- Strengths: ${clientAnalysis.user_experience.strengths.join(', ')}
- Weaknesses: ${clientAnalysis.user_experience.weaknesses.join(', ')}

Content Quality: ${clientAnalysis.content_quality.score}/10
- Observations: ${clientAnalysis.content_quality.observations}
- Strengths: ${clientAnalysis.content_quality.strengths.join(', ')}
- Weaknesses: ${clientAnalysis.content_quality.weaknesses.join(', ')}

Technical Performance: ${clientAnalysis.technical_performance.score}/10
- Observations: ${clientAnalysis.technical_performance.observations}
- Strengths: ${clientAnalysis.technical_performance.strengths.join(', ')}
- Weaknesses: ${clientAnalysis.technical_performance.weaknesses.join(', ')}

=== COMPETITOR COMPARISON ===
${competitorAnalyses.map((c, i) => `
${i + 1}. ${c.name} (${c.url}): ${c.overall_score}/10
   Visual: ${c.visual_design.score}, UX: ${c.user_experience.score}, Content: ${c.content_quality.score}, Tech: ${c.technical_performance.score}
`).join('')}

Analyze this website and identify all issues, opportunities, and recommendations.`;
}

async function runCouncilStage1(
  clientAnalysis: SiteAnalysis,
  competitorAnalyses: SiteAnalysis[],
  log?: LogCallback
): Promise<CouncilOpinion[]> {
  log?.(`[LLM_Council] Stage 1: Gathering initial opinions from 3 personas...`);
  
  const analysisContext = buildCouncilContext(clientAnalysis, competitorAnalyses);
  
  const opinions = await Promise.all(
    (['critic', 'strategist', 'innovator'] as const).map(async (persona) => {
      const personaConfig = COUNCIL_PERSONAS[persona];
      log?.(`[LLM_Council] > [${personaConfig.name}] Analyzing...`);
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: personaConfig.prompt },
            { role: "user", content: analysisContext }
          ],
          temperature: 0.8,
          response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(completion.choices[0].message.content || '{}');
        log?.(`[LLM_Council] > [${personaConfig.name}] Found ${result.findings?.length || 0} issues (confidence: ${result.confidence})`);
        
        return {
          persona,
          personaName: personaConfig.name,
          analysis: result.analysis || '',
          findings: result.findings || [],
          confidence: result.confidence || 0.5
        } as CouncilOpinion;
      } catch (error) {
        log?.(`[LLM_Council] > [${personaConfig.name}] ERROR: ${error}`);
        return {
          persona,
          personaName: personaConfig.name,
          analysis: 'Analysis failed due to error',
          findings: [],
          confidence: 0.5
        } as CouncilOpinion;
      }
    })
  );
  
  return opinions;
}

function shuffleArray(array: number[], seed: number): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface BordaScoreItem {
  issue: string;
  severity: string;
  bordaPoints: number;
  severityWeight: number;
  weightedScore: number;
  sourcePersona: string;
  votes: number;
}

function computeBordaCount(
  opinions: CouncilOpinion[],
  reviews: PeerReview[],
  shuffleMappings: ShuffleMappingEntry[]
): BordaScoreItem[] {
  const SEVERITY_WEIGHTS: Record<string, number> = {
    'CRITICAL': 4,
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
  };
  
  const allFindings: Map<string, BordaScoreItem> = new Map();
  
  opinions.forEach((opinion) => {
    opinion.findings.forEach(finding => {
      const key = finding.issue.toLowerCase().trim();
      const existing = allFindings.get(key);
      
      if (existing) {
        existing.votes++;
      } else {
        allFindings.set(key, {
          issue: finding.issue,
          severity: finding.severity,
          bordaPoints: 0,
          severityWeight: SEVERITY_WEIGHTS[finding.severity] || 1,
          weightedScore: 0,
          sourcePersona: opinion.personaName,
          votes: 1
        });
      }
    });
  });
  
  const personaPointsMap = new Map<number, number>();
  
  reviews.forEach((review, reviewerIndex) => {
    const shuffleMapping = shuffleMappings.find(m => m.reviewerIndex === reviewerIndex);
    if (!shuffleMapping) return;
    
    review.evaluations.forEach(evaluation => {
      const label = evaluation.reviewed.replace('Analysis ', '').trim();
      const originalPersonaIndex = shuffleMapping.mapping[label];
      
      if (originalPersonaIndex !== undefined) {
        const points = 3 - evaluation.rank;
        personaPointsMap.set(
          originalPersonaIndex, 
          (personaPointsMap.get(originalPersonaIndex) || 0) + points
        );
      }
    });
  });
  
  allFindings.forEach((item) => {
    const personaIndex = opinions.findIndex(o => o.personaName === item.sourcePersona);
    const bordaPoints = personaPointsMap.get(personaIndex) || 0;
    item.bordaPoints = bordaPoints;
    item.weightedScore = item.severityWeight * (item.votes + bordaPoints / 3);
  });
  
  const sortedFindings = Array.from(allFindings.values())
    .sort((a, b) => b.weightedScore - a.weightedScore);
  
  return sortedFindings;
}

function assignPriorities(items: BordaScoreItem[]): FinalRankedIssue[] {
  if (items.length === 0) return [];
  
  const maxScore = items[0].weightedScore;
  
  return items.slice(0, 15).map((item) => {
    let priority: 'P0' | 'P1' | 'P2';
    
    if (item.severity === 'CRITICAL' || item.weightedScore >= maxScore * 0.8) {
      priority = 'P0';
    } else if (item.severity === 'HIGH' || item.weightedScore >= maxScore * 0.5) {
      priority = 'P1';
    } else {
      priority = 'P2';
    }
    
    return {
      issue: item.issue,
      priority,
      votes: item.votes,
      severity: item.severity
    };
  });
}

async function runCouncilStage2(
  opinions: CouncilOpinion[],
  log?: LogCallback
): Promise<Stage2Result> {
  log?.(`[LLM_Council] Stage 2: Anonymous peer review...`);
  
  const shuffleMappings: ShuffleMappingEntry[] = [];
  
  const reviews = await Promise.all(
    opinions.map(async (reviewerOpinion, reviewerIndex) => {
      const persona = reviewerOpinion.persona;
      const personaConfig = COUNCIL_PERSONAS[persona];
      
      const shuffledIndices = shuffleArray([0, 1, 2], reviewerIndex);
      const labels = ['A', 'B', 'C'];
      
      const anonymousAnalyses = shuffledIndices.map((origIndex, newIndex) => ({
        label: labels[newIndex],
        originalIndex: origIndex,
        analysis: opinions[origIndex].analysis,
        findings: opinions[origIndex].findings
      }));
      
      const mapping: { [label: string]: number } = {};
      anonymousAnalyses.forEach(a => {
        mapping[a.label] = a.originalIndex;
      });
      shuffleMappings.push({ reviewerIndex, mapping });
      
      const reviewContext = `Review these 3 anonymous analyses:

${anonymousAnalyses.map(a => `
=== Analysis ${a.label} ===
${a.analysis}

Findings:
${a.findings.map((f: CouncilFinding) => `- [${f.severity}] ${f.issue}: ${f.impact}`).join('\n')}
`).join('\n')}

Your own analysis was one of these, but evaluate ALL objectively.`;
      
      log?.(`[LLM_Council] > [${personaConfig.name}] Reviewing peers...`);
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: PEER_REVIEW_PROMPT },
            { role: "user", content: reviewContext }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(completion.choices[0].message.content || '{}');
        
        return {
          reviewer: persona,
          evaluations: result.evaluations || [],
          selfRank: result.selfRank || 2,
          rationale: result.rationale || ''
        } as PeerReview;
      } catch (error) {
        log?.(`[LLM_Council] > [${personaConfig.name}] Review ERROR: ${error}`);
        return {
          reviewer: persona,
          evaluations: [],
          selfRank: 2,
          rationale: 'Review failed due to error'
        } as PeerReview;
      }
    })
  );
  
  return { reviews, shuffleMappings };
}

async function runCouncilStage3(
  opinions: CouncilOpinion[],
  reviews: PeerReview[],
  shuffleMappings: ShuffleMappingEntry[],
  log?: LogCallback
): Promise<Omit<CouncilResult, 'stage1Opinions' | 'stage2Reviews'>> {
  log?.(`[LLM_Council] Stage 3: Chairman synthesis with Borda Count...`);
  
  const bordaItems = computeBordaCount(opinions, reviews, shuffleMappings);
  const preComputedRanking = assignPriorities(bordaItems);
  
  log?.(`[LLM_Council] Borda Count computed: ${preComputedRanking.length} prioritized issues`);
  
  const issueCountByPersona = new Map<string, Set<number>>();
  opinions.forEach((opinion, personaIndex) => {
    opinion.findings.forEach(finding => {
      const key = finding.issue.toLowerCase().trim();
      if (!issueCountByPersona.has(key)) {
        issueCountByPersona.set(key, new Set());
      }
      issueCountByPersona.get(key)!.add(personaIndex);
    });
  });
  
  const totalUniqueIssues = issueCountByPersona.size;
  const issuesInMultiplePersonas = Array.from(issueCountByPersona.values())
    .filter(personaSet => personaSet.size >= 2).length;
  
  const consensusScore = totalUniqueIssues > 0 
    ? Math.round((issuesInMultiplePersonas / totalUniqueIssues) * 100) / 100 
    : 0;
  
  const chairmanContext = `
=== PRE-COMPUTED BORDA COUNT RANKINGS ===
${preComputedRanking.map((item, i) => 
  `${i + 1}. [${item.priority}] ${item.issue} (${item.severity}, ${item.votes} mentions)`
).join('\n')}

=== STAGE 1: INITIAL OPINIONS ===
${opinions.map(op => `
[${op.personaName}] (Confidence: ${op.confidence})
Key findings: ${op.findings.slice(0, 3).map(f => f.issue).join(', ')}
`).join('\n')}

=== STAGE 2: PEER REVIEW SUMMARY ===
${reviews.map(r => `
[${COUNCIL_PERSONAS[r.reviewer].name}]: ${r.rationale}
`).join('\n')}

Based on the pre-computed Borda Count rankings above, synthesize a final verdict.
Identify any dissenting opinions where reviewers disagreed.
The rankings have already been computed programmatically - use them as the authoritative priority list.`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CHAIRMAN_PROMPT },
        { role: "user", content: chairmanContext }
      ],
      temperature: 0.6,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    log?.(`[LLM_Council] Chairman verdict: Consensus ${consensusScore}, ${preComputedRanking.length} prioritized issues`);
    
    return {
      consensusScore: consensusScore,
      finalRanking: preComputedRanking,
      chairmanVerdict: result.chairmanVerdict || '',
      dissentingOpinions: result.dissentingOpinions || []
    };
  } catch (error) {
    log?.(`[LLM_Council] Chairman ERROR: ${error}`);
    return {
      consensusScore: consensusScore,
      finalRanking: preComputedRanking,
      chairmanVerdict: 'Chairman synthesis failed due to error',
      dissentingOpinions: []
    };
  }
}

export async function runLLMCouncil(
  clientAnalysis: SiteAnalysis,
  competitorAnalyses: SiteAnalysis[],
  log?: LogCallback
): Promise<CouncilResult> {
  log?.(`[LLM_Council] Initiating 3-stage deliberation...`);
  
  const stage1Opinions = await runCouncilStage1(clientAnalysis, competitorAnalyses, log);
  
  const { reviews: stage2Reviews, shuffleMappings } = await runCouncilStage2(stage1Opinions, log);
  
  const stage3Result = await runCouncilStage3(stage1Opinions, stage2Reviews, shuffleMappings, log);
  
  log?.(`[LLM_Council] Deliberation complete. Final consensus: ${stage3Result.consensusScore}`);
  
  return {
    ...stage3Result,
    stage1Opinions,
    stage2Reviews
  };
}

// ============================================================================
// REPORT ENHANCEMENT FUNCTIONS
// ============================================================================

export function generateReportMetadata(
  clientUrl: string,
  competitorCount: number,
  councilConsensus: number
): ReportMetadata {
  return {
    generated_at: new Date().toISOString(),
    client_url: clientUrl,
    competitors_analyzed: competitorCount,
    council_consensus: councilConsensus
  };
}

export function generateExecutiveSummary(
  clientScore: number,
  competitorScores: number[],
  councilResult?: CouncilResult
): ExecutiveSummary {
  const avgCompetitor = competitorScores.length > 0
    ? competitorScores.reduce((a, b) => a + b, 0) / competitorScores.length
    : 0;
  
  const diff = clientScore - avgCompetitor;
  const diffStr = diff >= 0 
    ? `+${diff.toFixed(1)} points above average`
    : `${diff.toFixed(1)} points below average`;
  
  const criticalCount = councilResult?.finalRanking.filter(
    r => r.priority === 'P0'
  ).length || 0;
  
  let conversionLoss = "0-10%";
  if (clientScore < 5) {
    conversionLoss = "45-60%";
  } else if (clientScore < 6) {
    conversionLoss = "35-45%";
  } else if (clientScore < 7) {
    conversionLoss = "20-35%";
  } else if (clientScore < 8) {
    conversionLoss = "10-20%";
  }
  
  return {
    overall_score: clientScore,
    vs_competitors: diffStr,
    critical_issues: criticalCount,
    estimated_conversion_loss: conversionLoss
  };
}

export function generatePrioritizedTasks(
  councilResult: CouncilResult
): { tasks: PrioritizedTask[]; executionOrder: string[] } {
  const tasks: PrioritizedTask[] = [];
  const counters: { P0: number; P1: number; P2: number } = { P0: 0, P1: 0, P2: 0 };
  
  const getDepartment = (issue: string): string => {
    const lower = issue.toLowerCase();
    if (lower.includes('cta') || lower.includes('button') || lower.includes('navigation') || lower.includes('ux') || lower.includes('conversion')) {
      return 'UX/Conversion';
    }
    if (lower.includes('color') || lower.includes('design') || lower.includes('visual') || lower.includes('typography')) {
      return 'Visual Design';
    }
    if (lower.includes('content') || lower.includes('copy') || lower.includes('message') || lower.includes('brand')) {
      return 'Content Strategy';
    }
    if (lower.includes('seo') || lower.includes('speed') || lower.includes('performance') || lower.includes('technical')) {
      return 'Technical';
    }
    return 'General';
  };
  
  const getEstimatedHours = (priority: string): number => {
    switch (priority) {
      case 'P0': return 4;
      case 'P1': return 8;
      case 'P2': return 16;
      default: return 8;
    }
  };
  
  councilResult.finalRanking.forEach((ranking) => {
    const priority = ranking.priority;
    counters[priority]++;
    const id = `${priority}-${String(counters[priority]).padStart(3, '0')}`;
    
    const priorityLabel = priority === 'P0' ? 'P0-CRITICAL' 
      : priority === 'P1' ? 'P1-HIGH' 
      : 'P2-MEDIUM';
    
    const findingDetails = councilResult.stage1Opinions
      .flatMap(op => op.findings)
      .find(f => f.issue.toLowerCase().trim() === ranking.issue.toLowerCase().trim());
    
    tasks.push({
      id,
      priority: priorityLabel,
      department: getDepartment(ranking.issue),
      title: ranking.issue,
      problem: findingDetails?.impact || `Issue identified: ${ranking.issue}`,
      solution: `Address ${ranking.issue} to improve ${getDepartment(ranking.issue).toLowerCase()} performance`,
      success_metrics: [
        `${ranking.issue} resolved`,
        `Score improvement in related area`
      ],
      estimated_hours: getEstimatedHours(priority),
      replit_code: null
    });
  });
  
  const executionOrder = tasks.map(t => t.id);
  
  return { tasks, executionOrder };
}

export function generateCompletionCriteria(): CompletionCriteria {
  return {
    phase_0: "All P0-CRITICAL tasks completed and verified",
    phase_1: "P1-HIGH tasks completed, baseline metrics established",
    phase_2: "P2-MEDIUM tasks completed, differentiators implemented"
  };
}

// ============================================================================
// RESILIENCE API EXPORTS
// ============================================================================

export function getAgentResilienceStats(): ResilienceStats {
  return getResilienceStats();
}

export function getCircuitBreakerSnapshots(): CircuitBreakerSnapshot[] {
  return getAllCircuitBreakers();
}

export function resetAgentCircuitBreakers(): void {
  resetAllCircuitBreakers();
}

export function clearAgentResilienceCache(): void {
  clearResilienceCache();
}
