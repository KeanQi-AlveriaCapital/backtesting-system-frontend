// lib/types/documents.ts
import { BaseDocument } from "../firestore";
import { TradeData, Timeframe } from "../trades";

export interface Strategy extends BaseDocument {
  name: string;
  userId: string;
  initialEquity: number;
  timeframe: string;
  dateRange: {
    from: string;
    to: string;
  };
  status: "draft" | "running" | "completed" | "failed";
  error?: string | null;
  lastRunAt?: string;
  runCount?: number;
}

export interface BacktestBody {
  id: string;
  action: "test" | "result" | "output";
  type: "string";
  language: "cpp" | "python";
  from: string;
  to: string;
  user: string;
  password: "123";
  py: string;
}
