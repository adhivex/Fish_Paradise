/**
 * Shop-local time. The shop runs on India Standard Time (UTC+5:30, no DST), while servers
 * usually run in UTC – so every slot and opening-hours calculation goes through these helpers.
 */
const IST_OFFSET_MIN = 330;

export interface IstParts {
  /** `2026-09-30` */
  date: string;
  /** Minutes since midnight IST. */
  minutes: number;
}

export function istParts(at: Date): IstParts {
  const shifted = new Date(at.getTime() + IST_OFFSET_MIN * 60_000);
  const date = shifted.toISOString().slice(0, 10);
  return { date, minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export function hhmmToMinutes(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

/** UTC instant for an IST calendar date and `HH:MM`. */
export function istToDate(date: string, hhmm: string): Date {
  const utcMidnight = Date.parse(`${date}T00:00:00.000Z`);
  return new Date(utcMidnight + (hhmmToMinutes(hhmm) - IST_OFFSET_MIN) * 60_000);
}

/** IST date `days` after the given IST date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOpenAt(at: Date, opensAt: string, closesAt: string): boolean {
  const { minutes } = istParts(at);
  return minutes >= hhmmToMinutes(opensAt) && minutes < hhmmToMinutes(closesAt);
}

/** `"Today"`, `"Tomorrow"` or `"Thu, 2 Oct"` relative to `now` (IST). */
export function dayLabel(date: string, now: Date): string {
  const today = istParts(now).date;
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  const d = new Date(`${date}T00:00:00.000Z`);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** `3:15 PM` in IST, independent of the server or device time zone. */
export function formatIstTime(at: Date | number): string {
  const { minutes } = istParts(new Date(at));
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** `28 Sep 2026` in IST. */
export function formatIstDate(at: Date | number): string {
  const d = new Date(new Date(at).getTime() + IST_OFFSET_MIN * 60_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
