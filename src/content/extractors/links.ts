import { WEAK_ANCHOR_PATTERNS } from "../../shared/constants";
import type { LinkItem, LinkType, StatusLevel } from "../../shared/types";
import { normalizeHost, normalizeWhitespace, resolveUrl } from "../../shared/utils";

function getAnchorText(anchor: HTMLAnchorElement): string {
  const textContent = normalizeWhitespace(anchor.textContent);
  if (textContent) {
    return textContent;
  }

  const imageAlt = Array.from(anchor.querySelectorAll("img"))
    .map((image) => normalizeWhitespace(image.getAttribute("alt")))
    .filter(Boolean)
    .join(" ");

  return (
    imageAlt ||
    normalizeWhitespace(anchor.getAttribute("aria-label")) ||
    normalizeWhitespace(anchor.getAttribute("title"))
  );
}

function classifyLinkType(url: string | null): LinkType {
  if (!url) {
    return "other";
  }

  const resolved = new URL(url);
  if (!/^https?:$/i.test(resolved.protocol)) {
    return "other";
  }

  return normalizeHost(resolved.hostname) === normalizeHost(window.location.hostname) ? "internal" : "external";
}

function buildLinkStatus(type: LinkType, emptyAnchor: boolean, anchorText: string): { status: StatusLevel; note: string } {
  if (emptyAnchor) {
    return {
      status: "error",
      note: "Anchor text is empty."
    };
  }

  if (WEAK_ANCHOR_PATTERNS.includes(anchorText.toLowerCase())) {
    return {
      status: "warning",
      note: "Anchor text is weak and could be more descriptive."
    };
  }

  if (type === "other") {
    return {
      status: "neutral",
      note: "Link uses a non-HTTP scheme or a browser-only target."
    };
  }

  return {
    status: "good",
    note: "Anchor text looks usable."
  };
}

export function extractLinks(): LinkItem[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).map((anchor) => {
    const href = anchor.getAttribute("href") ?? "";
    const absoluteUrl = resolveUrl(href, window.location.href);
    const anchorText = getAnchorText(anchor);
    const rel = normalizeWhitespace(anchor.getAttribute("rel"))
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const emptyAnchor = !anchorText;
    const type = classifyLinkType(absoluteUrl);
    const { status, note } = buildLinkStatus(type, emptyAnchor, anchorText);

    return {
      href,
      absoluteUrl,
      hostname: absoluteUrl ? new URL(absoluteUrl).hostname : null,
      type,
      rel,
      nofollow: rel.includes("nofollow"),
      sponsored: rel.includes("sponsored"),
      ugc: rel.includes("ugc"),
      anchorText,
      emptyAnchor,
      status,
      note
    };
  });
}
