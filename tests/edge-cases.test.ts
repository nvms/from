import { describe, expect, test } from "vitest";
import { from, eq, gt } from "../src";

describe("empty arrays", () => {
  test("filtering empty array returns empty", () => {
    expect(from([]).where("x", eq(1)).value()).toEqual([]);
  });

  test("first on empty returns undefined", () => {
    expect(from([]).first()).toBeUndefined();
  });

  test("count on empty returns 0", () => {
    expect(from([]).count()).toBe(0);
  });

  test("groupBy on empty returns empty object", () => {
    expect(from([]).groupBy("x")).toEqual({});
  });
});

describe("immutability", () => {
  test("from does not modify source array", () => {
    const items = [{ a: 1 }, { a: 2 }];
    const original = [...items];
    from(items).where("a", eq(1)).value();
    expect(items).toEqual(original);
  });

  test("chaining creates new query instances", () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
    const q = from(items);
    const q1 = q.where("a", gt(1));
    const q2 = q.where("a", eq(1));
    expect(q1.value()).toHaveLength(2);
    expect(q2.value()).toHaveLength(1);
  });
});

describe("missing paths", () => {
  test("where on missing path does not throw", () => {
    const items = [{ a: 1 }, { b: 2 }];
    const result = from(items).where("a", eq(1)).value();
    expect(result).toHaveLength(1);
  });

  test("sortBy on missing path handles undefined", () => {
    const items = [{ name: "B" }, { name: "A", score: 5 }, { name: "C" }];
    const result = from(items).sortBy("score", "asc").value();
    expect(result[0]!.name).toBe("A");
  });
});

describe("complex composition", () => {
  test("full pipeline: where + sortBy + skip + take + select", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `item-${i}`,
      value: Math.floor(i / 10),
    }));

    const result = from(data)
      .where("value", gt(5))
      .sortBy("id", "desc")
      .skip(5)
      .take(10)
      .select(["id", "name"])
      .value();

    expect(result).toHaveLength(10);
    expect(result[0]!.id).toBe(94);
    expect(result[9]!.id).toBe(85);
    expect((result[0] as any).value).toBeUndefined();
  });
});
