import { createStrategy } from "@/lib/services/strategy-services";
import { BacktestBody, Strategy } from "@/lib/types/documents";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import WebSocket from "ws";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const requiredFields = [
      "initialEquity",
      "name",
      "timeframe",
      "userId",
      "code",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.dateRange?.from || !body.dateRange?.to) {
      return NextResponse.json(
        { error: "Date range (from and to) is required" },
        { status: 400 }
      );
    }

    const strategy: Strategy = {
      initialEquity: body.initialEquity,
      dateRange: {
        from: body.dateRange.from,
        to: body.dateRange.to,
      },
      name: body.name,
      status: "running",
      timeframe: body.timeframe,
      userId: body.userId,
    };

    let strategyId: string;
    try {
      strategyId = await createStrategy(strategy);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to create strategy in database",
          details:
            error instanceof Error ? error.message : "Unknown database error",
        },
        { status: 500 }
      );
    }

    if (!strategyId || !body.code) {
      return NextResponse.json({
        success: true,
        strategyId,
        message: "Strategy created successfully (no code file)",
        warning:
          "Code file was not created - missing strategy ID or code content",
      });
    }

    try {
      const data: BacktestBody = {
        action: "test",
        from: strategy.dateRange.from,
        to: strategy.dateRange.to,
        id: strategyId,
        language: body.language,
        py: body.code,
        type: body.timeframe,
        user: strategy.userId,
        password: "123",
      };

      await submitBacktestJob(data, strategy, strategyId, body.code);

      const filePath = path.join(
        process.cwd(),
        "code",
        strategy.userId,
        `${strategyId}.h`
      );

      return NextResponse.json({
        success: true,
        strategyId,
        message: "Strategy created and code file saved successfully",
        filePath,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Strategy created but failed to save code file",
          strategyId,
          details:
            error instanceof Error ? error.message : "Unknown file error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

async function submitBacktestJob(
  data: BacktestBody,
  strategy: Strategy,
  strategyId: string,
  code: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://192.168.88.4:8080", {
      rejectUnauthorized: false,
    });

    let timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket timeout"));
    }, 10000);

    ws.on("open", () => {
      ws.send(JSON.stringify(data));
    });

    ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data.toString());

        if (parsedData.status === "ok") {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Status check timeout"));
          }, 15000);

          setTimeout(() => {
            const message = {
              id: strategyId,
              action: "result",
              user: strategy.userId,
              password: "123",
            };
            ws.send(JSON.stringify(message));
          }, 5000);
        } else if (parsedData.status === "processing") {
          clearTimeout(timeout);
          ws.close();

          try {
            const codeDir = path.join(process.cwd(), "code", strategy.userId);
            await mkdir(codeDir, { recursive: true });
            const filePath = path.join(codeDir, `${strategyId}.h`);
            await writeFile(filePath, code, "utf8");
            resolve();
          } catch (fileError) {
            reject(fileError);
          }
        } else {
          clearTimeout(timeout);
          ws.close();
          if (parsedData.error)
            reject(new Error(`${parsedData.status}: ${parsedData.error}`));
          else reject(new Error(`Unexpected status: ${parsedData.status}`));
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();
        if (error instanceof SyntaxError) {
          resolve();
        } else {
          reject(error);
        }
      }
    });

    ws.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on("close", (code, reason) => {
      clearTimeout(timeout);
      if (code !== 1000) {
        reject(new Error(`WebSocket closed with code ${code}: ${reason}`));
      }
    });
  });
}
