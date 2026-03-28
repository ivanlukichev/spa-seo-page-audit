import type { ImageItem, StatusLevel } from "../../shared/types";
import { normalizeWhitespace, resolveUrl } from "../../shared/utils";

function getImageStatus(hasAlt: boolean, alt: string | null): { status: StatusLevel; note: string } {
  if (!hasAlt) {
    return {
      status: "error",
      note: "Image is missing an alt attribute."
    };
  }

  if (!alt) {
    return {
      status: "neutral",
      note: "Empty alt suggests a decorative image."
    };
  }

  return {
    status: "good",
    note: "Alt text is present."
  };
}

export function extractImages(): ImageItem[] {
  return Array.from(document.querySelectorAll<HTMLImageElement>("img")).map((image) => {
    const alt = normalizeWhitespace(image.getAttribute("alt")) || null;
    const hasAlt = image.hasAttribute("alt");
    const { status, note } = getImageStatus(hasAlt, alt);

    return {
      src: resolveUrl(image.currentSrc || image.getAttribute("src"), window.location.href) ?? "",
      alt,
      hasAlt,
      missingAlt: !hasAlt,
      width: image.naturalWidth || image.width || null,
      height: image.naturalHeight || image.height || null,
      lazy: (image.getAttribute("loading") ?? "").toLowerCase() === "lazy",
      status,
      note
    };
  });
}
