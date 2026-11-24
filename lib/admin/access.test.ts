import { describe, expect, it } from "vitest";

import { canAccessStand, canManageEvent, canOpenAdmin } from "./access";

const admin = {
  id: "admin-1",
  role: "ADMIN" as const,
  companyIds: ["company-1"],
};
const otherAdmin = {
  id: "admin-2",
  role: "ADMIN" as const,
  companyIds: ["company-2"],
};
const superAdmin = {
  id: "super-1",
  role: "SUPER_ADMIN" as const,
  companyIds: [],
};
const attendee = {
  id: "attendee-1",
  role: "ATTENDEE" as const,
  companyIds: [],
};

describe("canOpenAdmin", () => {
  it("lets admins and super admins in", () => {
    expect(canOpenAdmin(admin)).toBe(true);
    expect(canOpenAdmin(superAdmin)).toBe(true);
  });

  it("keeps attendees and roleless users out", () => {
    expect(canOpenAdmin(attendee)).toBe(false);
    expect(canOpenAdmin({ id: "u-1", role: null, companyIds: [] })).toBe(
      false,
    );
    expect(canOpenAdmin({ id: "u-1", role: undefined, companyIds: [] })).toBe(
      false,
    );
  });
});

describe("canManageEvent", () => {
  it("lets a super admin manage any event", () => {
    expect(
      canManageEvent(superAdmin, {
        organizerId: "someone-else",
        companyId: "company-9",
      }),
    ).toBe(true);
    expect(
      canManageEvent(superAdmin, { organizerId: "someone-else", companyId: null }),
    ).toBe(true);
  });

  it("lets an admin manage events of a company they belong to", () => {
    expect(
      canManageEvent(admin, { organizerId: "someone-else", companyId: "company-1" }),
    ).toBe(true);
  });

  it("blocks an admin from another company's event", () => {
    expect(
      canManageEvent(admin, { organizerId: "someone-else", companyId: "company-2" }),
    ).toBe(false);
  });

  it("falls back to organizerId for legacy events without a company", () => {
    expect(canManageEvent(admin, { organizerId: "admin-1", companyId: null })).toBe(
      true,
    );
    expect(canManageEvent(admin, { organizerId: "admin-2", companyId: null })).toBe(
      false,
    );
  });

  it("blocks attendees even when the id matches", () => {
    expect(
      canManageEvent(attendee, { organizerId: "attendee-1", companyId: null }),
    ).toBe(false);
  });
});

describe("canAccessStand", () => {
  it("lets an admin access the stand assigned to them", () => {
    expect(canAccessStand(admin, { partnerId: "admin-1" })).toBe(true);
  });

  it("blocks an admin from another admin's stand", () => {
    expect(canAccessStand(admin, { partnerId: "admin-2" })).toBe(false);
  });

  it("lets a super admin inspect any stand", () => {
    expect(canAccessStand(superAdmin, { partnerId: "admin-1" })).toBe(true);
    expect(canAccessStand(superAdmin, { partnerId: null })).toBe(true);
  });

  it("blocks access to an unassigned stand", () => {
    expect(canAccessStand(admin, { partnerId: null })).toBe(false);
  });

  it("blocks attendees from the stand view", () => {
    expect(canAccessStand(attendee, { partnerId: "attendee-1" })).toBe(false);
  });

  it("keeps unrelated admins out even if they share company access", () => {
    expect(canAccessStand(otherAdmin, { partnerId: "admin-1" })).toBe(false);
  });
});
