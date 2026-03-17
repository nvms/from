import type { Operator } from "./types.js";

export const fn = <T>(predicate: (value: T) => boolean): Operator<T> => predicate;

