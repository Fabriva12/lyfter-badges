import { describe, expect, it } from "vitest";

import {
  isLeaderboardMetric,
  rankAttendees,
  type LeaderboardEntry,
} from "./leaderboard";

const entries: LeaderboardEntry[] = [
  {
    userId: "user-ada",
    name: "Ada Attendee",
    image: null,
    xp: 110,
    badges: 2,
    stands: 0,
    talks: 2,
  },
  {
    userId: "user-bruno",
    name: "Bruno Builder",
    image: null,
    xp: 150,
    badges: 3,
    stands: 1,
    talks: 2,
  },
  {
    userId: "user-carla",
    name: "Carla Coder",
    image: null,
    xp: 120,
    badges: 2,
    stands: 0,
    talks: 2,
  },
  {
    userId: "user-dani",
    name: "Dani Dev",
    image: null,
    xp: 50,
    badges: 1,
    stands: 0,
    talks: 1,
  },
  {
    userId: "user-ema",
    name: "Ema Event",
    image: null,
    xp: 220,
    badges: 4,
    stands: 1,
    talks: 3,
  },
];

const tiedEntries: LeaderboardEntry[] = [
  {
    userId: "user-ada",
    name: "Ada Attendee",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-bruno",
    name: "Bruno Builder",
    image: null,
    xp: 100,
    badges: 3,
    stands: 1,
    talks: 2,
  },
  {
    userId: "user-carla",
    name: "Carla Coder",
    image: null,
    xp: 80,
    badges: 1,
    stands: 0,
    talks: 1,
  },
];

const equalEntries: LeaderboardEntry[] = [
  {
    userId: "user-ada",
    name: "Ada Attendee",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-bruno",
    name: "Bruno Builder",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-carla",
    name: "Carla Coder",
    image: null,
    xp: 80,
    badges: 1,
    stands: 0,
    talks: 1,
  },
];

const sameGroupEntries: LeaderboardEntry[] = [
  {
    userId: "user-carla",
    name: "Carla Coder",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-ada",
    name: "Ada Attendee",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-bruno",
    name: "Bruno Builder",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
];

const sameNameEntries: LeaderboardEntry[] = [
  {
    userId: "user-bruno",
    name: "Ada Attendee",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
  {
    userId: "user-ada",
    name: "Ada Attendee",
    image: null,
    xp: 100,
    badges: 2,
    stands: 1,
    talks: 1,
  },
];

describe("rankAttendees", () => {
  it("sorts attendees by XP descending by default", () => {
    const result = rankAttendees(entries);

    expect(result.rows[0].name).toBe("Ema Event");
    expect(result.rows[1].name).toBe("Bruno Builder");
    expect(result.rows[2].name).toBe("Carla Coder");
    expect(result.rows[3].name).toBe("Ada Attendee");
    expect(result.rows[4].name).toBe("Dani Dev");
  });

  it("breaks an XP tie by badge count", () => {
    const result = rankAttendees(tiedEntries);

    expect(result.rows[0].name).toBe("Bruno Builder");
    expect(result.rows[1].name).toBe("Ada Attendee");
    expect(result.rows[2].name).toBe("Carla Coder");
  });

  it("ranks by stands, then talks and XP", () => {
    const result = rankAttendees(entries, "stands");

    expect(result.rows.map((row) => row.name)).toEqual([
      "Ema Event",
      "Bruno Builder",
      "Carla Coder",
      "Ada Attendee",
      "Dani Dev",
    ]);
  });

  it("ranks by talks, then stands and XP", () => {
    const result = rankAttendees(entries, "talks");

    expect(result.rows.map((row) => row.name)).toEqual([
      "Ema Event",
      "Bruno Builder",
      "Carla Coder",
      "Ada Attendee",
      "Dani Dev",
    ]);
  });

  it("gives tied attendees the same rank and skips the next one", () => {
    const result = rankAttendees(equalEntries);

    expect(result.rows[0].rank).toBe(1);
    expect(result.rows[1].rank).toBe(1);
    expect(result.rows[2].rank).toBe(3);
  });

  it("shares the rank inside the selected metric when stats tie", () => {
    const result = rankAttendees(equalEntries, "stands");

    expect(result.rows[0].rank).toBe(1);
    expect(result.rows[1].rank).toBe(1);
    expect(result.rows[2].rank).toBe(3);
  });

  it("sorts alphabetically inside a tied group", () => {
    const result = rankAttendees(sameGroupEntries);

    expect(result.rows[0].name).toBe("Ada Attendee");
    expect(result.rows[1].name).toBe("Bruno Builder");
    expect(result.rows[2].name).toBe("Carla Coder");
  });

  it("returns an empty ranking when there are no attendees", () => {
    const result = rankAttendees([]);

    expect(result.rows).toHaveLength(0);
    expect(result.top).toHaveLength(0);
  });

  it("exposes the top three attendees for the selected metric", () => {
    const result = rankAttendees(entries, "talks");

    expect(result.top).toHaveLength(3);
    expect(result.top[0].name).toBe("Ema Event");
    expect(result.top[1].name).toBe("Bruno Builder");
    expect(result.top[2].name).toBe("Carla Coder");
  });

  it("keeps the position sequential when the rank skips", () => {
    const result = rankAttendees(equalEntries);

    expect(result.rows[0].position).toBe(1);
    expect(result.rows[1].position).toBe(2);
    expect(result.rows[2].position).toBe(3);
  });

  it("clamps negative XP, badges, stands and talks to zero", () => {
    const result = rankAttendees([
      {
        userId: "user-ada",
        name: "Ada Attendee",
        image: null,
        xp: -10,
        badges: -3,
        stands: -2,
        talks: -4,
      },
    ]);

    expect(result.rows[0].xp).toBe(0);
    expect(result.rows[0].badges).toBe(0);
    expect(result.rows[0].stands).toBe(0);
    expect(result.rows[0].talks).toBe(0);
  });

  it("breaks the final tie by user id when the names match", () => {
    const result = rankAttendees(sameNameEntries);

    expect(result.rows[0].userId).toBe("user-ada");
    expect(result.rows[1].userId).toBe("user-bruno");
  });
});

describe("isLeaderboardMetric", () => {
  it("accepts the supported metrics", () => {
    expect(isLeaderboardMetric("xp")).toBe(true);
    expect(isLeaderboardMetric("stands")).toBe(true);
    expect(isLeaderboardMetric("talks")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isLeaderboardMetric("badges")).toBe(false);
    expect(isLeaderboardMetric("")).toBe(false);
    expect(isLeaderboardMetric(undefined)).toBe(false);
    expect(isLeaderboardMetric(null)).toBe(false);
  });
});
