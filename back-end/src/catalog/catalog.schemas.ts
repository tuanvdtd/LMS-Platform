// back-end/src/catalog/catalog.schemas.ts
import { SkillLevel } from '@prisma/client';
import { z } from 'zod';

// GET /api/courses (spec public-catalog §3.1). Không .strict(): link ngoài có thể kèm utm_*.
export const listCoursesQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(100).optional(),
  topic: z.string().max(100).optional(),
  level: z.enum(SkillLevel).optional(),
  price: z.enum(['free', 'paid']).optional(),
  sort: z.enum(['newest', 'popular', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListCoursesQuery = z.output<typeof listCoursesQuery>;
