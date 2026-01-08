import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_PATH = path.join(process.cwd(), "files", "data-source.json");

async function ensureDirectory() {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
}

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ data });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json(
      { error: "Failed to read saved data." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const data = payload?.data;
  if (!data) {
    return NextResponse.json(
      { error: "Missing data payload." },
      { status: 400 }
    );
  }
  await ensureDirectory();
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  try {
    await fs.unlink(DATA_PATH);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      return NextResponse.json(
        { error: "Failed to delete saved data." },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({ success: true });
}
