import type { Operator } from "./types";

export const exists = (): Operator<unknown> => (actual) =>
  actual !== null && actual !== undefined;

export const missing = (): Operator<unknown> => (actual) =>
  actual === null || actual === undefined;

