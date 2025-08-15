// components/status-banner.tsx
import { Strategy } from "@/lib/types/documents";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

interface StatusBannerProps {
  strategy: Strategy | null;
}

export function StatusBanner({ strategy }: StatusBannerProps) {
  if (!strategy) return null;

  const getStatusConfig = (status: Strategy["status"]) => {
    switch (status) {
      case "draft":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <FileText className="h-5 w-5" />,
          message:
            "This strategy is in draft mode. Complete the setup to run a backtest.",
        };
      case "running":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Clock className="h-5 w-5" />,
          message: "Backtest is running... This may take a few minutes.",
        };
      case "completed":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-5 w-5" />,
          message: "Backtest completed successfully!",
        };
      case "failed":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <AlertTriangle className="h-5 w-5" />,
          message: "Backtest failed. Check the error details below.",
        };
    }
  };

  const config = getStatusConfig(strategy.status);

  return (
    <div className={`p-4 rounded-lg border mb-4 ${config.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <span className="font-medium">{config.message}</span>
            {strategy.lastRunAt && (
              <div className="text-sm opacity-75 mt-1">
                Last updated: {new Date(strategy.lastRunAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
        {strategy.status === "running" && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
