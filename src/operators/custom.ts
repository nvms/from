import type { Operator } from "./types";

export const fn = <T>(predicate: (value: T) => boolean): Operator<T> => predicate;

