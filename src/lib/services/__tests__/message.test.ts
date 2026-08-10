import { describe, it, expect, vi, beforeEach } from "vitest";
import { messageService } from "../message";
import { whatsappService } from "../whatsapp";
import { MessageType, MessageStatus } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    messageTemplate: {
      findFirst: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    reservation: {
      findUnique: vi.fn(),
    },
    task: {
      create: vi.fn(),
    }
  }
}));

vi.mock("../whatsapp", () => ({
  whatsappService: {
    normalizePhone: vi.fn(),
    sendTemplateMessage: vi.fn(),
  }
}));

vi.mock("../activity", () => ({
  logActivity: vi.fn(),
}));

describe("Message Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Variables Resolution", () => {
    it("should resolve WELCOME variables correctly", () => {
      const mockReservation = {
        guest: { firstName: "John" },
        property: { name: "Villa Seaside" }
      };
      const params = messageService.resolveVariables(MessageType.WELCOME, mockReservation);
      
      expect(params).toHaveLength(2);
      expect(params[0].text).toBe("John");
      expect(params[1].text).toBe("Villa Seaside");
    });
    
    it("should handle missing required values gracefully", () => {
      const mockReservation = {
        guest: {},
        property: {}
      };
      const params = messageService.resolveVariables(MessageType.WELCOME, mockReservation);
      
      expect(params).toHaveLength(2);
      expect(params[0].text).toBeUndefined();
      expect(params[1].text).toBeUndefined();
    });
  });



  describe("Status Mapping", () => {
    it("should map sent to SENT", async () => {
      const { db } = await import("@/lib/db");
      (db.message.findFirst as any).mockResolvedValue({ id: "1", status: MessageStatus.SENDING });
      (db.message.update as any).mockResolvedValue({});

      await messageService.handleWebhookStatusUpdate("provider-123", "sent");

      expect(db.message.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: MessageStatus.SENT })
      }));
    });

    it("should map failed to FAILED and set failedTime", async () => {
      const { db } = await import("@/lib/db");
      (db.message.findFirst as any).mockResolvedValue({ id: "1", status: MessageStatus.SENT });
      (db.message.update as any).mockResolvedValue({});

      await messageService.handleWebhookStatusUpdate("provider-123", "failed");

      expect(db.message.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ 
          status: MessageStatus.FAILED,
          failedTime: expect.any(Date)
        })
      }));
    });

    it("should prevent regression from READ to DELIVERED", async () => {
      const { db } = await import("@/lib/db");
      (db.message.findFirst as any).mockResolvedValue({ id: "1", status: MessageStatus.READ });
      (db.message.update as any).mockResolvedValue({});

      await messageService.handleWebhookStatusUpdate("provider-123", "delivered");

      expect(db.message.update).not.toHaveBeenCalled();
    });
  });
});

describe("WhatsApp Service Phone Normalization", () => {
  it("should normalize phone number", async () => {
    // We have to import the actual implementation for this test
    const { whatsappService: realWhatsappService } = await vi.importActual<any>("../whatsapp");
    
    expect(realWhatsappService.normalizePhone("+20 123-456-7890")).toBe("201234567890");
    expect(realWhatsappService.normalizePhone("not-a-number")).toBeNull();
    expect(realWhatsappService.normalizePhone("123")).toBeNull(); // Too short
  });
});
