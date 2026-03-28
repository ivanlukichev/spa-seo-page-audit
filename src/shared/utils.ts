import type { StatusLevel } from "./types";

export function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function resolveUrl(value: string | null | undefined, base: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

export function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

export function truncate(value: string, max = 96): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function formatNullable(value: string | null | undefined, fallback = "Not found"): string {
  const normalized = normalizeWhitespace(value);
  return normalized || fallback;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 0): string {
  return `${value.toFixed(maximumFractionDigits)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toSentenceCase(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function statusWeight(status: StatusLevel): number {
  switch (status) {
    case "error":
      return 3;
    case "warning":
      return 2;
    case "neutral":
      return 1;
    default:
      return 0;
  }
}
