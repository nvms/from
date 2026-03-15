import type { Operator } from "./types";

export const oneOf = (values: readonly unknown[]): Operator<unknown> => (actual) =>
  values.includes(actual);
