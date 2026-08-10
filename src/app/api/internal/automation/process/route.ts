import { NextRequest, NextResponse } from "next/server";
import { automationProcessor } from "@/lib/services/processor";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.AUTOMATION_CRON_SECRET;

  if (!secret) {
    return new NextResponse("Automation endpoint disabled", { status: 404 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await automationProcessor.processDueAutomations();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Automation processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
