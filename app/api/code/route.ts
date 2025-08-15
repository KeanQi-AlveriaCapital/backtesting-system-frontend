import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getStrategy } from "@/lib/services/strategy-services";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategyId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!strategyId || !userId) {
      return NextResponse.json(
        { error: "Strategy ID and User ID are required" },
        { status: 400 }
      );
    }

    // Verify the strategy exists and belongs to the user
    const strategy = await getStrategy(strategyId);
    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    if (strategy.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Try to read the code file
    try {
      const filePath = path.join(
        process.cwd(),
        "code",
        userId,
        `${strategyId}.h`
      );
      const code = await readFile(filePath, "utf8");

      return NextResponse.json({
        success: true,
        code,
        strategy,
      });
    } catch (fileError) {
      // File doesn't exist - return strategy metadata without code
      return NextResponse.json({
        success: true,
        code: "", // Empty code
        strategy,
        message: "No code file found for this strategy",
      });
    }
  } catch (error) {
    console.error("Error fetching strategy code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
