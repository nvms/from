import type { Operator } from "./types";

export const eq = (expected: unknown): Operator<unknown> => (actual) => actual === expected;

export const ne = (expected: unknown): Operator<unknown> => (actual) => actual !== expected;

const asComparable = (
  actual: unknown,
  expected: number | string
): number | string | undefined => {
  if (typeof actual === "number" || typeof actual === "string") return actual;
  if (Array.isArray(actual) && typeof expected === "number") return actual.length;
  return undefined;
};

export const lt = (expected: number | string): Operator<unknown> => (actual) => {
  const v = asComparable(actual, expected);
  return v === undefined ? false : v < expected;
};

export const lte = (expected: number | string): Operator<unknown> => (actual) => {
  const v = asComparable(actual, expected);
  return v === undefined ? false : v <= expected;
};

export const gt = (expected: number | string): Operator<unknown> => (actual) => {
  const v = asComparable(actual, expected);
  return v === undefined ? false : v > expected;
};

export const gte = (expected: number | string): Operator<unknown> => (actual) => {
  const v = asComparable(actual, expected);
  return v === undefined ? false : v >= expected;
};

export const between = (min: number | string, max: number | string): Operator<unknown> =>
  (actual) => {
    const vMin = asComparable(actual, min);
    const vMax = asComparable(actual, max);
    if (vMin === undefined || vMax === undefined) return false;
    return vMin >= min && vMax <= max;
  };
