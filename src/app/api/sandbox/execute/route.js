/**
 * API Route untuk menjalankan Sandbox Playwright Script
 * 
 * POST /api/sandbox/execute
 * Body: { url, headless, actions, timeout }
 */

import { executeSandboxScript } from "@/lib/playwrightSandbox";

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, headless, actions, timeout } = body;

    // Validate input
    if (!url) {
      return Response.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(actions)) {
      return Response.json(
        { error: "Actions must be an array" },
        { status: 400 }
      );
    }

    // Execute sandbox script
    const result = await executeSandboxScript({
      url,
      headless: headless ?? false,
      actions,
      timeout: timeout ?? 30000,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error || "Execution failed" },
        { status: 500 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("Sandbox execution error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

