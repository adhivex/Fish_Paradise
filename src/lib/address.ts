import { z } from 'zod';
import type { AddressDTO } from '@/lib/types';

/** One-line address as shown on checkout and orders. */
export function formatAddress(
  a: Pick<AddressDTO, 'line1' | 'line2' | 'area' | 'city' | 'state' | 'pincode'>,
): string {
  return [a.line1, a.line2, a.area, a.city, `${a.state} – ${a.pincode}`].filter(Boolean).join(', ');
}

/** Shared by the add-address form now and `POST /api/addresses` in Phase 4. */
export const addressInputSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  line1: z.string().trim().min(3, 'Enter house / flat and street').max(120),
  area: z.string().trim().max(80).optional(),
  landmark: z.string().trim().max(80).optional(),
  city: z.string().trim().min(2, 'Enter your city').max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
});

export type AddressInput = z.infer<typeof addressInputSchema>;
