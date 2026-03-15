import { describe, expect, test } from "vitest";
import { from, eq, ne, lt, lte, gt, gte, between, exists, missing, oneOf, includes, startsWith, endsWith, matches, length, lengthGt, lengthLt, empty, notEmpty, fn } from "../src";

const planets = [
  { name: "Mercury", temp: { avg: 167 }, moons: [], type: "rocky" },
  { name: "Venus", temp: { avg: 464 }, moons: [], type: "rocky" },
  { name: "Earth", temp: { avg: 15 }, moons: ["Luna"], type: "rocky", population: 8_000_000_000 },
  { name: "Mars", temp: { avg: -63 }, moons: ["Phobos", "Deimos"], type: "rocky" },
  { name: "Jupiter", temp: { avg: -145 }, moons: ["Io", "Europa", "Ganymede", "Callisto"], type: "gas" },
  { name: "Saturn", temp: { avg: -178 }, moons: ["Titan", "Enceladus"], type: "gas" },
];

describe("comparison operators", () => {
  test("eq matches exact value", () => {
    const result = from(planets).where("name", eq("Earth")).value();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Earth");
  });

  test("ne excludes exact value", () => {
    const result = from(planets).where("name", ne("Earth")).value();
    expect(result.every((p) => p.name !== "Earth")).toBe(true);
  });

  test("lt with numbers", () => {
    const result = from(planets).where("temp.avg", lt(0)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Mars", "Saturn"]);
  });

  test("lte with numbers", () => {
    const result = from(planets).where("temp.avg", lte(-145)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Saturn"]);
  });

  test("gt with numbers", () => {
    const result = from(planets).where("temp.avg", gt(100)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mercury", "Venus"]);
  });

  test("gte with numbers", () => {
    const result = from(planets).where("temp.avg", gte(167)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mercury", "Venus"]);
  });

  test("between inclusive range", () => {
    const result = from(planets).where("temp.avg", between(-100, 100)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Earth", "Mars"]);
  });

  test("gt compares array length when used on arrays", () => {
    const result = from(planets).where("moons", gt(2)).value();
    expect(result.map((p) => p.name)).toEqual(["Jupiter"]);
  });
});

describe("existence operators", () => {
  test("exists filters to defined values", () => {
    const result = from(planets).where("population", exists()).value();
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Earth");
  });

  test("missing filters to undefined/null values", () => {
    const result = from(planets).where("population", missing()).value();
    expect(result).toHaveLength(5);
  });
});

describe("string/array operators", () => {
  test("includes on strings", () => {
    const result = from(planets).where("name", includes("ar")).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Earth", "Mars"]);
  });

  test("includes on arrays", () => {
    const result = from(planets).where("moons", includes("Titan")).value();
    expect(result[0]!.name).toBe("Saturn");
  });

  test("startsWith", () => {
    const result = from(planets).where("name", startsWith("M")).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mars", "Mercury"]);
  });

  test("endsWith", () => {
    const result = from(planets).where("name", endsWith("us")).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Venus"]);
  });

  test("matches regex", () => {
    const result = from(planets).where("name", matches(/^[EMS]/)).value();
    expect(result).toHaveLength(4);
  });

  test("length exact", () => {
    const result = from(planets).where("moons", length(2)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mars", "Saturn"]);
  });

  test("lengthGt", () => {
    const result = from(planets).where("moons", lengthGt(2)).value();
    expect(result[0]!.name).toBe("Jupiter");
  });

  test("lengthLt", () => {
    const result = from(planets).where("moons", lengthLt(1)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mercury", "Venus"]);
  });

  test("empty", () => {
    const result = from(planets).where("moons", empty()).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Mercury", "Venus"]);
  });

  test("notEmpty", () => {
    const result = from(planets).where("moons", notEmpty()).value();
    expect(result).toHaveLength(4);
  });
});

describe("collection operators", () => {
  test("oneOf matches any value in list", () => {
    const result = from(planets).where("type", oneOf(["gas"])).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Saturn"]);
  });
});

describe("custom operators", () => {
  test("fn allows arbitrary predicate", () => {
    const result = from(planets).where("name", fn((v: unknown) => String(v).length > 5)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Mercury", "Saturn"]);
  });
});

describe("predicate where", () => {
  test("accepts raw predicate function", () => {
    const result = from(planets).where((p) => p.name === "Earth").value();
    expect(result).toHaveLength(1);
  });

  test("composes with operator where", () => {
    const result = from(planets)
      .where("type", eq("rocky"))
      .where((p) => p.name.startsWith("E"))
      .value();
    expect(result[0]!.name).toBe("Earth");
  });
});

describe("multiple where (implicit AND)", () => {
  test("all conditions must match", () => {
    const result = from(planets)
      .where("temp.avg", lt(0))
      .where("moons", lengthGt(1))
      .where("type", eq("gas"))
      .value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Saturn"]);
  });
});

describe("dot path access", () => {
  test("accesses nested properties", () => {
    const result = from(planets).where("temp.avg", lt(-100)).value();
    expect(result.map((p) => p.name).sort()).toEqual(["Jupiter", "Saturn"]);
  });
});
