import { NextRequest, NextResponse } from "next/server";
import { messageService } from "@/lib/services/message";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_APP_SECRET;

    if (appSecret && signatureHeader) {
      const hmac = crypto.createHmac("sha256", appSecret);
      const digest = "sha256=" + hmac.update(rawBody).digest("hex");
      if (
        signatureHeader.length !== digest.length ||
        !crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(digest))
      ) {
        console.error("Webhook signature mismatch.");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.statuses &&
        body.entry[0].changes[0].value.statuses[0]
      ) {
        const statusObj = body.entry[0].changes[0].value.statuses[0];
        const providerMessageId = statusObj.id;
        const statusText = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

        if (providerMessageId && statusText) {
          await messageService.handleWebhookStatusUpdate(providerMessageId, statusText);
        }
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (err) {
    // Return 200 even on processing errors so Meta doesn't unnecessarily retry bad payloads
    console.error("Webhook processing error:", err);
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }
}
