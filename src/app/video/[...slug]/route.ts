// src/app/video/[...slug]/route.ts
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function safeJoin(base: string, parts: string[]) {
  const full = path.join(base, ...parts);
  const resolvedBase = path.resolve(base) + path.sep;
  const resolvedFull = path.resolve(full);
  if (!resolvedFull.startsWith(resolvedBase)) throw new Error("Invalid path");
  return resolvedFull;
}

export async function GET(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await ctx.params;
  const filePath = safeJoin(path.join(process.cwd(), "content", "video"), slug);
  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const size = stat.size;

  const range = req.headers.get("range");
  const contentType = "video/mp4";

  if (!range) {
    const stream = fs.createReadStream(filePath);
    return new Response(stream as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const match = /^bytes=(\d+)-(\d+)?$/.exec(range);
  if (!match) {
    return new Response("Bad Range", { status: 416 });
  }

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= size) {
    return new Response("Range Not Satisfiable", { status: 416 });
  }

  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(filePath, { start, end });

  return new Response(stream as any, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
