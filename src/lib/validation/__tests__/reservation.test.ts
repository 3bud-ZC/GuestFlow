import { describe, it, expect } from "vitest";
import { ReservationSchema } from "../reservation";
import { ReservationPlatform, ReservationStatus } from "@prisma/client";

describe("Reservation Validation", () => {
  const validBase = {
    code: "RES-12345",
    platform: ReservationPlatform.AIRBNB,
    guestId: "123e4567-e89b-12d3-a456-426614174000",
    propertyId: "123e4567-e89b-12d3-a456-426614174001",
    roomId: "123e4567-e89b-12d3-a456-426614174002",
    checkInDate: new Date("2024-01-01"),
    checkOutDate: new Date("2024-01-05"),
    numberOfGuests: 2,
  };

  it("validates a correct reservation input", () => {
    const result = ReservationSchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe(ReservationStatus.CONFIRMED);
    }
  });

  it("fails if platform is invalid", () => {
    const input = { ...validBase, platform: "EXPEDIA" };
    expect(ReservationSchema.safeParse(input).success).toBe(false);
  });

  it("fails if guest count is less than 1", () => {
    const input = { ...validBase, numberOfGuests: 0 };
    expect(ReservationSchema.safeParse(input).success).toBe(false);
  });

  it("fails if check-out date is not after check-in date", () => {
    const input = { 
      ...validBase, 
      checkInDate: new Date("2024-01-05"), 
      checkOutDate: new Date("2024-01-01") 
    };
    expect(ReservationSchema.safeParse(input).success).toBe(false);

    const sameDay = { 
      ...validBase, 
      checkInDate: new Date("2024-01-05"), 
      checkOutDate: new Date("2024-01-05") 
    };
    expect(ReservationSchema.safeParse(sameDay).success).toBe(false);
  });
});
