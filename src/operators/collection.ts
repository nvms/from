import type { Operator } from "./types.js";

export const oneOf = (values: readonly unknown[]): Operator<unknown> => (actual) =>
  values.includes(actual);
