export type AnyRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === "object" && value !== null;

