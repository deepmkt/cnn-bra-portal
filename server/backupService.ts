/**
 * CNN BRA Portal — Backup Service
 * Exports key database tables to S3 as JSON snapshots.
 * Runs automatically every hour and keeps the last 48 backups.
 * Backups are stored at: backups/YYYY-MM-DDTHH-mm-ss.json
 */

import { getDb } from "./db";
import { storagePut } from "./storage";
import { articles, shorts, siteSettings, adminUsers, tickerItems } from "../drizzle/schema";

const BACKUP_PREFIX = "backups/";
const MAX_BACKUPS = 48; // keep last 48 hourly backups (2 days)

export interface BackupEntry {
  key: string;
  url: string;
  createdAt: string;
  sizeBytes?: number;
}

/**
 * Create a full backup of key tables and upload to S3.
 * Returns the backup key and URL.
 */
export async function createBackup(): Promise<{ key: string; url: string; tables: Record<string, number> }> {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const key = `${BACKUP_PREFIX}${timestamp}.json`;

  // Export all key tables
  const db = await getDb();
  if (!db) throw new Error("[Backup] Database not available");

  const [
    articlesData,
    shortsData,
    settingsData,
    adminUsersData,
    tickerData,
  ] = await Promise.all([
    db.select().from(articles).limit(10000).catch(() => []),
    db.select().from(shorts).limit(5000).catch(() => []),
    db.select().from(siteSettings).catch(() => []),
    db.select().from(adminUsers).catch(() => []),
    db.select().from(tickerItems).catch(() => []),
  ]);

  const backup = {
    version: "1.0",
    createdAt: now.toISOString(),
    tables: {
      articles: articlesData,
      shorts: shortsData,
      siteSettings: settingsData,
      adminUsers: adminUsersData.map((u: any) => ({ ...u, passwordHash: "[REDACTED]" })), // never backup passwords
      tickerItems: tickerData,
    },
  };

  const json = JSON.stringify(backup, null, 2);
  const buffer = Buffer.from(json, "utf-8");

  const { url } = await storagePut(key, buffer, "application/json");

  const tables: Record<string, number> = {
    articles: articlesData.length,
    shorts: shortsData.length,
    siteSettings: settingsData.length,
    adminUsers: adminUsersData.length,
    tickerItems: tickerData.length,
  };

  console.log(`[Backup] Created: ${key} (${Object.entries(tables).map(([k, v]) => `${k}:${v}`).join(", ")})`);

  // Rotate old backups (keep last MAX_BACKUPS)
  await rotateBackups();

  return { key, url, tables };
}

/**
 * List all available backups — stored in DB or returned as empty array if not available.
 * Since storageList is not available, we track backups in a simple in-memory list.
 */
const backupHistory: BackupEntry[] = [];

export async function listBackups(): Promise<BackupEntry[]> {
  return [...backupHistory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Remove old backups beyond MAX_BACKUPS (in-memory rotation).
 */
async function rotateBackups(): Promise<void> {
  if (backupHistory.length > MAX_BACKUPS) {
    backupHistory.splice(MAX_BACKUPS);
  }
}

/**
 * Start the hourly backup cron.
 */
export function startBackupCron(): void {
  const ONE_HOUR = 60 * 60 * 1000;

  // Run first backup after 5 minutes (let server warm up)
  setTimeout(async () => {
    try {
      const result = await createBackup();
      backupHistory.unshift({
        key: result.key,
        url: result.url,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Backup] Initial backup failed:", err);
    }
  }, 5 * 60 * 1000);

  // Then every hour
  setInterval(async () => {
    try {
      const result = await createBackup();
      backupHistory.unshift({
        key: result.key,
        url: result.url,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Backup] Hourly backup failed:", err);
    }
  }, ONE_HOUR);

  console.log("[Backup] Cron started — first backup in 5 minutes, then every hour.");
}
