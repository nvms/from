import { clone } from "./utils/clone";
import { getPath, pickPaths, setPath, unsetPath } from "./utils/path";
import type { PathOf, ValueAtPath } from "./types";
import type { AggregateOp } from "./operators/aggregate";
import type { Operator } from "./operators/types";

type SortOrder = "asc" | "desc";

type WhereArg<T> =
  | { type: "predicate"; predicate: (item: T) => boolean }
  | { type: "path"; path: string; operator: Operator<any> };

const applyWhere = <T>(items: readonly T[], wheres: readonly WhereArg<T>[]): T[] =>
  items.filter((item) =>
    wheres.every((w) => {
      if (w.type === "predicate") return w.predicate(item);
      return w.operator(getPath(item, w.path));
    })
  );

const compareValues = (a: unknown, b: unknown) => {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  if (a === null) return 1;
  if (b === null) return -1;

  if (typeof a === "number" && typeof b === "number") return a < b ? -1 : 1;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : 1;

  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : 1;
};

const sortItems = <T>(items: readonly T[], path: string, order: SortOrder): T[] => {
  const dir = order === "desc" ? -1 : 1;
  return [...items].sort((a, b) => dir * compareValues(getPath(a, path), getPath(b, path)));
};

type UpdateFn<T> = (item: T) => T;
type UpdateMutFn<T> = (item: T) => void;

const updateByPath = <T>(items: readonly T[], path: string, value: unknown): T[] => {
  const segments = path.split(".");
  const isWildcardLeaf = segments[segments.length - 1] === "*";

  return items.map((item) => {
    if (isWildcardLeaf && typeof value === "function") {
      const parentPath = segments.slice(0, -1).join(".");
      const arr = getPath(item, parentPath);
      if (!Array.isArray(arr)) return clone(item);

      const fn = value as (v: unknown) => unknown;
      const nextArr = arr.map((v) => fn(v));
      return setPath(clone(item), parentPath, nextArr);
    }

    if (typeof value === "function" && !path.includes("*")) {
      const fn = value as (v: unknown) => unknown;
      const current = getPath(item, path);
      return setPath(clone(item), path, fn(current));
    }

    return setPath(clone(item), path, value);
  });
};

const updateMutByPath = <T>(items: T[], path: string, value: unknown): T[] => {
  const segments = path.split(".");
  const isWildcardLeaf = segments[segments.length - 1] === "*";

  items.forEach((item) => {
    if (isWildcardLeaf && typeof value === "function") {
      const parentPath = segments.slice(0, -1).join(".");
      const arr = getPath(item, parentPath);
      if (!Array.isArray(arr)) return;

      const fn = value as (v: unknown) => unknown;
      const nextArr = arr.map((v) => fn(v));
      Object.assign(item as object, setPath(item, parentPath, nextArr));
      return;
    }

    if (typeof value === "function" && !path.includes("*")) {
      const fn = value as (v: unknown) => unknown;
      const current = getPath(item, path);
      Object.assign(item as object, setPath(item, path, fn(current)));
      return;
    }

    Object.assign(item as object, setPath(item, path, value));
  });

  return items;
};

type ResultMode = "selection" | "base";

const hasViewTransforms = (q: Query<any>) =>
  Boolean(q["mapper"] || q["selection"] || q["sorter"] || q["skipper"] || q["taker"]);

const omitUndefined = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

export class Query<T> {
  private readonly items: readonly T[];
  private readonly wheres: readonly WhereArg<T>[];
  private readonly mapper?: (item: unknown) => unknown;
  private readonly selection?: { type: "select" | "omit"; paths: string[] };
  private readonly mode: ResultMode;
  private readonly updater?: (selected: readonly T[]) => T[];
  private readonly mutator?: (base: T[], matched: readonly T[]) => void;
  private readonly removeMatchedMut?: boolean;
  private readonly sorter?: { path: string; order: SortOrder };
  private readonly skipper?: number;
  private readonly taker?: number;
  private readonly aggregations?: Record<string, AggregateOp>;

