// app/api/trades/route.ts
import { processTradeData } from "@/lib/trades";
import { NextRequest } from "next/server";
import WebSocket from "ws";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return Response.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const result = await new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://192.168.88.4:8080", {
        rejectUnauthorized: false,
      });

      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket timeout"));
      }, 10000); // 10 second timeout

      ws.on("open", () => {
        ws.send(JSON.stringify(body));
      });

      ws.on("message", (data) => {
        clearTimeout(timeout);
        ws.close();

        try {
          const parsedData = JSON.parse(data.toString());
          const result = processTradeData(parsedData.tradelog);
          resolve(result);
        } catch (error) {
          resolve(data.toString()); // Return as string if not JSON
        }
      });

      ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      ws.on("close", (code, reason) => {
        clearTimeout(timeout);
        if (code !== 1000) {
          // 1000 is normal closure
          reject(new Error(`WebSocket closed with code ${code}: ${reason}`));
        }
      });
    });

    return Response.json({ message: "Success", data: result });
  } catch (error) {
    console.error("WebSocket error:", error);
    return Response.json(
      { error: "Failed to communicate with WebSocket server" },
      { status: 500 }
    );
  }
}
