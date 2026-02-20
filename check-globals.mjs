import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlTable, int, text, varchar } from 'drizzle-orm/mysql-core';
import { eq } from 'drizzle-orm';

const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  category: varchar("category", { length: 100 }),
});

const db = drizzle(process.env.DATABASE_URL);
const globals = await db.select().from(articles).where(eq(articles.category, 'GLOBAL')).limit(10);

for (const a of globals) {
  console.log('---');
  console.log('ID:', a.id);
  console.log('Title:', a.title?.slice(0, 60));
  console.log('Image:', a.imageUrl?.slice(0, 150) || 'EMPTY');
  console.log('Video:', a.videoUrl?.slice(0, 150) || 'EMPTY');
  
  // Test if image URL is accessible
  if (a.imageUrl && a.imageUrl.length > 5) {
    try {
      const resp = await fetch(a.imageUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      console.log('Image Status:', resp.status, resp.headers.get('content-type'));
    } catch (e) {
      console.log('Image Error:', e.message);
    }
  }
}

process.exit(0);
