import { STOP_WORDS } from "../../shared/constants";
import type { TextStatItem, TextStats } from "../../shared/types";

const TOKEN_PATTERN = /[a-zа-яё][a-zа-яё'-]*/giu;

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(TOKEN_PATTERN) ?? [])
    .map((token) => token.replace(/^[-']+|[-']+$/g, ""))
    .filter((token) => token.length >= 2);
}

function buildTopTerms(tokens: string[], size: number): TextStatItem[] {
  if (tokens.length < size) {
    return [];
  }

  const items = new Map<string, number>();
  const sequenceCount = tokens.length - size + 1;

  for (let index = 0; index < sequenceCount; index += 1) {
    const term = tokens.slice(index, index + size).join(" ");
    items.set(term, (items.get(term) ?? 0) + 1);
  }

  return Array.from(items.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([term, count]) => ({
      term,
      count,
      density: Number(((count / sequenceCount) * 100).toFixed(2))
    }));
}

export function extractTextStats(): TextStats {
  const visibleText = document.body?.innerText ?? "";
  const tokens = tokenize(visibleText);
  const keywordTokens = tokens.filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  const singleCounts = new Map<string, number>();

  for (const token of keywordTokens) {
    singleCounts.set(token, (singleCounts.get(token) ?? 0) + 1);
  }

  const topWords = Array.from(singleCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([term, count]) => ({
      term,
      count,
      density: Number(((count / Math.max(keywordTokens.length, 1)) * 100).toFixed(2))
    }));

  return {
    wordCount: tokens.length,
    topWords,
    topBigrams: buildTopTerms(keywordTokens, 2),
    topTrigrams: buildTopTerms(keywordTokens, 3)
  };
}
