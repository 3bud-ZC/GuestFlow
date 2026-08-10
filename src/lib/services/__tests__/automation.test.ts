import { describe, it, expect, vi, beforeEach } from "vitest";
import { automationService } from "../automation";
import { automationProcessor } from "../processor";
import { MessageType, MessageStatus, GuestDocumentStatus, ReservationStatus } from "@prisma/client";
import { db } from "@/lib/db";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    propertySettings: {
      findUnique: vi.fn().mockResolvedValue({
        welcomeEnabled: true,
        locationEnabled: true,
        idReminderEnabled: true,
        checkoutReminderEnabled: true,
        reviewRequestEnabled: true
      }),
    },
    reservation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    message: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    task: {
      create: vi.fn(),
    },
  }
}));

vi.mock("../message", () => ({
  messageService: {
    getTemplateByType: vi.fn().mockResolvedValue({ id: "tmpl-1" }),
    resolveVariables: vi.fn().mockReturnValue([]),
  }
}));

vi.mock("../whatsapp", () => ({
  whatsappService: {
    normalizePhone: vi.fn().mockReturnValue("1234567890"),
    sendTemplateMessage: vi.fn().mockResolvedValue({ success: true, providerMessageId: "wamid-123" }),
  }
}));

vi.mock("../activity", () => ({
  logActivity: vi.fn(),
}));

describe("Automation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should schedule welcome message and location when reservation created", async () => {
    const mockRes = {
      id: "res-1",
      propertyId: "prop-1",
      checkInDate: new Date("2026-08-10T14:00:00Z"),
      checkOutDate: new Date("2026-08-12T10:00:00Z"),
      guest: { id: "guest-1", phone: "123456789", documentStatus: GuestDocumentStatus.PENDING }
    };

    (db.reservation.findUnique as any).mockResolvedValue(mockRes);
    (db.message.findFirst as any).mockResolvedValue(null);

    await automationService.onReservationCreated("res-1");

    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: MessageType.WELCOME,
          status: MessageStatus.SCHEDULED
        })
      })
    );

    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: MessageType.LOCATION,
          status: MessageStatus.SCHEDULED
        })
      })
    );
    
    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: MessageType.ID_REMINDER,
          status: MessageStatus.SCHEDULED
        })
      })
    );
  });

  it("should create missing phone task if guest has no phone", async () => {
    const mockRes = {
      id: "res-1",
      propertyId: "prop-1",
      checkInDate: new Date("2026-08-10T14:00:00Z"),
      checkOutDate: new Date("2026-08-12T10:00:00Z"),
      guest: { id: "guest-1", phone: null, documentStatus: GuestDocumentStatus.PENDING }
    };

    (db.reservation.findUnique as any).mockResolvedValue(mockRes);
    (db.message.findFirst as any).mockResolvedValue(null);

    await automationService.onReservationCreated("res-1");

    // Welcome task
    expect(db.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Get guest phone number"
        })
      })
    );
  });

  it("should cancel future ID reminder when ID received", async () => {
    (db.reservation.findMany as any).mockResolvedValue([{ id: "res-1" }]);
    (db.message.findMany as any).mockResolvedValue([{ id: "msg-1" }]);

    await automationService.onGuestIdReceived("guest-1");

    expect(db.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg-1" },
        data: { status: MessageStatus.CANCELLED }
      })
    );
  });
});

describe("Automation Processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process due messages and mark SENT", async () => {
    const dueMsg = {
      id: "msg-1",
      type: MessageType.WELCOME,
      reservationId: "res-1",
      guestId: "guest-1",
      reservation: { status: "CONFIRMED" },
      guest: { phone: "123456789" },
      template: { metaTemplateName: "welcome_test", languageCode: "en" }
    };

    (db.message.findMany as any).mockResolvedValue([dueMsg]);

    const result = await automationProcessor.processDueAutomations();

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);

    expect(db.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({ status: MessageStatus.SENT })
      })
    );
  });
});
