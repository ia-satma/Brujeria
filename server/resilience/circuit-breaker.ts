export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  halfOpenMaxCalls: number;
}

export interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  consecutiveSuccesses: number;
  totalCalls: number;
  totalFailures: number;
  lastStateChange: number;
}

export interface CircuitBreakerSnapshot {
  name: string;
  state: CircuitState;
  stats: CircuitStats;
  config: CircuitBreakerConfig;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 60000,
  halfOpenMaxCalls: 3,
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    lastFailureTime: null,
    consecutiveSuccesses: 0,
    totalCalls: 0,
    totalFailures: 0,
    lastStateChange: Date.now(),
  };
  private halfOpenCalls = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new CircuitBreakerOpenError(
        `Circuit breaker '${this.name}' is OPEN. Will retry after ${this.getRemainingTimeout()}ms`
      );
    }

    this.stats.totalCalls++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN');
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }

    return false;
  }

  private shouldAttemptReset(): boolean {
    if (!this.stats.lastFailureTime) return true;
    return Date.now() - this.stats.lastFailureTime >= this.config.timeout;
  }

  private getRemainingTimeout(): number {
    if (!this.stats.lastFailureTime) return 0;
    const elapsed = Date.now() - this.stats.lastFailureTime;
    return Math.max(0, this.config.timeout - elapsed);
  }

  private onSuccess(): void {
    this.stats.successes++;
    this.stats.consecutiveSuccesses++;
    this.stats.failures = 0;

    if (this.state === 'HALF_OPEN') {
      if (this.stats.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.stats.failures++;
    this.stats.totalFailures++;
    this.stats.consecutiveSuccesses = 0;
    this.stats.lastFailureTime = Date.now();

    if (this.state === 'CLOSED') {
      if (this.stats.failures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    } else if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stats.lastStateChange = Date.now();

    if (newState === 'HALF_OPEN') {
      this.halfOpenCalls = 0;
    }

    if (newState === 'CLOSED') {
      this.stats.failures = 0;
      this.stats.consecutiveSuccesses = 0;
    }

    console.log(
      `[CircuitBreaker:${this.name}] State transition: ${oldState} -> ${newState}`
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getSnapshot(): CircuitBreakerSnapshot {
    return {
      name: this.name,
      state: this.state,
      stats: { ...this.stats },
      config: { ...this.config },
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      consecutiveSuccesses: 0,
      totalCalls: 0,
      totalFailures: 0,
      lastStateChange: Date.now(),
    };
    this.halfOpenCalls = 0;
    console.log(`[CircuitBreaker:${this.name}] Reset to CLOSED state`);
  }

  forceOpen(): void {
    this.transitionTo('OPEN');
    this.stats.lastFailureTime = Date.now();
  }

  forceClosed(): void {
    this.transitionTo('CLOSED');
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name)!;
}

export function getAllCircuitBreakers(): CircuitBreakerSnapshot[] {
  return Array.from(circuitBreakers.values()).map((cb) => cb.getSnapshot());
}

export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((cb) => cb.reset());
}
