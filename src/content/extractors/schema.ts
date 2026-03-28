import type { SchemaItem } from "../../shared/types";
import { normalizeWhitespace } from "../../shared/utils";

function collectSchemaTypes(value: unknown, collector: Set<string>) {
  if (!value) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, collector));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const maybeType = record["@type"];

  if (typeof maybeType === "string") {
    collector.add(maybeType);
  } else if (Array.isArray(maybeType)) {
    maybeType.forEach((item) => {
      if (typeof item === "string") {
        collector.add(item);
      }
    });
  }

  Object.values(record).forEach((item) => collectSchemaTypes(item, collector));
}

export function extractSchema(): SchemaItem[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')).map((script) => {
    const raw = normalizeWhitespace(script.textContent);

    try {
      const parsed = JSON.parse(raw);
      const types = new Set<string>();
      collectSchemaTypes(parsed, types);

      return {
        raw,
        parsed: true,
        types: Array.from(types),
        error: null
      };
    } catch (error) {
      return {
        raw,
        parsed: false,
        types: [],
        error: error instanceof Error ? error.message : "Failed to parse JSON-LD."
      };
    }
  });
}
