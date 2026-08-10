import { config } from "dotenv";
import { join } from "path";
config({ path: join(__dirname, "../.env") });
import { db } from "../src/lib/db";
import { syncService } from "../src/lib/services/sync";
import fs from "fs";

const LOCK_FILE = "/tmp/guestflow-airbnb-sync.lock";
const LOG_FILE = "/var/www/guestflow/airbnb-sync.log";

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    // silently fail if log file isn't writable locally
  }
}

async function main() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockTimeStr = fs.readFileSync(LOCK_FILE, 'utf8');
    const lockTime = parseInt(lockTimeStr, 10);
    if (!isNaN(lockTime) && Date.now() - lockTime < 30 * 60 * 1000) {
      log("Sync locked. Exiting.");
      process.exit(0);
    } else {
      log("Found stale lock. Overriding...");
    }
  }

  try {
    fs.writeFileSync(LOCK_FILE, Date.now().toString());
    
    const rooms = await db.room.findMany({
      where: { airbnbSyncEnabled: true, airbnbIcalUrl: { not: null } }
    });

    log(`Found ${rooms.length} rooms to sync.`);

    for (const room of rooms) {
      log(`Syncing room ${room.name} (${room.id})...`);
      const result = await syncService.syncRoom(room.id);
      if (result.success) {
        log(`Success for room ${room.name}: ${JSON.stringify(result.summary)}`);
      } else {
        log(`Failed for room ${room.name}: ${result.error}`);
      }
    }
  } catch (error: any) {
    log(`CRITICAL ERROR during sync: ${error.message}`);
  } finally {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  }
}

main().catch(console.error);
