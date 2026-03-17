import { getPath } from "../utils/path.js";

export type AggregateOp = (item: unknown) => unknown;

type Operand = string | number | AggregateOp;

const getNumber = (item: unknown, operand: Operand): number => {
  if (typeof operand === "number") return operand;
  if (typeof operand === "function") {
    const v = operand(item);
    return typeof v === "number" ? v : 0;
  }

  const value = getPath(item, operand);
  return typeof value === "number" ? value : 0;
};

export const add = (...operands: Operand[]): AggregateOp => (item) =>
  operands.reduce<number>((sum, op) => sum + getNumber(item, op), 0);

export const sub = (a: Operand, b: Operand): AggregateOp => (item) =>
  getNumber(item, a) - getNumber(item, b);

export const mul = (a: Operand, b: Operand): AggregateOp => (item) =>
  getNumber(item, a) * getNumber(item, b);

export const div = (a: Operand, b: Operand): AggregateOp => (item) => {
  const denom = getNumber(item, b);
  return denom === 0 ? 0 : getNumber(item, a) / denom;
};
