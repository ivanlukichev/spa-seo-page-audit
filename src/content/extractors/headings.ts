import type { HeadingCounts, HeadingItem } from "../../shared/types";
import { normalizeWhitespace } from "../../shared/utils";

const EMPTY_COUNTS: HeadingCounts = {
  h1: 0,
  h2: 0,
  h3: 0,
  h4: 0,
  h5: 0,
  h6: 0
};

export function extractHeadings(): { headings: HeadingItem[]; headingCounts: HeadingCounts } {
  const headings: HeadingItem[] = Array.from(
    document.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")
  )
    .map((heading, index) => {
      const level = Number(heading.tagName.slice(1)) as HeadingItem["level"];
      const text = normalizeWhitespace(heading.textContent);

      if (!text) {
        return null;
      }

      return {
        level,
        text,
        id: heading.id || null,
        index
      };
    })
    .filter((heading): heading is HeadingItem => Boolean(heading));

  const headingCounts = headings.reduce<HeadingCounts>((counts, heading) => {
    counts[`h${heading.level}` as keyof HeadingCounts] += 1;
    return counts;
  }, { ...EMPTY_COUNTS });

  return { headings, headingCounts };
}
