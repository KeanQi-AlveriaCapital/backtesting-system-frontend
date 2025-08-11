"use client";

import { cn } from "@/lib/utils";

export interface TradingItem {
  symbol: string;
  total_trades: number;
  total_pnl: number;
  avg_pnl: number;
  total_quantity: number;
}

interface TradingListItemProps {
  item: TradingItem;
  isSelected: boolean;
  onClick: (symbol: string) => void;
  className?: string;
}

export function TradingListItem({
  item,
  isSelected,
  onClick,
  className,
}: TradingListItemProps) {
  // Format numbers for display
  const formatPnL = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  const formatQuantity = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const isProfitable = item.total_pnl > 0;

  return (
    <div
      onClick={() => onClick(item.symbol)}
      className={cn(
        "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50",
        isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{item.symbol}</span>
            <span
              className={cn(
                "text-sm font-medium",
                isProfitable ? "text-green-600" : "text-red-600"
              )}
            >
              {isProfitable ? "+" : ""}${formatPnL(item.total_pnl)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {item.total_trades} trades
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                item.avg_pnl > 0 ? "text-green-600" : "text-red-600"
              )}
            >
              Avg: {item.avg_pnl > 0 ? "+" : ""}${formatPnL(item.avg_pnl)}
            </span>
          </div>
          {/* <div className="flex items-center justify-center mt-1">
            <span className="text-xs text-gray-400">
              Vol: {formatQuantity(Math.abs(item.total_quantity))}
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
