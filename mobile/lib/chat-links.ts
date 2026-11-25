export interface ChatTextPart {
  text: string;
  href: string | null;
}

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<]+/gi;

export function splitChatLinks(body: string): ChatTextPart[] {
  const parts: ChatTextPart[] = [];
  const pattern = new RegExp(URL_PATTERN.source, 'gi');
  let last = 0;
  for (const match of body.matchAll(pattern)) {
    const start = match.index ?? 0;
    const rawMatch = match[0];
    if (start > last) parts.push({ text: body.slice(last, start), href: null });
    const { url, trailing } = trimTrailingPunctuation(rawMatch);
    const href = safeHttpUrl(url.startsWith('www.') ? `https://${url}` : url);
    parts.push({ text: url, href });
    if (trailing) parts.push({ text: trailing, href: null });
    last = start + rawMatch.length;
  }
  if (last < body.length) parts.push({ text: body.slice(last), href: null });
  if (parts.length === 0) parts.push({ text: body, href: null });
  return parts;
}

export function pastedChatText(input: { plain: string; html: string; uriList: string }): string | null {
  const href = firstHttpUrl(input.uriList) || hrefFromHtml(input.html);
  if (!href) return null;
  const plain = input.plain.replace(/\u00a0/g, ' ').trim();
  if (!plain) return href;
  if (/^(https?:\/\/|www\.)/i.test(plain) || plain.includes(href)) return null;
  return `${plain}\n${href}`;
}

function trimTrailingPunctuation(value: string) {
  let url = value;
  let trailing = '';
  while (url.length > 0 && /[.,;:!?)\]]$/.test(url)) {
    const last = url.at(-1) || '';
    if (last === ')' && count(url, '(') >= count(url, ')')) break;
    trailing = last + trailing;
    url = url.slice(0, -1);
  }
  return { url, trailing };
}

function count(value: string, char: string) {
  return value.split(char).length - 1;
}

function firstHttpUrl(uriList: string) {
  for (const line of uriList.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const href = safeHttpUrl(trimmed);
    if (href) return href;
  }
  return null;
}

function hrefFromHtml(html: string) {
  if (!html) return null;
  const match = html.match(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const raw = decodeHtml(match?.[1] || match?.[2] || match?.[3] || '');
  return safeHttpUrl(raw);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}
