// app/api/backtest/route.ts
import {
  createStrategy,
  updateStrategy,
} from "@/lib/services/strategy-services";
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

    let strategyId: string;

    if (body.updateExisting && body.strategyId) {
      // Update existing strategy
      strategyId = body.strategyId;

      const strategyUpdates: Partial<Strategy> = {
        initialEquity: body.initialEquity,
        dateRange: {
          from: body.dateRange.from,
          to: body.dateRange.to,
        },
        name: body.name,
        status: "running",
        timeframe: body.timeframe,
        lastRunAt: new Date().toISOString(),
        runCount: body.runCount || 1,
        // Clear previous results/errors
        error: null,
      };

      try {
        await updateStrategy(strategyId, strategyUpdates);
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to update strategy in database",
            details:
              error instanceof Error ? error.message : "Unknown database error",
          },
          { status: 500 }
        );
      }
    } else {
      // Create new strategy (shouldn't happen in normal flow, but keep as fallback)
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
        lastRunAt: new Date().toISOString(),
        runCount: 1,
      };

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
    }

    if (!strategyId || !body.code) {
      return NextResponse.json({
        success: true,
        strategyId,
        message: "Strategy updated successfully (no code file)",
        warning:
          "Code file was not created - missing strategy ID or code content",
      });
    }

    try {
      const data: BacktestBody = {
        action: "test",
        from: body.dateRange.from,
        to: body.dateRange.to,
        id: strategyId,
        language: body.language,
        py: body.code,
        type: body.timeframe,
        user: body.userId,
        password: "123",
      };

      // Build strategy object for the websocket function
      const strategyForWS: Strategy = {
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

      await submitBacktestJob(data, strategyForWS, strategyId, body.code);

      const filePath = path.join(
        process.cwd(),
        "code",
        body.userId,
        `${strategyId}.h`
      );

      return NextResponse.json({
        success: true,
        strategyId,
        message: body.updateExisting
          ? "Strategy updated and backtest restarted successfully"
          : "Strategy created and backtest started successfully",
        filePath,
      });
    } catch (error) {
      // Update strategy status to failed
      await updateStrategy(strategyId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return NextResponse.json(
        {
          error: body.updateExisting
            ? "Strategy updated but backtest failed to start"
            : "Strategy created but backtest failed to start",
          strategyId,
          details: error instanceof Error ? error.message : "Unknown error",
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
        } else if (
          parsedData.status === "processing" ||
          parsedData.status === "completed"
        ) {
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