  constructor(
    items: readonly T[],
    opts?: {
      wheres?: readonly WhereArg<T>[];
      mapper?: (item: unknown) => unknown;
      selection?: { type: "select" | "omit"; paths: string[] };
      mode?: ResultMode;
      updater?: Query<T>["updater"];
      mutator?: Query<T>["mutator"];
      removeMatchedMut?: boolean;
      sorter?: Query<T>["sorter"];
      skipper?: number;
      taker?: number;
      aggregations?: Record<string, AggregateOp>;
    }
  ) {
    this.items = items;
    this.wheres = opts?.wheres ?? [];
    this.mapper = opts?.mapper;
    this.selection = opts?.selection;
    this.mode = opts?.mode ?? "selection";
    this.updater = opts?.updater;
    this.mutator = opts?.mutator;
    this.removeMatchedMut = opts?.removeMatchedMut;
    this.sorter = opts?.sorter;
    this.skipper = opts?.skipper;
    this.taker = opts?.taker;
    this.aggregations = opts?.aggregations;
  }

  where<P extends PathOf<T>>(
    path: P,
    operator: Operator<ValueAtPath<T, P>>
  ): Query<T>;
  where(predicate: (item: T) => boolean): Query<T>;
  where(
    a: string | ((item: T) => boolean),
    b?: Operator<any>
  ): Query<T> {
    const next: WhereArg<T> =
      typeof a === "function"
        ? { type: "predicate", predicate: a }
        : { type: "path", path: a, operator: b ?? (() => false) };

    return new Query(this.items, { ...this.snapshot(), wheres: [...this.wheres, next] });
  }

  each<K extends keyof T & string>(
    path: K,
    callback: (subQuery: Query<T[K] extends readonly (infer E)[] ? E : never>) =>
      Query<T[K] extends readonly (infer E)[] ? E : never>
  ): Query<T> {
    return this.update((item) => {
      const current = getPath(item, path);
      if (!Array.isArray(current)) return clone(item);

      const sub = callback(new Query(current));
      const nextArr = sub.value();
      return setPath(clone(item), path, nextArr);
    });
  }

  aggregate(computations: Record<string, AggregateOp>): Query<T> {
    return new Query(
      this.items,
      omitUndefined({
        ...this.snapshot(),
        aggregations: { ...(this.aggregations ?? {}), ...computations },
      })
    );
  }

  select<P extends PathOf<T>>(paths: P[]): Query<Partial<T>> {
    return new Query(
      this.items as unknown as readonly Partial<T>[],
      omitUndefined({
        ...this.snapshot(),
        selection: { type: "select", paths: paths as string[] },
      }) as any
    );
  }

  omit<P extends PathOf<T>>(paths: P[]): Query<Partial<T>> {
    return new Query(
      this.items as unknown as readonly Partial<T>[],
      omitUndefined({
        ...this.snapshot(),
        selection: { type: "omit", paths: paths as string[] },
      }) as any
    );
  }

  map<U>(fn: (item: T) => U): Query<U> {
    return new Query(
      this.items as unknown as readonly U[],
      omitUndefined({
        ...this.snapshot(),
        mapper: fn as (item: unknown) => unknown,
      }) as any
    );
  }

  update(path: string, value: unknown): Query<T>;
  update(fn: UpdateFn<T>): Query<T>;
  update(a: string | UpdateFn<T>, b?: unknown): Query<T> {
    const nextUpdater = (selected: readonly T[]) => {
      if (typeof a === "function") return selected.map((item) => a(clone(item)));
      return updateByPath(selected, a, b);
    };

    const combined = this.updater
      ? (selected: readonly T[]) => nextUpdater(this.updater!(selected))
      : nextUpdater;

    return new Query(this.items, {
      ...omitUndefined({ ...this.snapshot(), updater: combined }),
    });
  }

  updateMut(path: string, value: unknown): Query<T>;
  updateMut(fn: UpdateMutFn<T>): Query<T>;
  updateMut(a: string | UpdateMutFn<T>, b?: unknown): Query<T> {
    const mutator = (items: T[], matched: readonly T[]) => {
      const matchedSet = new Set(matched);

      if (typeof a === "function") {
        items.forEach((item) => {
          if (matchedSet.has(item)) a(item);
        });
        return;
      }

      items.forEach((item) => {
        if (!matchedSet.has(item)) return;
        updateMutByPath([item], a, b);
      });
    };

    return new Query(this.items, omitUndefined({ ...this.snapshot(), mode: "base", mutator }));
  }

