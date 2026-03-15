import type { Operator } from "./types";

export const includes = (expected: unknown): Operator<unknown> => (actual) => {
  if (typeof actual === "string") return actual.includes(String(expected));
  if (Array.isArray(actual)) return actual.includes(expected);
  return false;
};

export const startsWith = (expected: string): Operator<unknown> => (actual) =>
  typeof actual === "string" ? actual.startsWith(expected) : false;

export const endsWith = (expected: string): Operator<unknown> => (actual) =>
  typeof actual === "string" ? actual.endsWith(expected) : false;

export const matches = (regex: RegExp): Operator<unknown> => (actual) =>
  typeof actual === "string" ? regex.test(actual) : false;

export const length = (n: number): Operator<unknown> => (actual) =>
  typeof actual === "string" || Array.isArray(actual) ? actual.length === n : false;

export const lengthGt = (n: number): Operator<unknown> => (actual) =>
  typeof actual === "string" || Array.isArray(actual) ? actual.length > n : false;

export const lengthLt = (n: number): Operator<unknown> => (actual) =>
  typeof actual === "string" || Array.isArray(actual) ? actual.length < n : false;

export const empty = (): Operator<unknown> => (actual) =>
  typeof actual === "string" || Array.isArray(actual) ? actual.length === 0 : false;

export const notEmpty = (): Operator<unknown> => (actual) =>
  typeof actual === "string" || Array.isArray(actual) ? actual.length > 0 : false;

