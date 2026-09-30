import 'server-only';
import type { Address } from '@prisma/client';
import { ApiError } from '@/lib/api';
import type { AddressInput } from '@/lib/address';
import type { AddressDTO } from '@/lib/types';
import { db } from '@/server/db';
import { findZone } from '@/server/services/pricing';

export interface AddressView extends AddressDTO {
  serviceable: boolean;
}

function toDTO(a: Address, serviceable: boolean): AddressView {
  return {
    id: a.id,
    label: a.label,
    line1: a.line1,
    line2: a.line2 ?? undefined,
    landmark: a.landmark ?? undefined,
    area: a.area ?? undefined,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.isDefault,
    serviceable,
  };
}

async function withServiceable(rows: Address[]): Promise<AddressView[]> {
  const pins = [...new Set(rows.map((r) => r.pincode))];
  const zones = await db.deliveryZone.findMany({
    where: { pincode: { in: pins }, isActive: true },
    select: { pincode: true },
  });
  const ok = new Set(zones.map((z) => z.pincode));
  return rows.map((r) => toDTO(r, ok.has(r.pincode)));
}

export async function listAddresses(userId: string): Promise<AddressView[]> {
  const rows = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return withServiceable(rows);
}

/** Owner-checked lookup used by checkout and order creation. */
export async function getOwnAddress(userId: string, id: string): Promise<Address> {
  const a = await db.address.findFirst({ where: { id, userId } });
  if (!a) throw new ApiError('NOT_FOUND', 'Address not found.', 404);
  return a;
}

export async function createAddress(
  userId: string,
  input: AddressInput & { isDefault?: boolean },
): Promise<AddressView> {
  const count = await db.address.count({ where: { userId } });
  const makeDefault = count === 0 || !!input.isDefault;
  const row = await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({
      data: {
        userId,
        label: input.label,
        line1: input.line1,
        area: input.area || null,
        landmark: input.landmark || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        isDefault: makeDefault,
      },
    });
  });
  return toDTO(row, !!(await findZone(row.pincode)));
}

export async function updateAddress(
  userId: string,
  id: string,
  input: Partial<AddressInput> & { isDefault?: boolean },
): Promise<AddressView> {
  await getOwnAddress(userId, id);
  const row = await db.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({
      where: { id },
      data: {
        ...input,
        area: input.area === undefined ? undefined : input.area || null,
        landmark: input.landmark === undefined ? undefined : input.landmark || null,
      },
    });
  });
  return toDTO(row, !!(await findZone(row.pincode)));
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const existing = await getOwnAddress(userId, id);
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
}
