import { describe, it, expect } from "vitest";
import { can, SessionUser } from "../index";
import { Role } from "@prisma/client";

describe("Auth Authorization Helpers", () => {
  it("allows ADMIN to do anything", () => {
    const admin: SessionUser = { id: "1", email: "admin@guestflow.app", role: Role.ADMIN };
    expect(can(admin, "create:reservation")).toBe(true);
    expect(can(admin, "update:property_settings")).toBe(true);
    expect(can(admin, "delete:guest")).toBe(true);
  });

  it("restricts RECEPTION according to rules", () => {
    const reception: SessionUser = { id: "2", email: "frontdesk@guestflow.app", role: Role.RECEPTION };
    expect(can(reception, "create:reservation")).toBe(true);
    expect(can(reception, "view:reservation")).toBe(true);
    expect(can(reception, "update:property_settings")).toBe(false);
    expect(can(reception, "delete:guest")).toBe(false);
  });

  it("denies access when no user is provided", () => {
    expect(can(null, "view:reservation")).toBe(false);
  });
});
