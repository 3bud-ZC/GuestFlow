import { automationProcessor } from "../src/lib/services/processor";
import { db } from "../src/lib/db";

async function run() {
  console.log("Running automation processor...");
  try {
    const result = await automationProcessor.processDueAutomations();
    console.log(`Processor finished. Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
  } catch (error) {
    console.error("Processor failed:", error);
  } finally {
    await db.$disconnect();
  }
}

run();
