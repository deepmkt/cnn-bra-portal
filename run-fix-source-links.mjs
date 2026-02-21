/**
 * Standalone script to fix source links in all articles.
 * Run with: node run-fix-source-links.mjs
 */
import { fixAllSourceLinks } from "./server/fixSourceLinks.ts";

console.log("Starting source link fix job...");
const fixed = await fixAllSourceLinks();
console.log(`Job complete: ${fixed} articles fixed`);
process.exit(0);
