import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

export const objectId = z.string().refine(isValidObjectId, 'Invalid id');

const day = z.iso.date('Use YYYY-MM-DD');

/** Shared list query: pagination + search + created-date range + sort direction. */
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  from: day.optional(),
  to: day.optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/** createdAt filter where `to` covers the whole day (UTC). */
export function dateRangeFilter(from?: string, to?: string) {
  if (!from && !to) return {};
  const createdAt: { $gte?: Date; $lt?: Date } = {};
  if (from) createdAt.$gte = new Date(from);
  if (to) createdAt.$lt = new Date(new Date(to).getTime() + 86_400_000);
  return { createdAt };
}

export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/** Uniform JSON shape: `id` instead of `_id`, no internals. */
export const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    delete ret._id;
    delete ret.searchTokens;
    delete ret.password;
    return ret;
  },
};
