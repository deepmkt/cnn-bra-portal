import { replaceGoogleLogosWithPlaceholders } from "./server/replaceGoogleLogos.ts";
import "dotenv/config";

console.log("Starting replace logos job...");

replaceGoogleLogosWithPlaceholders()
  .then((replaced) => {
    console.log(`Job complete: ${replaced} articles updated`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Job failed:", err);
    process.exit(1);
  });
