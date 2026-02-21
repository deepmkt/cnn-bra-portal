import { fixAllArticleImages } from "./server/fixAllImages.ts";
import "dotenv/config";

console.log("Starting image fix job...");

fixAllArticleImages()
  .then((fixed) => {
    console.log(`Job complete: ${fixed} articles fixed`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Job failed:", err);
    process.exit(1);
  });
