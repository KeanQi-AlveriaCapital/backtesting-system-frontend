// components/strategy-card.tsx
import { Strategy } from "@/lib/types/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StrategyCardProps {
  strategy: Strategy;
  onDelete?: (id: string) => void;
  onDuplicate?: (strategy: Strategy) => void;
}

export function StrategyCard({
  strategy,
  onDelete,
  onDuplicate,
}: StrategyCardProps) {
  const router = useRouter();

  const getStatusConfig = (status: Strategy["status"]) => {
    switch (status) {
      case "running":
        return {
          badge: (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Running
            </Badge>
          ),
          color: "border-blue-200 bg-blue-50",
        };
      case "completed":
        return {
          badge: (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Completed
            </Badge>
          ),
          color: "border-green-200 bg-green-50",
        };
      case "failed":
        return {
          badge: (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Failed
            </Badge>
          ),
          color: "border-red-200 bg-red-50",
        };
      default:
        return {
          badge: (
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              Unknown
            </Badge>
          ),
          color: "border-gray-200",
        };
    }
  };

  const statusConfig = getStatusConfig(strategy.status);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeframe = (timeframe: string) => {
    if (!timeframe) return "Not set";

    const timeframeMap: Record<string, string> = {
      c1m: "1 Minute",
      c2m: "2 Minutes",
      c3m: "3 Minutes",
      c5m: "5 Minutes",
      c10m: "10 Minutes",
      c15m: "15 Minutes",
      c1h: "1 Hour",
      c4h: "4 Hours",
    };

    // Handle "bnf.c4h" format
    const cleanTimeframe = timeframe.includes(".")
      ? timeframe.split(".")[1]
      : timeframe;
    return timeframeMap[cleanTimeframe] || timeframe;
  };

  const handleView = () => {
    if (strategy.status === "completed") {
      router.push(`/strategy?id=${strategy.id}`);
    } else {
      toast.info("Strategy must be completed to view results");
    }
  };

  const handleEdit = () => {
    router.push(`/strategies/new?id=${strategy.id}`);
  };

  const handleRun = () => {
    router.push(`/strategies/new?id=${strategy.id}`);
    toast.info(
      "Edit your strategy and click 'Run Backtest' to start a new run"
    );
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${strategy.name}"? This action cannot be undone.`
      )
    ) {
      onDelete?.(strategy.id!);
    }
  };

  const handleDuplicate = () => {
    onDuplicate?.(strategy);
  };

  const copyStrategyId = () => {
    navigator.clipboard.writeText(strategy.id!);
    toast.success("Strategy ID copied to clipboard");
  };

  return (
    <Card className={`transition-all hover:shadow-md ${statusConfig.color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {strategy.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {statusConfig.badge}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleView}
                disabled={strategy.status !== "completed"}
              >
                <Play className="h-4 w-4" />
                View Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                Edit Strategy
              </DropdownMenuItem>
              {strategy.status !== "running" && (
                <DropdownMenuItem onClick={handleRun}>
                  <Play className="h-4 w-4" />
                  Run Backtest
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyStrategyId}>
                <Copy className="h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Strategy Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Initial Equity:</span>
            <div className="font-medium">
              {formatCurrency(strategy.initialEquity)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Timeframe:</span>
            <div className="font-medium">
              {formatTimeframe(strategy.timeframe)}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <span className="text-muted-foreground text-sm">Period:</span>
          <div className="text-sm font-medium">
            {strategy.dateRange?.from && strategy.dateRange?.to
              ? `${formatDate(strategy.dateRange.from)} - ${formatDate(
                  strategy.dateRange.to
                )}`
              : "Date range not set"}
          </div>
        </div>

        {/* Status Message */}
        {strategy.status === "running" && (
          <div className="pt-2 border-t">
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              <span className="font-medium">Status: </span>
              <span>Backtest is currently running...</span>
            </div>
          </div>
        )}

        {strategy.status === "failed" && (
          <div className="pt-2 border-t">
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">Status: </span>
              <span>Backtest failed. Click "View Results" for details.</span>
            </div>
          </div>
        )}

        {strategy.status === "completed" && (
          <div className="pt-2 border-t">
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              <span className="font-medium">Status: </span>
              <span>
                Backtest completed successfully. Click "View Results" to see
                performance.
              </span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          {strategy.updatedAt
            ? `Updated: ${new Date(
                strategy.updatedAt.toDate?.() || strategy.updatedAt
              ).toLocaleString()}`
            : strategy.createdAt
            ? `Created: ${new Date(
                strategy.createdAt.toDate?.() || strategy.createdAt
              ).toLocaleString()}`
            : ""}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1"
            disabled={strategy.status !== "completed"}
          >
            <Play className="h-4 w-4 mr-1" />
            View Results
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRun}
            className="flex-1"
            disabled={strategy.status === "running"}
          >
            <Play className="h-4 w-4 mr-1" />
            {strategy.status === "running" ? "Running..." : "Run Test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
