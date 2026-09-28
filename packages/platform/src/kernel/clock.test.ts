import { describe, expect, it } from 'vitest';
import { ManualClock, systemClock } from './clock.js';

describe('systemClock', () => {
  it('reports the current system time', () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});

describe('ManualClock', () => {
  const start = new Date('2026-09-26T09:00:00.000Z');

  it('returns the start time until advanced', () => {
    const clock = new ManualClock(start);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('advances by the given duration', () => {
    const clock = new ManualClock(start);
    clock.advanceBy(90_000);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:01:30.000Z');
  });

  it('is not affected by callers mutating returned dates', () => {
    const clock = new ManualClock(start);
    clock.now().setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('is not affected by callers mutating the start date', () => {
    const mutableStart = new Date(start);
    const clock = new ManualClock(mutableStart);
    mutableStart.setUTCFullYear(1999);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });

  it('rejects an invalid start date', () => {
    expect(() => new ManualClock(new Date('not a date'))).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects advancing by %s', (ms) => {
    const clock = new ManualClock(start);
    expect(() => {
      clock.advanceBy(ms);
    }).toThrow(RangeError);
    expect(clock.now().toISOString()).toBe('2026-09-26T09:00:00.000Z');
  });
});
