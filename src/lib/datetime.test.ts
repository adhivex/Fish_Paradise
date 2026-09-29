import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, isWithinHours, nextSlotDay } from './datetime';

describe('formatDate / formatTime', () => {
  const ms = new Date(2026, 8, 28, 15, 5).getTime();

  it('formats like the design', () => {
    expect(formatDate(ms)).toBe('28 Sep 2026');
    expect(formatTime(ms)).toBe('3:05 PM');
    expect(formatTime(new Date(2026, 0, 1, 0, 30).getTime())).toBe('12:30 AM');
  });
});

describe('isWithinHours', () => {
  it('checks opening hours', () => {
    expect(isWithinHours(new Date(2026, 8, 30, 7, 0), '07:00', '20:00')).toBe(true);
    expect(isWithinHours(new Date(2026, 8, 30, 20, 0), '07:00', '20:00')).toBe(false);
    expect(isWithinHours(new Date(2026, 8, 30, 6, 59), '07:00', '20:00')).toBe(false);
  });
});

describe('nextSlotDay', () => {
  it('keeps a slot today when there is enough lead time', () => {
    expect(nextSlotDay(new Date(2026, 8, 30, 15, 0), '17:00')).toEqual({
      date: '2026-09-30',
      dayLabel: 'Today',
    });
  });

  it('rolls over to tomorrow otherwise', () => {
    expect(nextSlotDay(new Date(2026, 8, 30, 16, 30), '17:00')).toEqual({
      date: '2026-10-01',
      dayLabel: 'Tomorrow',
    });
  });
});
