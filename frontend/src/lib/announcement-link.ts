import { z } from 'zod';

export const announcementLinkSchema = z
  .union([z.string().trim().max(500), z.null()])
  .optional()
  .superRefine((value, ctx) => {
    if (value == null || value === '') return;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a full web link, starting with https://' });
      return;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The link must start with https://' });
    }
  })
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return new URL(value).toString();
  });

export function announcementLinkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Open link';
  }
}
