import { describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/lib/types';
import {
  buildTimeline,
  canTransition,
  customerCanCancel,
  matchesOrderFilter,
  nextStatus,
  orderGroup,
  orderNumberFromSeq,
  statusesForFilter,
} from './orders';

const states = (status: OrderStatus) =>
  buildTimeline({ status, placedAt: 0, events: [] }).map((s) => s.state);

describe('buildTimeline', () => {
  it('shows confirmation as current while placed', () => {
    expect(states('PLACED')).toEqual(['current', 'pending', 'pending', 'pending']);
  });

  it('moves to cleaning once confirmed', () => {
    expect(states('CONFIRMED')).toEqual(['done', 'current', 'pending', 'pending']);
  });

  it('keeps an in-progress step current', () => {
    expect(states('CLEANING_PACKING')).toEqual(['done', 'current', 'pending', 'pending']);
    expect(states('OUT_FOR_DELIVERY')).toEqual(['done', 'done', 'current', 'pending']);
  });

  it('completes everything when delivered', () => {
    expect(states('DELIVERED')).toEqual(['done', 'done', 'done', 'done']);
  });

  it('uses event times when present and estimates otherwise', () => {
    const steps = buildTimeline({
      status: 'CONFIRMED',
      placedAt: 1_000,
      events: [{ status: 'CONFIRMED', at: 5_000, note: null }],
    });
    expect(steps[0]).toMatchObject({ at: 5_000, estimated: false });
    expect(steps[2]).toMatchObject({ at: 1_000 + 35 * 60_000, estimated: true });
  });
});

describe('order groups', () => {
  it('maps statuses to customer chips', () => {
    expect(orderGroup('PLACED')).toBe('Preparing');
    expect(orderGroup('CLEANING_PACKING')).toBe('Preparing');
    expect(orderGroup('OUT_FOR_DELIVERY')).toBe('Out for delivery');
    expect(orderGroup('DELIVERED')).toBe('Delivered');
  });

  it('filters orders', () => {
    expect(matchesOrderFilter({ status: 'DELIVERED' }, 'All')).toBe(true);
    expect(matchesOrderFilter({ status: 'DELIVERED' }, 'Preparing')).toBe(false);
  });
});

describe('orderNumberFromSeq', () => {
  it('follows FP + (1000 + seq)', () => {
    expect(orderNumberFromSeq(24)).toBe('FP1024');
  });
});

describe('status transitions', () => {
  it('follows the documented flow', () => {
    expect(canTransition('PLACED', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CLEANING_PACKING')).toBe(true);
    expect(canTransition('CLEANING_PACKING', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
  });

  it('forbids skipping, going back and leaving final states', () => {
    expect(canTransition('PLACED', 'DELIVERED')).toBe(false);
    expect(canTransition('OUT_FOR_DELIVERY', 'CONFIRMED')).toBe(false);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });

  it('allows cancellation only before the order is out for delivery', () => {
    expect(canTransition('CLEANING_PACKING', 'CANCELLED')).toBe(true);
    expect(canTransition('OUT_FOR_DELIVERY', 'CANCELLED')).toBe(false);
  });

  it('lets customers cancel only before cleaning starts', () => {
    expect(customerCanCancel('PLACED')).toBe(true);
    expect(customerCanCancel('CONFIRMED')).toBe(true);
    expect(customerCanCancel('CLEANING_PACKING')).toBe(false);
  });

  it('knows the next forward step', () => {
    expect(nextStatus('CONFIRMED')).toBe('CLEANING_PACKING');
    expect(nextStatus('DELIVERED')).toBeNull();
  });

  it('maps chips to statuses', () => {
    expect(statusesForFilter('Preparing')).toEqual(['PLACED', 'CONFIRMED', 'CLEANING_PACKING']);
    expect(statusesForFilter('All')).toBeNull();
  });
});
