import { describe, it, expect } from "vitest";
import { GuestSchema } from "../guest";
import { GuestDocumentStatus } from "@prisma/client";

describe("Guest Validation", () => {
  it("validates a correct guest input", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    };
    
    const result = GuestSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.documentStatus).toBe(GuestDocumentStatus.PENDING);
    }
  });

  it("fails if first name or last name is missing or empty", () => {
    expect(GuestSchema.safeParse({ firstName: "", lastName: "Doe" }).success).toBe(false);
    expect(GuestSchema.safeParse({ firstName: "John", lastName: "" }).success).toBe(false);
  });

  it("fails on invalid email", () => {
    expect(GuestSchema.safeParse({ firstName: "John", lastName: "Doe", email: "invalid-email" }).success).toBe(false);
  });

  it("accepts valid enum for documentStatus", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      documentStatus: GuestDocumentStatus.RECEIVED,
    };
    const result = GuestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("fails on invalid documentStatus enum", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      documentStatus: "INVALID_STATUS",
    };
    expect(GuestSchema.safeParse(input).success).toBe(false);
  });
});
