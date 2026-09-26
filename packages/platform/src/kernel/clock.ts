/**
 * Source of the current time.
 * Domain and application code depend on this port instead of the global Date,
 * so time-dependent behavior is deterministic in tests.
 */
export interface Clock {
  /** Returns a new Date on every call; callers may not observe each other's mutations. */
  now(): Date;
}

/** The only sanctioned reader of the system clock. Wired in composition roots. */
export const systemClock: Clock = Object.freeze({
  now: (): Date => new Date(),
});

/** Test clock that only moves when told to. Moves to @aureon/testing in M1.4. */
export class ManualClock implements Clock {
  #epochMs: number;

  constructor(start: Date) {
    const epochMs = start.getTime();
    if (Number.isNaN(epochMs)) {
      throw new RangeError('ManualClock requires a valid start date');
    }
    this.#epochMs = epochMs;
  }

  now(): Date {
    return new Date(this.#epochMs);
  }

  /** Moves time forward. Moving backwards is rejected: expiry logic assumes monotonic time. */
  advanceBy(milliseconds: number): void {
    if (!Number.isFinite(milliseconds) || milliseconds < 0) {
      throw new RangeError('ManualClock can only advance by a finite, non-negative duration');
    }
    this.#epochMs += milliseconds;
  }
}
