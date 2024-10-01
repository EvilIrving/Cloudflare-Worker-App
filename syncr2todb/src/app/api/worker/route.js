// In the edge runtime you can use Bindings that are available in your application
// (for more details see:
//    - https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/#use-bindings-in-your-nextjs-application
//    - https://developers.cloudflare.com/pages/functions/bindings/
// )
//
// KV Example:
// const myKv = getRequestContext().env.MY_KV_NAMESPACE
// await myKv.put('suffix', ' from a KV store!')
// const suffix = await myKv.get('suffix')
// responseText += suffix

import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";
const r2_path = "https://pub-9350f14105fb48d49bb0de3e2822bc9e.r2.dev/";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const { env } = getRequestContext();

  let message = "";

  try {
    switch (action) {
      case "syncR2ToDB":
        await syncR2ToDB(env.graph_bk, env.graph_db);
        message = "R2 Bucket synced to DB successfully";
        break;
      case "resetR2":
        await resetR2(env.graph_bk);
        message = "R2 Bucket reset successfully";
        break;
      case "resetD1":
        await env.graph_db.prepare("DELETE FROM photos").run();
        message = "D1 Database Table Data reset successfully";
        break;
      default:
        message = "Invalid action";
    }
  } catch (error) {
    message = `Error: ${error.message}`;
  }

  return new Response(JSON.stringify({ message }), {
    headers: { "Content-Type": "application/json" },
  });
}
async function syncR2ToDB(bucket, db) {
  const stmt = db.prepare(`
    INSERT INTO photos (name, url, isUsed)
    VALUES (?, ?, false)
  `);

  let cursor;
  do {
    const listed = await bucket.list({ cursor });
    for (const object of listed.objects) {
      await stmt.bind(object.key, `${r2_path}${object.key}`).run();
    }
    cursor = listed.cursor;
    if (cursor) {
      await sleep(60 * 1000); // wait for 1 minute before fetching next page
    }
  } while (cursor);
  stmt.finalize();
  return true;
}
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function resetR2(bucket) {
  let cursor;
  do {
    const listed = await bucket.list({ cursor });
    for (const object of listed.objects) {
      await this.bucket.delete(object.key);
    }
    cursor = listed.cursor;
  } while (cursor);
  return true;
}
// Keep the GET method for backward compatibility
export async function GET() {
  return new Response("Use POST method with action parameter", { status: 400 });
}
