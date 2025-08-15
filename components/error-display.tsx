// components/error-display.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Edit, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error?: string;
  onRetry?: () => void;
  strategyId?: string | null;
}

export function ErrorDisplay({
  error,
  onRetry,
  strategyId,
}: ErrorDisplayProps) {
  const parseError = (errorMessage: string) => {
    // Try to extract meaningful error information
    if (errorMessage.includes("compilation")) {
      return {
        type: "Compilation Error",
        suggestion:
          "Check your code syntax and ensure all required functions are implemented.",
      };
    } else if (errorMessage.includes("timeout")) {
      return {
        type: "Timeout Error",
        suggestion:
          "The backtest took too long. Try reducing the date range or optimizing your strategy.",
      };
    } else if (errorMessage.includes("data")) {
      return {
        type: "Data Error",
        suggestion:
          "There might be an issue with the market data for your selected timeframe and date range.",
      };
    } else {
      return {
        type: "Unknown Error",
        suggestion: "Please check your strategy configuration and try again.",
      };
    }
  };

  const errorInfo = error ? parseError(error) : null;

  return (
    <Card className="border-red-200 bg-red-50 mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Backtest Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errorInfo && (
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                {errorInfo.type}
              </h4>
              <p className="text-red-700 mb-2">{errorInfo.suggestion}</p>
            </div>
          )}

          {error && (
            <div>
              <h5 className="font-medium text-red-800 mb-2">Error Details:</h5>
              <pre className="bg-red-100 p-3 rounded text-sm text-red-800 overflow-auto max-h-32">
                {error}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <Edit className="h-4 w-4" />
                Edit Strategy
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
