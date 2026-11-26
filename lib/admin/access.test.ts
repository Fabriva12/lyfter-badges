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
  const event = { organizerId: "organizer-1", companyId: "company-1" };

  it("lets an admin of the owning company access any stand of that event", () => {
    expect(canAccessStand(admin, { partnerId: null, event })).toBe(true);
    expect(canAccessStand(admin, { partnerId: "admin-2", event })).toBe(true);
  });

  it("lets the legacy organizer access a stand without a company", () => {
    expect(
      canAccessStand(
        { ...admin, id: "organizer-1", companyIds: [] },
        {
          partnerId: null,
          event: { organizerId: "organizer-1", companyId: null },
        },
      ),
    ).toBe(true);
  });

  it("blocks an admin from another company's stand", () => {
    expect(canAccessStand(otherAdmin, { partnerId: null, event })).toBe(false);
  });

  it("lets the assigned partner in without company membership", () => {
    expect(
      canAccessStand(
        { ...admin, companyIds: [] },
        { partnerId: "admin-1", event },
      ),
    ).toBe(true);
  });

  it("lets a super admin inspect any stand", () => {
    expect(canAccessStand(superAdmin, { partnerId: "admin-1", event })).toBe(
      true,
    );
    expect(canAccessStand(superAdmin, { partnerId: null, event })).toBe(true);
  });

  it("blocks attendees even when the id matches the partner", () => {
    expect(canAccessStand(attendee, { partnerId: "attendee-1", event })).toBe(
      false,
    );
  });
});
