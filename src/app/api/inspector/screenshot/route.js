import { NextResponse } from "next/server";
import { getScreenshot } from "@/lib/inspectorBrowserManager";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const screenshot = await getScreenshot(sessionId);

    if (!screenshot) {
      return NextResponse.json(
        { error: "Failed to get screenshot or session not found" },
        { status: 404 }
      );
    }

    return new NextResponse(screenshot, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in screenshot API:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}







