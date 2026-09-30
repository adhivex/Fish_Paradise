import 'server-only';
import type { z } from 'zod';
import { handle, ok, parseJson } from '@/lib/api';
import { requireAdmin } from '@/server/auth';

type IdContext = { params: Promise<{ id: string }> };

/** GET list + POST create for an admin entity (admin checked in every handler – rule 6). */
export function collectionRoutes<S extends z.ZodType>(
  svc: { list: () => Promise<unknown[]>; create: (data: z.infer<S>) => Promise<unknown> },
  schema: S,
) {
  return {
    GET: handle(async () => {
      await requireAdmin();
      return ok({ items: await svc.list() }, { headers: { 'Cache-Control': 'no-store' } });
    }),
    POST: handle(async (req: Request) => {
      await requireAdmin();
      const data = await parseJson(req, schema);
      return ok({ item: await svc.create(data) }, { status: 201 });
    }),
  };
}

/** PATCH (full object) + DELETE for one admin entity. */
export function itemRoutes<S extends z.ZodType>(
  svc: {
    update: (id: string, data: z.infer<S>) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
  },
  schema: S,
) {
  return {
    PATCH: handle(async (req: Request, ctx: IdContext) => {
      await requireAdmin();
      const { id } = await ctx.params;
      const data = await parseJson(req, schema);
      return ok({ item: await svc.update(id, data) });
    }),
    DELETE: handle(async (_req: Request, ctx: IdContext) => {
      await requireAdmin();
      const { id } = await ctx.params;
      return ok({ deleted: true, result: (await svc.remove(id)) ?? null });
    }),
  };
}
