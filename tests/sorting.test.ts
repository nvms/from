import { describe, expect, test } from "vitest";
import { from } from "../src";

const items = [
  { name: "Charlie", score: 72 },
  { name: "Alice", score: 95 },
  { name: "Bob", score: 88 },
  { name: "Diana", score: 60 },
];

describe("sortBy", () => {
  test("ascending", () => {
    const result = from(items).sortBy("score", "asc").value();
    expect(result.map((r) => r.name)).toEqual(["Diana", "Charlie", "Bob", "Alice"]);
  });

  test("descending", () => {
    const result = from(items).sortBy("score", "desc").value();
    expect(result.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie", "Diana"]);
  });

  test("string sorting", () => {
    const result = from(items).sortBy("name", "asc").select(["name"]).value();
    expect(result.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie", "Diana"]);
  });
});

describe("pagination", () => {
  test("skip", () => {
    const result = from(items).sortBy("score", "desc").skip(2).value();
    expect(result.map((r) => r.name)).toEqual(["Charlie", "Diana"]);
  });

  test("take", () => {
    const result = from(items).sortBy("score", "desc").take(2).value();
    expect(result.map((r) => r.name)).toEqual(["Alice", "Bob"]);
  });

  test("skip + take compose", () => {
    const result = from(items).sortBy("score", "desc").skip(1).take(2).value();
    expect(result.map((r) => r.name)).toEqual(["Bob", "Charlie"]);
  });
});

describe("count and first", () => {
  test("count returns length", () => {
    expect(from(items).count()).toBe(4);
    expect(from(items).take(2).count()).toBe(2);
  });

  test("first returns first item", () => {
    expect(from(items).sortBy("score", "desc").first()!.name).toBe("Alice");
  });

  test("first returns undefined on empty", () => {
    expect(from([]).first()).toBeUndefined();
  });
});

describe("groupBy", () => {
  const students = [
    { name: "A", grade: "A" },
    { name: "B", grade: "B" },
    { name: "C", grade: "A" },
    { name: "D", grade: "C" },
  ];

  test("groups by field value", () => {
    const groups = from(students).groupBy("grade");
    expect(Object.keys(groups).sort()).toEqual(["A", "B", "C"]);
    expect(groups["A"]).toHaveLength(2);
    expect(groups["B"]).toHaveLength(1);
  });
});
