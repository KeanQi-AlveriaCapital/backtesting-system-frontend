// app/api/trades/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface Trade {
  symbol: string;
  entry_time: string;
  entry_price: number;
  stop_loss_price: number;
  exit_price: number;
  exit_time: string;
  pnl_amount: number;
  pnl_pct: string;
  quantity: number;
}

interface GroupedTrades {
  [symbol: string]: Trade[];
}

export async function GET() {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "app", "data", "trades.csv");
    const csvData = fs.readFileSync(csvPath, "utf8");

    // Parse CSV
    const trades: Trade[] = parse(csvData, {
      columns: true, // Use first row as column headers
      skip_empty_lines: true,
      cast: (value, context) => {
        // Cast numeric columns to numbers
        if (
          [
            "entry_price",
            "stop_loss_price",
            "exit_price",
            "pnl_amount",
            "quantity",
          ].includes(context.column as string)
        ) {
          return parseFloat(value);
        }
        return value;
      },
    });

    // Group trades by symbol
    const groupedTrades: GroupedTrades = trades.reduce((acc, trade) => {
      const symbol = trade.symbol;
      if (!acc[symbol]) {
        acc[symbol] = [];
      }
      acc[symbol].push(trade);
      return acc;
    }, {} as GroupedTrades);

    // Optional: Add summary statistics per symbol
    const summary = Object.entries(groupedTrades).map(([symbol, trades]) => ({
      symbol,
      total_trades: trades.length,
      total_pnl: trades.reduce((sum, trade) => sum + trade.pnl_amount, 0),
      avg_pnl:
        trades.reduce((sum, trade) => sum + trade.pnl_amount, 0) /
        trades.length,
      total_quantity: trades.reduce((sum, trade) => sum + trade.quantity, 0),
    }));

    return NextResponse.json({
      grouped_trades: groupedTrades,
      summary,
    });
  } catch (error) {
    console.error("Error reading CSV:", error);
    return NextResponse.json(
      { error: "Failed to read trades data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  } catch (error) {}
}
