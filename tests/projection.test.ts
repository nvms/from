import { describe, expect, test } from "vitest";
import { from, eq } from "../src";

const data = [
  { name: "Alice", age: 30, role: "admin", meta: { score: 100 } },
  { name: "Bob", age: 25, role: "user", meta: { score: 80 } },
  { name: "Carol", age: 35, role: "user", meta: { score: 90 } },
];

describe("select", () => {
  test("projects only specified fields", () => {
    const result = from(data).select(["name", "age"]).value();
    expect(result).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Carol", age: 35 },
    ]);
  });

  test("projects nested fields", () => {
    const result = from(data).select(["name", "meta.score"]).value();
    expect(result).toEqual([
      { name: "Alice", meta: { score: 100 } },
      { name: "Bob", meta: { score: 80 } },
      { name: "Carol", meta: { score: 90 } },
    ]);
  });

  test("composes with where", () => {
    const result = from(data).where("role", eq("admin")).select(["name"]).value();
    expect(result).toEqual([{ name: "Alice" }]);
  });
});

describe("omit", () => {
  test("excludes specified fields", () => {
    const result = from(data).omit(["meta", "role"]).value();
    expect(result).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Carol", age: 35 },
    ]);
  });
});

describe("map", () => {
  test("transforms each item", () => {
    const result = from(data).map((item) => ({ label: `${item.name} (${item.age})` })).value();
    expect(result).toEqual([
      { label: "Alice (30)" },
      { label: "Bob (25)" },
      { label: "Carol (35)" },
    ]);
  });
});
