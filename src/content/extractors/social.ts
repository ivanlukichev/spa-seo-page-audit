import type { SocialMeta } from "../../shared/types";
import { normalizeWhitespace, resolveUrl } from "../../shared/utils";

function getMetaValue(selector: string): string | null {
  const meta = document.querySelector<HTMLMetaElement>(selector);
  return normalizeWhitespace(meta?.content) || null;
}

export function extractSocial(): SocialMeta {
  return {
    ogTitle: getMetaValue('meta[property="og:title"]'),
    ogDescription: getMetaValue('meta[property="og:description"]'),
    ogImage: resolveUrl(getMetaValue('meta[property="og:image"]'), window.location.href),
    ogType: getMetaValue('meta[property="og:type"]'),
    twitterCard: getMetaValue('meta[name="twitter:card"]'),
    twitterTitle: getMetaValue('meta[name="twitter:title"]'),
    twitterDescription: getMetaValue('meta[name="twitter:description"]'),
    twitterImage: resolveUrl(getMetaValue('meta[name="twitter:image"]'), window.location.href)
  };
}
