import { describe, expect, it } from 'vitest';
import { addDays, dayLabel, formatIstDate, formatIstTime, isOpenAt, istParts, istToDate } from './ist';

describe('IST helpers', () => {
  it('converts UTC instants to IST date and minutes', () => {
    expect(istParts(new Date('2026-09-30T18:45:00Z'))).toEqual({ date: '2026-10-01', minutes: 15 });
    expect(istParts(new Date('2026-09-30T04:30:00Z'))).toEqual({ date: '2026-09-30', minutes: 600 });
  });

  it('builds UTC instants from IST wall time', () => {
    expect(istToDate('2026-09-30', '17:00').toISOString()).toBe('2026-09-30T11:30:00.000Z');
    expect(istToDate('2026-10-01', '00:15').toISOString()).toBe('2026-09-30T18:45:00.000Z');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });

  it('checks opening hours in IST', () => {
    expect(isOpenAt(new Date('2026-09-30T01:30:00Z'), '07:00', '20:00')).toBe(true); // 07:00 IST
    expect(isOpenAt(new Date('2026-09-30T14:30:00Z'), '07:00', '20:00')).toBe(false); // 20:00 IST
  });

  it('labels days', () => {
    const now = new Date('2026-09-30T06:00:00Z');
    expect(dayLabel('2026-09-30', now)).toBe('Today');
    expect(dayLabel('2026-10-01', now)).toBe('Tomorrow');
    expect(dayLabel('2026-10-02', now)).toBe('Fri, 2 Oct');
  });

  it('formats IST time and date', () => {
    expect(formatIstTime(new Date('2026-09-28T09:45:00Z'))).toBe('3:15 PM');
    expect(formatIstDate(new Date('2026-09-28T20:00:00Z'))).toBe('29 Sep 2026');
  });
});
