import { describe, expect, it } from 'vitest';
import { calculateShiftDuration } from './index';

describe('frontend time util', () => {
  it('matches overnight shift behaviour', () => {
    expect(calculateShiftDuration('20:00', '08:00', 0).totalMinutes).toBe(720);
  });

  it('rejects a 24-hour shift', () => {
    expect(() => calculateShiftDuration('00:00', '00:00', 0)).toThrow(/less than 24 hours/);
  });
});
