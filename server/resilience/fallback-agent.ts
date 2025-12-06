import type { AnalysisSection, SubAgentResult } from '../agent-engine';
import { CircuitBreakerOpenError, getCircuitBreaker, getAllCircuitBreakers, type CircuitBreakerSnapshot } from './circuit-breaker';
import { retryWithBackoff, RETRY_PRESETS, type RetryConfig } from './retry-strategy';

export type LogCallback = (message: string) => void;

export interface FallbackConfig {
  useFallback: boolean;
  fallbackTimeout: number;
  retryConfig: Partial<RetryConfig>;
}

export interface AgentExecutionResult<T> {
  result: T;
  source: 'primary' | 'fallback' | 'cached';
  executionTimeMs: number;
  retryAttempts: number;
  circuitState: string;
}

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  useFallback: true,
  fallbackTimeout: 30000,
  retryConfig: RETRY_PRESETS.llmApi,
};

function createFallbackAnalysisSection(
  agentName: string,
  error: Error
): AnalysisSection {
  return {
    observations: `Analysis could not be completed due to service unavailability. The ${agentName} encountered an error: ${error.message}. Please retry later for a complete analysis.`,
    strengths: [],
    weaknesses: ['Unable to analyze due to service disruption'],
    score: 0,
    subagent_results: [
      {
        name: 'Fallback_Handler',
        finding: `Service temporarily unavailable for ${agentName}`,
        score: 0,
        details: [
          'Primary agent failed to complete analysis',
          'Circuit breaker may be active',
          'Retry later for complete results',
        ],
      },
    ],
  };
}

function createFallbackSubAgentResult(
  subagentName: string,
  error: Error
): SubAgentResult {
  return {
    name: subagentName,
    finding: `Analysis unavailable: ${error.message}`,
    score: 5,
    details: [
      'Subagent analysis could not be completed',
      'Using neutral fallback score',
      'Results may be incomplete',
    ],
  };
}

const analysisCache = new Map<string, { result: AnalysisSection; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedAnalysis(cacheKey: string): AnalysisSection | null {
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }
  return null;
}

function setCachedAnalysis(cacheKey: string, result: AnalysisSection): void {
  analysisCache.set(cacheKey, { result, timestamp: Date.now() });
}

export async function executeWithFallback<T extends AnalysisSection>(
  agentName: string,
  primaryFn: () => Promise<T>,
  cacheKey: string,
  config: Partial<FallbackConfig> = {},
  log?: LogCallback
): Promise<AgentExecutionResult<T>> {
  const fullConfig = { ...DEFAULT_FALLBACK_CONFIG, ...config };
  const circuitBreaker = getCircuitBreaker(agentName);
  const startTime = Date.now();
  let retryAttempts = 0;

  const executeWithRetry = async (): Promise<T> => {
    const retryResult = await retryWithBackoff(primaryFn, fullConfig.retryConfig, log);
    retryAttempts = retryResult.attempts;
    
    if (retryResult.success && retryResult.result) {
      return retryResult.result;
    }
    
    throw retryResult.error || new Error('Unknown error during retry');
  };

  try {
    const result = await circuitBreaker.execute(executeWithRetry);
    setCachedAnalysis(cacheKey, result);
    
    return {
      result,
      source: 'primary',
      executionTimeMs: Date.now() - startTime,
      retryAttempts,
      circuitState: circuitBreaker.getState(),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    log?.(`[FallbackAgent:${agentName}] Primary execution failed: ${err.message}`);

    if (fullConfig.useFallback) {
      const cached = getCachedAnalysis(cacheKey);
      if (cached) {
        log?.(`[FallbackAgent:${agentName}] Using cached result`);
        return {
          result: cached as T,
          source: 'cached',
          executionTimeMs: Date.now() - startTime,
          retryAttempts,
          circuitState: circuitBreaker.getState(),
        };
      }

      log?.(`[FallbackAgent:${agentName}] Using fallback analysis`);
      const fallbackResult = createFallbackAnalysisSection(agentName, err) as T;
      
      return {
        result: fallbackResult,
        source: 'fallback',
        executionTimeMs: Date.now() - startTime,
        retryAttempts,
        circuitState: circuitBreaker.getState(),
      };
    }

    throw err;
  }
}

export async function executeSubagentWithFallback(
  subagentName: string,
  parentAgentName: string,
  primaryFn: () => Promise<SubAgentResult>,
  config: Partial<FallbackConfig> = {},
  log?: LogCallback
): Promise<SubAgentResult> {
  const fullConfig = { ...DEFAULT_FALLBACK_CONFIG, ...config };
  const circuitKey = `${parentAgentName}:${subagentName}`;
  const circuitBreaker = getCircuitBreaker(circuitKey, {
    failureThreshold: 3,
    timeout: 30000,
  });

  const executeWithRetry = async (): Promise<SubAgentResult> => {
    const retryResult = await retryWithBackoff(primaryFn, {
      ...RETRY_PRESETS.llmApi,
      maxAttempts: 2,
    }, log);
    
    if (retryResult.success && retryResult.result) {
      return retryResult.result;
    }
    
    throw retryResult.error || new Error('Unknown error during subagent retry');
  };

  try {
    return await circuitBreaker.execute(executeWithRetry);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    if (error instanceof CircuitBreakerOpenError) {
      log?.(`[FallbackSubagent:${subagentName}] Circuit breaker open, using fallback`);
    } else {
      log?.(`[FallbackSubagent:${subagentName}] Execution failed: ${err.message}`);
    }

    if (fullConfig.useFallback) {
      return createFallbackSubAgentResult(subagentName, err);
    }

    throw err;
  }
}

export interface ResilienceStats {
  circuitBreakers: Array<{
    name: string;
    state: string;
    failures: number;
    successes: number;
    totalCalls: number;
  }>;
  cacheSize: number;
  cacheEntries: string[];
}

export function getResilienceStats(): ResilienceStats {
  const snapshots = getAllCircuitBreakers();
  
  return {
    circuitBreakers: snapshots.map((s: CircuitBreakerSnapshot) => ({
      name: s.name,
      state: s.state,
      failures: s.stats.failures,
      successes: s.stats.successes,
      totalCalls: s.stats.totalCalls,
    })),
    cacheSize: analysisCache.size,
    cacheEntries: Array.from(analysisCache.keys()),
  };
}

export function clearResilienceCache(): void {
  analysisCache.clear();
  console.log('[Resilience] Cache cleared');
}
