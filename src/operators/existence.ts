import type { Operator } from "./types.js";

export const exists = (): Operator<unknown> => (actual) =>
  actual !== null && actual !== undefined;

export const missing = (): Operator<unknown> => (actual) =>
  actual === null || actual === undefined;

