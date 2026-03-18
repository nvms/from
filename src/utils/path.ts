import { isRecord } from "./is_record.js";

export type PathSegment = string | "*";

export const parsePath = (path: string): PathSegment[] =>
  path
    .split(".")
    .filter((p) => p.length > 0)
    .map((p) => (p === "*" ? "*" : p));

const getOwn = (value: unknown, key: string): unknown =>
  isRecord(value) ? value[key] : undefined;

const getPathImpl = (value: unknown, segments: PathSegment[]): unknown => {
  if (segments.length === 0) return value;

  const [head, ...rest] = segments;
  if (head === undefined) return value;

  if (head === "*") {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const result = getPathImpl(item, rest);
      return Array.isArray(result) && rest.includes("*") ? result : [result];
    });
  }

  return getPathImpl(getOwn(value, head), rest);
};

export const getPath = (value: unknown, path: string): unknown => {
  const segments = parsePath(path);
  if (!segments.includes("*")) {
    return segments.reduce<unknown>((acc, seg) => getOwn(acc, seg), value);
  }
  return getPathImpl(value, segments);
};

const setOnObject = (obj: Record<string, unknown>, key: string, next: unknown) => ({
  ...obj,
  [key]: next,
});

const setPathImpl = (
  value: unknown,
  segments: PathSegment[],
  leaf: unknown
): unknown => {
  if (segments.length === 0) return leaf;

  const [head, ...rest] = segments;
  if (head === undefined) return value;
  if (head === "*") {
    if (!Array.isArray(value)) return value;
    return value.map((item) => setPathImpl(item, rest, leaf));
  }

  const current = getOwn(value, head);
  const next = setPathImpl(current, rest, leaf);
  const base = isRecord(value) ? value : {};
  return setOnObject(base, head, next);
};

export const setPath = <T>(value: T, path: string, leaf: unknown): T => {
  const segments = parsePath(path);
  return setPathImpl(value, segments, leaf) as T;
};

const unsetFromObject = (obj: Record<string, unknown>, key: string) => {
  if (!(key in obj)) return obj;
  const { [key]: _removed, ...rest } = obj;
  return rest;
};

const unsetPathImpl = (value: unknown, segments: PathSegment[]): unknown => {
  if (segments.length === 0) return value;

  const [head, ...rest] = segments;
  if (head === undefined) return value;

  if (head === "*") {
    if (!Array.isArray(value)) return value;
    return value.map((item) => unsetPathImpl(item, rest));
  }

  if (!isRecord(value)) return value;
  const rec = value as Record<string, unknown>;
  if (rest.length === 0) return unsetFromObject(rec, head);

  const child = rec[head];
  const nextChild = unsetPathImpl(child, rest);
  if (nextChild === child) return value;

  return setOnObject(rec, head, nextChild);
};

export const unsetPath = <T>(value: T, path: string): T => {
  const segments = parsePath(path);
  return unsetPathImpl(value, segments) as T;
};

export const pickPaths = <T extends object>(value: T, paths: string[]): Partial<T> =>
  paths.reduce<Partial<T>>((acc, path) => {
    const v = getPath(value, path);
    if (v === undefined) return acc;
    return setPath(acc, path, v);
  }, {});
