import { describe, expect, test } from "vitest";
import { from, eq, lt } from "../src";

describe("immutable update", () => {
  const items = [
    { name: "A", score: 10 },
    { name: "B", score: 20 },
    { name: "C", score: 30 },
  ];

  test("update returns cloned array, original untouched", () => {
    const next = from(items).where("name", eq("A")).update("score", 99).value();
    expect(next).not.toBe(items);
    expect(next[0]!.score).toBe(99);
    expect(items[0]!.score).toBe(10);
  });

  test("update with function", () => {
    const next = from(items).where("name", eq("B")).update("score", (v: unknown) => (v as number) * 2).value();
    expect(next[0]!.score).toBe(40);
  });

  test("all items are cloned even if not matched", () => {
    const next = from(items).where("name", eq("A")).update("score", 99).value();
    expect(next[1]).not.toBe(items[1]);
  });

  test("wildcard leaf maps array elements", () => {
    const data = [{ tags: ["a", "b", "c"] }];
    const result = from(data)
      .update("tags.*", (t: unknown) => String(t).toUpperCase())
      .first();
    expect(result!.tags).toEqual(["A", "B", "C"]);
    expect(data[0]!.tags).toEqual(["a", "b", "c"]);
  });

  test("chained updates compose", () => {
    const result = from(items)
      .where("name", eq("A"))
      .update("score", 50)
      .update("name", "Z")
      .first();
    expect(result!.score).toBe(50);
    expect(result!.name).toBe("Z");
  });
});

describe("mutable update", () => {
  test("updateMut mutates in place", () => {
    const items = [
      { name: "A", score: 10 },
      { name: "B", score: 20 },
    ];
    const result = from(items).where("name", eq("A")).updateMut("score", 99).value();
    expect(result).toBe(items);
    expect(items[0]!.score).toBe(99);
    expect(items[1]!.score).toBe(20);
  });

  test("updateMut with function callback", () => {
    const items = [{ name: "A", count: 5 }];
    from(items).where("name", eq("A")).updateMut((item) => { item.count += 10; }).value();
    expect(items[0]!.count).toBe(15);
  });
});

describe("remove", () => {
  test("remove returns matched items (immutable)", () => {
    const items = [
      { name: "A", active: true },
      { name: "B", active: false },
      { name: "C", active: true },
    ];
    const removed = from(items).where("active", eq(false)).remove();
    expect(removed).toHaveLength(1);
    expect(removed[0]!.name).toBe("B");
    expect(items).toHaveLength(3);
  });

  test("removeMut removes matched items in place", () => {
    const items = [
      { name: "A", score: 10 },
      { name: "B", score: 50 },
      { name: "C", score: 90 },
    ];
    from(items).where("score", lt(50)).removeMut().value();
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.name)).toEqual(["B", "C"]);
  });
});
