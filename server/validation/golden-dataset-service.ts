import { storage } from "../storage";
import { 
  fetchSiteContent, 
  runAllAgentsInParallel,
  calculateOverallScore, 
  type LogCallback 
} from "../agent-engine";
import type { SiteExpectations, GoldenDatasetSite, ValidationRun, InsertValidationResult } from "@shared/schema";

export interface ValidationRunResult {
  run: ValidationRun;
  results: {
    siteId: number;
    siteName: string;
    siteUrl: string;
    categories: {
      category: string;
      expectedMin: number;
      expectedMax: number;
      actualScore: number;
      tolerance: number;
      passed: boolean;
      deviation: number;
    }[];
    overallPassed: boolean;
    overallScore: number;
  }[];
  summary: {
    totalSites: number;
    passedSites: number;
    failedSites: number;
    passRate: number;
    totalCategories: number;
    passedCategories: number;
    failedCategories: number;
  };
}

const CATEGORIES = ['visual_design', 'user_experience', 'content_quality', 'technical_performance'] as const;

function calculateDeviation(actual: number, min: number, max: number): number {
  if (actual >= min && actual <= max) {
    return 0;
  }
  if (actual < min) {
    return min - actual;
  }
  return actual - max;
}

function checkWithinTolerance(actual: number, min: number, max: number, tolerance: number): boolean {
  return actual >= (min - tolerance) && actual <= (max + tolerance);
}

