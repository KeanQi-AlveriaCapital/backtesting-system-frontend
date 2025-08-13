export interface GroupedTrades {
  [key: string]: TradeData[];
}

export type Timeframe =
  | "c1m"
  | "c2m"
  | "c3m"
  | "c5m"
  | "c10m"
  | "c15m"
  | "c1h"
  | "c4h";

export interface TradeData {
  id: number;
  symbol: string;
  entryTime: string;
  entryPrice: number;
  stoplossPrice: number;
  exitPrice: number;
  exitTime: string;
  pnlAmount: number;
  pnlPercentage: number;
  quantity: number;
}

interface TradeSummary {
  symbol: string;
  totalTrades: number;
  totalPnl: number;
  avgPnl: number;
  totalQuantity: number;
}

const parseTradeData = (csvData: string): TradeData[] => {
  const lines = csvData.trim().split("\n");

  // Skip header if present
  const dataLines = lines[0].includes("id,symbol") ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const parts = line.split(",");

    return {
      id: parseInt(parts[0]),
      symbol: parts[1],
      entryTime: parts[2],
      entryPrice: parseFloat(parts[3]),
      stoplossPrice: parseFloat(parts[4]),
      exitPrice: parseFloat(parts[5]),
      exitTime: parts[6],
      pnlAmount: parseFloat(parts[7]),
      pnlPercentage: parseFloat(parts[8]),
      quantity: parseFloat(parts[9]),
    };
  });
};

const groupTradesBySymbol = (
  trades: TradeData[]
): Record<string, TradeData[]> => {
  return trades.reduce((grouped, trade) => {
    if (!grouped[trade.symbol]) {
      grouped[trade.symbol] = [];
    }
    grouped[trade.symbol].push(trade);
    return grouped;
  }, {} as Record<string, TradeData[]>);
};

const createTradeSummary = (
  groupedTrades: Record<string, TradeData[]>
): TradeSummary[] => {
  return Object.entries(groupedTrades).map(([symbol, trades]) => ({
    symbol,
    totalTrades: trades.length,
    totalPnl: trades.reduce((sum, trade) => sum + trade.pnlAmount, 0),
    avgPnl:
      trades.reduce((sum, trade) => sum + trade.pnlAmount, 0) / trades.length,
    totalQuantity: trades.reduce(
      (sum, trade) => sum + Math.abs(trade.quantity),
      0
    ),
  }));
};

// Main function to process the data
export const processTradeData = (
  csvData: string
): { groupedTrades: Record<string, TradeData[]>; summary: TradeSummary[] } => {
  const trades = parseTradeData(csvData);
  const groupedTrades = groupTradesBySymbol(trades);
  const summary = createTradeSummary(groupedTrades);
  const sortedSummary = summary.sort((a, b) => b.totalPnl - a.totalPnl);

  return { groupedTrades, summary: sortedSummary };
};
