import type { OrderDTO, OrderStatus } from '@/lib/types';

/** Customer-facing status groups used by the My orders chips. */
export type OrderGroup = 'Preparing' | 'Out for delivery' | 'Delivered' | 'Cancelled';

export const ORDER_FILTERS = ['All', 'Preparing', 'Out for delivery', 'Delivered'] as const;
export type OrderFilter = (typeof ORDER_FILTERS)[number];

export function orderGroup(status: OrderStatus): OrderGroup {
  switch (status) {
    case 'OUT_FOR_DELIVERY':
      return 'Out for delivery';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Preparing';
  }
}

export function matchesOrderFilter(order: Pick<OrderDTO, 'status'>, filter: OrderFilter): boolean {
  return filter === 'All' || orderGroup(order.status) === filter;
}

/** Steps shown on the customer timeline, with the minutes after placing used for estimates. */
const TIMELINE: ReadonlyArray<{ status: OrderStatus; label: string; estMinutes: number }> = [
  { status: 'CONFIRMED', label: 'Confirmed', estMinutes: 0 },
  { status: 'CLEANING_PACKING', label: 'Cleaning & packing', estMinutes: 8 },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', estMinutes: 35 },
  { status: 'DELIVERED', label: 'Delivered', estMinutes: 45 },
];

const RANK: Record<OrderStatus, number> = {
  PLACED: -1,
  CONFIRMED: 0,
  CLEANING_PACKING: 1,
  OUT_FOR_DELIVERY: 2,
  DELIVERED: 3,
  CANCELLED: -2,
};

/** States that are "in progress" – the step itself is the current one rather than completed. */
const IN_PROGRESS: ReadonlySet<OrderStatus> = new Set(['CLEANING_PACKING', 'OUT_FOR_DELIVERY']);

export type StepState = 'done' | 'current' | 'pending';

export interface TimelineStep {
  label: string;
  state: StepState;
  /** Epoch ms – actual time for reached steps, estimate for pending ones. */
  at: number;
  estimated: boolean;
}

export function buildTimeline(order: Pick<OrderDTO, 'status' | 'placedAt' | 'events'>): TimelineStep[] {
  const rank = RANK[order.status];
  const eventAt = (s: OrderStatus) => order.events.find((e) => e.status === s)?.at;

  let currentIndex: number;
  if (order.status === 'PLACED') currentIndex = 0;
  else if (order.status === 'DELIVERED' || order.status === 'CANCELLED') currentIndex = -1;
  else if (IN_PROGRESS.has(order.status)) currentIndex = rank;
  else currentIndex = rank + 1; // CONFIRMED → next step is under way

  return TIMELINE.map((step, i) => {
    const reachedAt = eventAt(step.status);
    const done = order.status !== 'CANCELLED' && i <= rank && !(i === currentIndex);
    const state: StepState = done ? 'done' : i === currentIndex ? 'current' : 'pending';
    const at = reachedAt ?? order.placedAt + step.estMinutes * 60_000;
    return { label: step.label, state, at, estimated: reachedAt === undefined };
  });
}

const HEADLINES: Record<OrderStatus, [string, string]> = {
  PLACED: ['Order received', 'We will confirm your order shortly.'],
  CONFIRMED: ['Order confirmed', 'We have got your order and will start cleaning shortly.'],
  CLEANING_PACKING: ['Your order is being prepared', 'We are cleaning and packing your fresh seafood.'],
  OUT_FOR_DELIVERY: ['Your order is on the way', 'Your delivery partner is heading to you.'],
  DELIVERED: ['Delivered. Enjoy your fresh seafood!', 'Thank you for shopping with Fish Paradise.'],
  CANCELLED: ['Order cancelled', 'This order was cancelled. Any payment made will be refunded.'],
};

export function statusHeadline(status: OrderStatus): { headline: string; subline: string } {
  const [headline, subline] = HEADLINES[status];
  return { headline, subline };
}

/** Order number rule from the PRD: "FP" + (1000 + running sequence). */
export function orderNumberFromSeq(seq: number): string {
  return `FP${1000 + seq}`;
}