export async function runGoldenDatasetValidation(
  options: {
    toleranceOverride?: number;
    initiatedBy?: string;
    log?: LogCallback;
  } = {}
): Promise<ValidationRunResult> {
  const { toleranceOverride, initiatedBy, log } = options;
  const defaultTolerance = toleranceOverride ?? 1.0;

  log?.(`[Validation] Starting golden dataset validation run...`);
  log?.(`[Validation] Default tolerance: ${defaultTolerance}`);

  const sites = await storage.listGoldenDatasetSites(true);
  
  if (sites.length === 0) {
    log?.(`[Validation] No golden dataset sites configured. Aborting.`);
    throw new Error("No golden dataset sites configured");
  }

  log?.(`[Validation] Found ${sites.length} golden dataset sites to validate`);

  const run = await storage.createValidationRun({
    status: "running",
    totalSites: sites.length,
    passedSites: 0,
    failedSites: 0,
    defaultTolerance,
    initiatedBy: initiatedBy ?? null,
  });

  log?.(`[Validation] Created validation run #${run.id}`);

  const results: ValidationRunResult['results'] = [];
  let totalPassedSites = 0;
  let totalFailedSites = 0;
  let totalCategories = 0;
  let passedCategories = 0;
  let failedCategories = 0;

  for (const site of sites) {
    log?.(`\n[Validation] Analyzing ${site.displayName} (${site.url})...`);
    
    try {
      const content = await fetchSiteContent(site.url, log);
      const analysis = await runAllAgentsInParallel(content, log);
      const overallScore = calculateOverallScore(analysis);

      const scores: Record<string, number> = {
        visual_design: analysis.visual_design.score,
        user_experience: analysis.user_experience.score,
        content_quality: analysis.content_quality.score,
        technical_performance: analysis.technical_performance.score,
      };

      const categoryResults: ValidationRunResult['results'][0]['categories'] = [];
      let siteOverallPassed = true;

      for (const category of CATEGORIES) {
        const expectation = site.expectations[category];
        const actualScore = scores[category];
        const tolerance = expectation.tolerance ?? defaultTolerance;
        const deviation = calculateDeviation(actualScore, expectation.min, expectation.max);
        const passed = checkWithinTolerance(actualScore, expectation.min, expectation.max, tolerance);

        totalCategories++;
        if (passed) {
          passedCategories++;
        } else {
          failedCategories++;
          siteOverallPassed = false;
        }

        categoryResults.push({
          category,
          expectedMin: expectation.min,
          expectedMax: expectation.max,
          actualScore,
          tolerance,
          passed,
          deviation,
        });

        const validationResult: InsertValidationResult = {
          runId: run.id,
          siteId: site.id,
          siteUrl: site.url,
          siteName: site.displayName,
          category,
          expectedMin: expectation.min,
          expectedMax: expectation.max,
          actualScore,
          tolerance,
          passed: passed ? 1 : 0,
          deviation,
        };

        await storage.addValidationResult(validationResult);

        const status = passed ? '✓' : '✗';
        log?.(`[Validation]   ${status} ${category}: ${actualScore.toFixed(1)} (expected ${expectation.min}-${expectation.max}, tolerance ±${tolerance})`);
      }

      if (siteOverallPassed) {
        totalPassedSites++;
        log?.(`[Validation] ${site.displayName}: PASSED (overall score: ${overallScore.toFixed(1)})`);
      } else {
        totalFailedSites++;
        log?.(`[Validation] ${site.displayName}: FAILED (overall score: ${overallScore.toFixed(1)})`);
      }

      results.push({
        siteId: site.id,
        siteName: site.displayName,
        siteUrl: site.url,
        categories: categoryResults,
        overallPassed: siteOverallPassed,
        overallScore,
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      log?.(`[Validation] ERROR analyzing ${site.displayName}: ${errorMsg}`);
      
      totalFailedSites++;
      
      for (const category of CATEGORIES) {
        const expectation = site.expectations[category];
        const tolerance = expectation.tolerance ?? defaultTolerance;
        
        await storage.addValidationResult({
          runId: run.id,
          siteId: site.id,
          siteUrl: site.url,
          siteName: site.displayName,
          category,
          expectedMin: expectation.min,
          expectedMax: expectation.max,
          actualScore: 0,
          tolerance,
          passed: 0,
          deviation: expectation.min,
        });

        totalCategories++;
        failedCategories++;
      }

      results.push({
        siteId: site.id,
        siteName: site.displayName,
        siteUrl: site.url,
        categories: CATEGORIES.map(category => ({
          category,
          expectedMin: site.expectations[category].min,
          expectedMax: site.expectations[category].max,
          actualScore: 0,
          tolerance: site.expectations[category].tolerance ?? defaultTolerance,
          passed: false,
          deviation: site.expectations[category].min,
        })),
        overallPassed: false,
        overallScore: 0,
      });
    }
  }

  const updatedRun = await storage.updateValidationRun(run.id, {
    status: totalFailedSites === 0 ? "passed" : "failed",
    passedSites: totalPassedSites,
    failedSites: totalFailedSites,
    completedAt: new Date(),
  });

  const passRate = sites.length > 0 ? (totalPassedSites / sites.length) * 100 : 0;

  log?.(`\n[Validation] ========================================`);
  log?.(`[Validation] Validation run #${run.id} complete`);
  log?.(`[Validation] Status: ${updatedRun.status.toUpperCase()}`);
  log?.(`[Validation] Sites: ${totalPassedSites}/${sites.length} passed (${passRate.toFixed(1)}%)`);
  log?.(`[Validation] Categories: ${passedCategories}/${totalCategories} passed`);
  log?.(`[Validation] ========================================`);

  return {
    run: updatedRun,
    results,
    summary: {
      totalSites: sites.length,
      passedSites: totalPassedSites,
      failedSites: totalFailedSites,
      passRate,
      totalCategories,
      passedCategories,
      failedCategories,
    },
  };
}

export async function seedGoldenDataset(): Promise<void> {
  const goldenSites: Array<{
    url: string;
    displayName: string;
    category: string;
    expectations: SiteExpectations;
  }> = [
    {
      url: "https://stripe.com",
      displayName: "Stripe",
      category: "fintech",
      expectations: {
        visual_design: { min: 7.0, max: 9.5 },
        user_experience: { min: 7.0, max: 9.5 },
        content_quality: { min: 7.0, max: 9.0 },
        technical_performance: { min: 7.0, max: 9.5 },
      },
    },
    {
      url: "https://shopify.com",
      displayName: "Shopify",
      category: "ecommerce",
      expectations: {
        visual_design: { min: 7.0, max: 9.5 },
        user_experience: { min: 7.0, max: 9.5 },
        content_quality: { min: 7.0, max: 9.0 },
        technical_performance: { min: 6.5, max: 9.0 },
      },
    },
    {
      url: "https://linear.app",
      displayName: "Linear",
      category: "saas",
      expectations: {
        visual_design: { min: 7.5, max: 9.5 },
        user_experience: { min: 7.5, max: 9.5 },
        content_quality: { min: 6.5, max: 9.0 },
        technical_performance: { min: 7.0, max: 9.5 },
      },
    },
    {
      url: "https://notion.so",
      displayName: "Notion",
      category: "saas",
      expectations: {
        visual_design: { min: 7.0, max: 9.0 },
        user_experience: { min: 7.0, max: 9.0 },
        content_quality: { min: 7.0, max: 9.0 },
        technical_performance: { min: 6.5, max: 9.0 },
      },
    },
    {
      url: "https://vercel.com",
      displayName: "Vercel",
      category: "saas",
      expectations: {
        visual_design: { min: 7.5, max: 9.5 },
        user_experience: { min: 7.0, max: 9.0 },
        content_quality: { min: 7.0, max: 9.0 },
        technical_performance: { min: 7.5, max: 9.5 },
      },
    },
  ];

  for (const site of goldenSites) {
    await storage.upsertGoldenDatasetSite(site);
  }
}

export async function getValidationRunWithResults(runId: number): Promise<{
  run: ValidationRun;
  results: Array<{
    siteId: number;
    siteName: string;
    siteUrl: string;
    categories: Array<{
      category: string;
      expectedMin: number;
      expectedMax: number;
      actualScore: number;
      tolerance: number;
      passed: boolean;
      deviation: number;
    }>;
    overallPassed: boolean;
  }>;
} | null> {
  const run = await storage.getValidationRun(runId);
  if (!run) return null;

  const rawResults = await storage.getValidationResults(runId);
  
  const siteMap = new Map<number, {
    siteId: number;
    siteName: string;
    siteUrl: string;
    categories: Array<{
      category: string;
      expectedMin: number;
      expectedMax: number;
      actualScore: number;
      tolerance: number;
      passed: boolean;
      deviation: number;
    }>;
    overallPassed: boolean;
  }>();

  for (const result of rawResults) {
    if (!siteMap.has(result.siteId)) {
      siteMap.set(result.siteId, {
        siteId: result.siteId,
        siteName: result.siteName,
        siteUrl: result.siteUrl,
        categories: [],
        overallPassed: true,
      });
    }
    
    const siteResult = siteMap.get(result.siteId)!;
    const passed = result.passed === 1;
    
    siteResult.categories.push({
      category: result.category,
      expectedMin: result.expectedMin,
      expectedMax: result.expectedMax,
      actualScore: result.actualScore,
      tolerance: result.tolerance,
      passed,
      deviation: result.deviation,
    });
    
    if (!passed) {
      siteResult.overallPassed = false;
    }
  }

  return {
    run,
    results: Array.from(siteMap.values()),
  };
}
