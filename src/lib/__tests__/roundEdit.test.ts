import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRoundEdit } from "../roundEdit.ts";
import type { RoomData } from "../../types/models.ts";

function makeRoom(): RoomData {
  return {
    players: [
      { id: "a", name: "A", image: "", totalScore: 100, latestScore: 100 },
      { id: "b", name: "B", image: "", totalScore: -100, latestScore: -100 },
    ],
    groups: [
      { id: "a_b", name: "A + B", playerIds: ["a", "b"], scores: { a: 100, b: -100 } },
    ],
    history: {
      "1": {
        id: "1",
        timestamp: "2026-01-01T00:00:00.000Z",
        groupName: "A + B",
        groupId: "a_b",
        multiplier: 1,
        playerScores: { a: 40, b: -40 },
        commentary: "",
      },
      "2": {
        id: "2",
        timestamp: "2026-01-02T00:00:00.000Z",
        groupName: "A + B",
        groupId: "a_b",
        multiplier: 1,
        playerScores: { a: 60, b: -60 },
        commentary: "",
      },
    },
  };
}

describe("applyRoundEdit", () => {
  it("swaps the old round for the new one in totals and group scores", () => {
    const room = applyRoundEdit(makeRoom(), "2", { a: -20, b: 20 }, 2, "");
    // 100 - 60 + (-20) = 20 ; -100 + 60 + 20 = -20
    assert.equal(room.players[0].totalScore, 20);
    assert.equal(room.players[1].totalScore, -20);
    assert.deepEqual(room.groups[0].scores, { a: 20, b: -20 });
    assert.equal(room.history["2"].multiplier, 2);
    assert.deepEqual(room.history["2"].playerScores, { a: -20, b: 20 });
  });

  it("keeps the round id and timestamp", () => {
    const room = applyRoundEdit(makeRoom(), "2", { a: 1, b: -1 }, 1, "");
    assert.equal(room.history["2"].id, "2");
    assert.equal(room.history["2"].timestamp, "2026-01-02T00:00:00.000Z");
  });

  it("only updates latestScore when editing the newest round", () => {
    const newest = applyRoundEdit(makeRoom(), "2", { a: 5, b: -5 }, 1, "");
    assert.equal(newest.players[0].latestScore, 5);
    const older = applyRoundEdit(makeRoom(), "1", { a: 5, b: -5 }, 1, "");
    assert.equal(older.players[0].latestScore, 100);
  });

  it("returns the room unchanged when the round does not exist", () => {
    const room = makeRoom();
    assert.equal(applyRoundEdit(room, "999", { a: 1, b: -1 }, 1, ""), room);
  });

  it("does not mutate the input room", () => {
    const room = makeRoom();
    const snapshot = JSON.stringify(room);
    applyRoundEdit(room, "2", { a: 9, b: -9 }, 4, "");
    assert.equal(JSON.stringify(room), snapshot);
  });
});
