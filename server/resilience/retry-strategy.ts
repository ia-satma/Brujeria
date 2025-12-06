export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

export type LogCallback = (message: string) => void;

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

const RETRYABLE_ERROR_PATTERNS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'socket hang up',
  'network',
  'timeout',
  '429',
  '500',
  '502',
  '503',
  '504',
  'rate limit',
  'too many requests',
  'temporarily unavailable',
];

function isRetryableError(error: Error, customPatterns?: string[]): boolean {
  const patterns = customPatterns || RETRYABLE_ERROR_PATTERNS;
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  return patterns.some((pattern) => {
    const p = pattern.toLowerCase();
    return errorMessage.includes(p) || errorName.includes(p);
  });
}

function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1);
  
  return Math.max(0, Math.round(cappedDelay + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  log?: LogCallback
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < fullConfig.maxAttempts) {
        if (!isRetryableError(lastError, fullConfig.retryableErrors)) {
          log?.(
            `[Retry] Attempt ${attempt}/${fullConfig.maxAttempts} failed with non-retryable error: ${lastError.message}`
          );
          break;
        }

        const delay = calculateDelay(attempt, fullConfig);
        totalDelayMs += delay;
        log?.(
          `[Retry] Attempt ${attempt}/${fullConfig.maxAttempts} failed, retrying in ${delay}ms: ${lastError.message}`
        );
        await sleep(delay);
      } else {
        log?.(
          `[Retry] All ${fullConfig.maxAttempts} attempts failed: ${lastError.message}`
        );
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxAttempts,
    totalDelayMs,
  };
}

export async function retryWithBackoffOrThrow<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  log?: LogCallback
): Promise<T> {
  const result = await retryWithBackoff(fn, config, log);
  if (result.success && result.result !== undefined) {
    return result.result;
  }
  throw result.error || new Error('Retry failed without error');
}

export class RetryableOperation<T> {
  private config: RetryConfig;
  private log?: LogCallback;

  constructor(config: Partial<RetryConfig> = {}, log?: LogCallback) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log = log;
  }

  async execute(fn: () => Promise<T>): Promise<RetryResult<T>> {
    return retryWithBackoff(fn, this.config, this.log);
  }

  async executeOrThrow(fn: () => Promise<T>): Promise<T> {
    return retryWithBackoffOrThrow(fn, this.config, this.log);
  }

  withConfig(config: Partial<RetryConfig>): RetryableOperation<T> {
    return new RetryableOperation({ ...this.config, ...config }, this.log);
  }
}

export const RETRY_PRESETS = {
  aggressive: {
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 15000,
    backoffMultiplier: 1.5,
    jitterFactor: 0.2,
  } as Partial<RetryConfig>,

  conservative: {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 3,
    jitterFactor: 0.1,
  } as Partial<RetryConfig>,

  llmApi: {
    maxAttempts: 4,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterFactor: 0.15,
    retryableErrors: ['429', 'rate limit', 'timeout', '500', '502', '503'],
  } as Partial<RetryConfig>,

  httpFetch: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'socket hang up'],
  } as Partial<RetryConfig>,
};
