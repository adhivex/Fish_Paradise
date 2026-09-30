/**
 * Client-side stand-ins until Phase 4 serves these from the database (`/api/delivery/check`,
 * `/api/slots`, `/api/addresses`). Values mirror `prisma/seed-data.ts`.
 *
 * PLACEHOLDERS: the delivery zone, sample address and sample customer come from the design.
 */
import { seedDeliveryZones, seedSlotTemplates } from '../../../prisma/seed-data';
import type { AddressDTO, DeliveryZoneDTO, SlotTemplateDTO } from '@/lib/types';

export const deliveryZones: DeliveryZoneDTO[] = seedDeliveryZones.map((z) => ({
  ...z,
  freeAbovePaise: null,
  minOrderPaise: 0,
}));

export const slotTemplates: SlotTemplateDTO[] = seedSlotTemplates.map((s) => ({
  id: `slot_${s.startTime.replace(':', '')}`,
  label: s.label,
  startTime: s.startTime,
  endTime: s.endTime,
}));

export const sampleAddresses: AddressDTO[] = [
  {
    id: 'addr_home',
    label: 'Home',
    line1: 'Plot No. 123',
    area: 'Khandagiri',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751030',
    isDefault: true,
  },
];

/** Sample signed-in customer until OTP login in Phase 3. */
export const sampleCustomer = { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 00000 00000' };

export function findZone(pincode: string): DeliveryZoneDTO | undefined {
  return deliveryZones.find((z) => z.pincode === pincode.trim());
}
