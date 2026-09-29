/** Display helpers. Shop local time is IST; the UI renders in the device's time zone. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `28 Sep 2026` */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `3:15 PM` */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

function minutesOf(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

/** Whether `now` falls inside opening hours (`"07:00"`–`"20:00"`). */
export function isWithinHours(now: Date, opensAt: string, closesAt: string): boolean {
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= minutesOf(opensAt) && mins < minutesOf(closesAt);
}

/**
 * Next day a scheduled slot can be delivered: today if it starts at least `leadMinutes` from now,
 * otherwise tomorrow. Returns an ISO date (`2026-09-30`) and a label (`Today` / `Tomorrow`).
 */
export function nextSlotDay(
  now: Date,
  startTime: string,
  leadMinutes = 60,
): { date: string; dayLabel: string } {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const today = minutesOf(startTime) - nowMins >= leadMinutes;
  const d = new Date(now);
  if (!today) d.setDate(d.getDate() + 1);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { date: iso, dayLabel: today ? 'Today' : 'Tomorrow' };
}
