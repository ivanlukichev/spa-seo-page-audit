import type { PageMeta } from "../../shared/types";
import { normalizeWhitespace, resolveUrl } from "../../shared/utils";

function getMetaContent(selector: string): string | null {
  const value = document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
  return normalizeWhitespace(value) || null;
}

export function extractMeta(): PageMeta {
  const canonicalHref = document.querySelector<HTMLLinkElement>('link[rel~="canonical"]')?.getAttribute("href");
  const faviconHref =
    document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.getAttribute("href") ??
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.getAttribute("href");

  return {
    url: window.location.href,
    title: normalizeWhitespace(document.title),
    metaDescription: getMetaContent('meta[name="description"]'),
    canonical: resolveUrl(canonicalHref, window.location.href),
    robots: getMetaContent('meta[name="robots"]'),
    viewport: getMetaContent('meta[name="viewport"]'),
    lang: normalizeWhitespace(document.documentElement.lang) || null,
    charset:
      normalizeWhitespace(document.characterSet) ||
      normalizeWhitespace(document.querySelector<HTMLMetaElement>("meta[charset]")?.getAttribute("charset")) ||
      null,
    favicon: resolveUrl(faviconHref, window.location.href)
  };
}
