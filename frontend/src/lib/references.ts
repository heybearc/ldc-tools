import { z } from 'zod';

export type ReferenceInput = {
  title: string;
  url: string;
  note: string | null;
  category: string;
};

const referenceSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(120, 'Keep the title under 120 characters'),
  url: z.string().trim().min(1, 'Enter a web address').max(500, 'That web address is too long'),
  note: z.union([z.string().trim().max(500, 'Keep the note under 500 characters'), z.null()]).optional(),
  category: z.union([z.string().trim().max(40, 'Keep the category under 40 characters'), z.null()]).optional(),
}).superRefine((value, ctx) => {
  let url: URL;
  try {
    url = new URL(value.url);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a full web address, starting with https://', path: ['url'] });
    return;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The address must start with https://', path: ['url'] });
  }
}).transform((value) => ({
  title: value.title,
  url: new URL(value.url).toString(),
  note: value.note ? value.note : null,
  category: value.category?.replace(/\s+/g, ' ').trim() || 'General',
}));

export function validateReference(input: unknown): { ok: true; value: ReferenceInput } | { ok: false; error: string } {
  const parsed = referenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Check the title and web address' };
  }
  return { ok: true, value: parsed.data };
}

export function referenceMatches(
  link: { title: string; url: string; note: string | null; category: string },
  query: string,
) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [link.title, link.url, link.note || '', link.category].some((part) => part.toLowerCase().includes(needle));
}

function categoryOrder(category: string) {
  return category.toLowerCase() === 'general' ? 0 : 1;
}

export function groupReferences<T extends { category: string; title: string }>(links: T[]) {
  const sorted = [...links].sort((a, b) => {
    const rank = categoryOrder(a.category) - categoryOrder(b.category);
    if (rank !== 0) return rank;
    const category = a.category.localeCompare(b.category, undefined, { sensitivity: 'base' });
    if (category !== 0) return category;
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
  const groups: Array<{ category: string; links: T[] }> = [];
  for (const link of sorted) {
    const last = groups[groups.length - 1];
    if (!last || last.category.toLowerCase() !== link.category.toLowerCase()) {
      groups.push({ category: link.category, links: [link] });
    } else {
      last.links.push(link);
    }
  }
  return groups;
}
