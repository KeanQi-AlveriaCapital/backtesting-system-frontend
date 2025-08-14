// lib/types/documents.ts
import { BaseDocument } from "../firestore";
import { TradeData, Timeframe } from "../trades";

export interface Strategy extends BaseDocument {
  name: string;
  userId: string;
  initialEquity: number;
  timeframe: Timeframe;
  dateRange: {
    from: string;
    to: string;
  };
  status: "running" | "completed" | "failed";
  results?: StrategyResults;
}

export interface StrategyResults {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: TradeData[];
  equityCurve: Array<{ date: string; equity: number }>;
}
