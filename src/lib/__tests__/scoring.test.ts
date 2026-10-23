import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateRoundScores,
  deriveRawScores,
  getRandomMultiplier,
} from "../scoring.ts";

describe("calculateRoundScores", () => {
  it("is zero-sum and multiplies the pairwise differences", () => {
    const r = calculateRoundScores(["a", "b", "c"], { a: 10, b: 0, c: -10 }, 2);
    assert.equal(r.totalNetScore, 0);
    // a: (10-0)+(10-(-10)) = 30, c: -30, both x2
    assert.deepEqual(r.netScores, { a: 60, b: 0, c: -60 });
    assert.equal(r.hasPositive, true);
  });

  it("treats a missing raw score as 0", () => {
    const r = calculateRoundScores(["a", "b"], { a: 5 }, 1);
    assert.deepEqual(r.netScores, { a: 5, b: -5 });
  });

  it("stays zero-sum for any integer scores", () => {
    const ids = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i++) {
      const raw = Object.fromEntries(
        ids.map((id) => [id, Math.floor(Math.random() * 201) - 100]),
      );
      assert.equal(calculateRoundScores(ids, raw, 5).totalNetScore, 0);
    }
  });
});

describe("deriveRawScores", () => {
  it("round-trips to the same net scores", () => {
    const ids = ["a", "b", "c", "d"];
    const raw = { a: 30, b: -5, c: 12, d: 0 };
    for (const m of [1, 2, 5, 20, 50]) {
      const net = calculateRoundScores(ids, raw, m).netScores;
      const derived = deriveRawScores(net, m);
      assert.deepEqual(calculateRoundScores(ids, derived, m).netScores, net);
      assert.equal(Math.min(...Object.values(derived)), 0);
    }
  });

  it("handles degenerate input without NaN", () => {
    assert.deepEqual(deriveRawScores({}, 5), {});
    assert.deepEqual(deriveRawScores({ a: 0 }, 5), { a: 0 });
    assert.deepEqual(deriveRawScores({ a: 0, b: 0 }, 0), { a: 0, b: 0 });
  });
});

describe("getRandomMultiplier", () => {
  const table: Array<[number, number]> = [
    [0, 1],
    [4.99, 1],
    [5, 2],
    [14.99, 2],
    [15, 4],
    [29.99, 4],
    [30, 5],
    [54.99, 5],
    [55, 8],
    [79.99, 8],
    [80, 10],
    [94.99, 10],
    [95, 20],
    [99.99, 20],
  ];

  for (const [rand, expected] of table) {
    it(`rand ${rand} -> x${expected}`, () => {
      assert.equal(getRandomMultiplier(rand), expected);
    });
  }

  it("never returns x50 and matches the configured odds", () => {
    const counts = new Map<number, number>();
    const total = 200_000;
    for (let i = 0; i < total; i++) {
      const m = getRandomMultiplier();
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    assert.equal(counts.get(50), undefined);
    const expected: Record<number, number> = {
      1: 5, 2: 10, 4: 15, 5: 25, 8: 25, 10: 15, 20: 5,
    };
    for (const [m, pct] of Object.entries(expected)) {
      const actual = ((counts.get(Number(m)) ?? 0) / total) * 100;
      assert.ok(
        Math.abs(actual - pct) < 1,
        `x${m}: expected ~${pct}%, got ${actual.toFixed(2)}%`,
      );
    }
  });
});
