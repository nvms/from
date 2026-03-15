import { describe, expect, test } from "vitest";
import { from, add, sub, mul, div } from "../src";

describe("aggregate", () => {
  const students = [
    { math: 72, english: 82, science: 92 },
    { math: 60, english: 70, science: 80 },
    { math: 90, english: 72, science: 84 },
  ];

  test("add sums fields", () => {
    const result = from(students).aggregate({ total: add("math", "english", "science") }).value();
    expect(result[0]!.total).toBe(246);
    expect(result[1]!.total).toBe(210);
    expect(result[2]!.total).toBe(246);
  });

  test("div divides fields", () => {
    const result = from(students)
      .aggregate({
        total: add("math", "english", "science"),
        average: div("total", 3),
      })
      .value();
    expect(result[0]!.average).toBe(82);
    expect(result[1]!.average).toBe(70);
  });

  test("sub subtracts fields", () => {
    const result = from(students).aggregate({ gap: sub("science", "math") }).value();
    expect(result[0]!.gap).toBe(20);
    expect(result[1]!.gap).toBe(20);
    expect(result[2]!.gap).toBe(-6);
  });

  test("mul multiplies fields", () => {
    const result = from([{ price: 10, qty: 3 }]).aggregate({ total: mul("price", "qty") }).value();
    expect(result[0]!.total).toBe(30);
  });

  test("computed fields reference each other in order", () => {
    const result = from(students)
      .aggregate({
        total: add("math", "english", "science"),
        average: div("total", 3),
      })
      .omit(["total"])
      .value();

    expect(result[0]!.average).toBe(82);
    expect((result[0] as any).total).toBeUndefined();
  });

  test("literal numbers as operands", () => {
    const result = from([{ c: 10 }]).aggregate({ f: add(mul("c", 9 / 5), 32) }).first();
    expect(result!.f).toBe(50);
  });

  test("div by zero returns 0", () => {
    const result = from([{ a: 10, b: 0 }]).aggregate({ ratio: div("a", "b") }).first();
    expect(result!.ratio).toBe(0);
  });

  test("aggregate does not mutate original", () => {
    const data = [{ x: 5 }];
    from(data).aggregate({ y: add("x", 10) }).value();
    expect((data[0] as any).y).toBeUndefined();
  });
});