  sortBy<P extends PathOf<T>>(path: P, order: SortOrder = "asc"): Query<T> {
    return new Query(
      this.items,
      omitUndefined({
        ...this.snapshot(),
        sorter: { path: path as string, order },
      })
    );
  }

  skip(n: number): Query<T> {
    return new Query(this.items, omitUndefined({ ...this.snapshot(), skipper: n }));
  }

  take(n: number): Query<T> {
    return new Query(this.items, omitUndefined({ ...this.snapshot(), taker: n }));
  }

  groupBy<P extends PathOf<T>>(path: P): Record<string, T[]> {
    const items = this.value();
    return items.reduce<Record<string, T[]>>((acc, item) => {
      const key = getPath(item, path as string);
      const k = String(key);
      const existing = acc[k] ?? [];
      return { ...acc, [k]: [...existing, item] };
    }, {});
  }

  count(): number {
    return this.value().length;
  }

  first(): T | undefined {
    return this.value()[0];
  }

  remove(): T[] {
    return this.value();
  }

  removeMut(): Query<T> {
    return new Query(
      this.items,
      omitUndefined({ ...this.snapshot(), mode: "base", removeMatchedMut: true })
    );
  }

  value(): T[] {
    if (this.mode === "base") {
      const base = this.items as T[];
      const matched = applyWhere(base, this.wheres);

      this.mutator?.(base, matched);

      if (this.removeMatchedMut) {
        const matchedSet = new Set(matched);
        const next = base.filter((item) => !matchedSet.has(item));
        base.length = 0;
        base.push(...next);
      }

      if (!hasViewTransforms(this) && !this.aggregations && !this.updater) return base;

      const aggregated = this.applyAggregations(base);
      const mapped = this.applyMap(aggregated);
      const selected = this.applySelection(mapped);
      const sorted = this.applySort(selected);
      return this.applyPagination(sorted);
    }

    const selected = applyWhere(this.items, this.wheres);
    const updated = this.updater ? this.updater(selected) : [...selected];
    const aggregated = this.applyAggregations(updated);
    const mapped = this.applyMap(aggregated);
    const projected = this.applySelection(mapped);
    const sorted = this.applySort(projected);
    return this.applyPagination(sorted);
  }

  private applyAggregations(items: T[]): T[] {
    if (!this.aggregations) return items;
    const entries = Object.entries(this.aggregations);

    return items.map((item) => {
      const base = clone(item) as Record<string, unknown>;
      return entries.reduce<Record<string, unknown>>((acc, [key, op]) => {
        const nextValue = op(acc);
        return { ...acc, [key]: nextValue };
      }, base) as T;
    });
  }

  private applyMap(items: T[]): T[] {
    if (!this.mapper) return items;
    return items.map((item) => this.mapper!(item)) as T[];
  }

  private applySelection(items: T[]): T[] {
    if (!this.selection) return items;

    if (this.selection.type === "select") {
      return items.map((item) => pickPaths(item as object, this.selection!.paths) as T);
    }

    return items.map((item) =>
      this.selection!.paths.reduce((acc, path) => unsetPath(acc, path), clone(item))
    );
  }

  private applySort(items: T[]): T[] {
    if (!this.sorter) return items;
    return sortItems(items, this.sorter.path, this.sorter.order);
  }

  private applyPagination(items: T[]): T[] {
    const start = this.skipper ?? 0;
    const afterSkip = start === 0 ? items : items.slice(start);
    if (this.taker === undefined) return afterSkip;
    return afterSkip.slice(0, this.taker);
  }

  private snapshot() {
    return {
      wheres: this.wheres,
      mapper: this.mapper,
      selection: this.selection,
      mode: this.mode,
      updater: this.updater,
      mutator: this.mutator,
      removeMatchedMut: this.removeMatchedMut,
      sorter: this.sorter,
      skipper: this.skipper,
      taker: this.taker,
      aggregations: this.aggregations,
    };
  }
}

export const from = <T>(items: readonly T[]): Query<T> => new Query(items);
