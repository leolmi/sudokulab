/**
 * Semaforo asincrono con limite di concorrenza e timeout di coda.
 *
 * `acquire(timeoutMs)` ritorna una Promise che si risolve quando uno slot
 * è disponibile; se la coda non viene servita entro `timeoutMs` la Promise
 * viene rigettata e lo slot non viene consumato.
 *
 * Il chiamante DEVE invocare `release()` solo dopo un `acquire()` che ha
 * successo (finally block), altrimenti lo slot resta bloccato.
 */
interface Waiter {
  resolve: () => void;
  reject: (err: Error) => void;
  timer?: NodeJS.Timeout;
}

export class Semaphore {
  private available: number;
  private readonly waiters: Waiter[] = [];

  constructor(private readonly max: number) {
    if (max < 1) throw new Error(`Semaphore max must be >= 1, got ${max}`);
    this.available = max;
  }

  get queueLength(): number {
    return this.waiters.length;
  }

  get inUse(): number {
    return this.max - this.available;
  }

  get capacity(): number {
    return this.max;
  }

  acquire(timeoutMs?: number): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject };
      if (timeoutMs && timeoutMs > 0) {
        waiter.timer = setTimeout(() => {
          const idx = this.waiters.indexOf(waiter);
          if (idx >= 0) {
            this.waiters.splice(idx, 1);
            reject(new SemaphoreTimeoutError(timeoutMs));
          }
        }, timeoutMs);
      }
      this.waiters.push(waiter);
    });
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) {
      if (next.timer) clearTimeout(next.timer);
      next.resolve();
    } else if (this.available < this.max) {
      this.available++;
    }
  }
}

export class SemaphoreTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`semaphore acquire timed out after ${timeoutMs}ms`);
    this.name = 'SemaphoreTimeoutError';
  }
}
