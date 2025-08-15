"use client";

import { AppSidebar } from "@/components/app-sidebar";
import TradingChart, { ChartDataCandlestick } from "@/components/trading-chart";
import { TradingItem, TradingListItem } from "@/components/trading-list-item";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useResponsiveHeight } from "@/hooks/use-responsive-height";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GroupedTrades, TradeData } from "@/lib/trades";
import { ApiCandleData, transformCandleData } from "@/lib/candles";
import ProtectedRoute from "@/components/protected-route";
import { toast } from "sonner";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Calendar,
  Target,
  Award,
  Activity,
} from "lucide-react";
import { getStrategy, updateStrategy } from "@/lib/services/strategy-services";
import { Strategy } from "@/lib/types/documents";
import { useAuth } from "@/contexts/AuthContext";

interface StrategyStatus {
  status: "loading" | "completed" | "failed" | "not_found";
  error?: string;
  summary?: TradingItem[];
  groupedTrades?: GroupedTrades;
}

interface StrategyData {
  strategy: Strategy | null;
  loading: boolean;
  error?: string;
}

interface CalculatedMetrics {
  totalTrades: number;
  totalPnl: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWinAmount: number;
  avgLossAmount: number;
  largestWin: number;
  largestLoss: number;
  totalWinningTrades: number;
  totalLosingTrades: number;
  symbolsCount: number;
}

function StrategyContent() {
  const scrollHeight = useResponsiveHeight();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = searchParams.get("id");

  const [candleData, setCandleData] = useState<ChartDataCandlestick[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [strategyStatus, setStrategyStatus] = useState<StrategyStatus>({
    status: "loading",
  });
  const [strategyData, setStrategyData] = useState<StrategyData>({
    strategy: null,
    loading: true,
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Function to fetch strategy metadata from Firebase
  const fetchStrategyMetadata = async (strategyId: string) => {
    try {
      const strategy = await getStrategy(strategyId);

      if (strategy) {
        setStrategyData({
          strategy,
          loading: false,
        });
      } else {
        setStrategyData({
          strategy: null,
          loading: false,
          error: "Strategy not found in database",
        });
      }
    } catch (error) {
      console.error("Error fetching strategy metadata:", error);
      setStrategyData({
        strategy: null,
        loading: false,
        error: "Failed to fetch strategy metadata",
      });
    }
  };

  // Function to update strategy status in Firebase (only status)
  const updateStrategyStatusInFirebase = async (
    strategyId: string,
    status: Strategy["status"]
  ) => {
    try {
      setIsUpdatingStatus(true);

      await updateStrategy(strategyId, { status });

      // Update local state
      setStrategyData((prev) => ({
        ...prev,
        strategy: prev.strategy
          ? {
              ...prev.strategy,
              status: status,
            }
          : null,
      }));
    } catch (error) {
      console.error("Error updating strategy status in Firebase:", error);
      toast.error("Failed to update strategy status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Function to fetch strategy results from WebSocket
  const fetchStrategyResults = async (strategyId: string, retry = false) => {
    if (retry) {
      setIsRetrying(true);
    }

    try {
      const resp = await axios.post("/api/trades", {
        id: strategyId,
        action: "result",
        user: user?.uid || "easycbt",
        password: "123",
      });

      const summary = resp.data.data.summary;
      const groupedTrades = resp.data.data.groupedTrades;

      if (summary && groupedTrades) {
        setStrategyStatus({
          status: "completed",
          summary,
          groupedTrades,
        });

        // Only update status if it's not already completed
        if (
          strategyData.strategy &&
          strategyData.strategy.status !== "completed"
        ) {
          await updateStrategyStatusInFirebase(strategyId, "completed");
          toast.success("Backtest completed!");
        } else if (retry) {
          toast.success("Strategy results loaded successfully!");
        }
      } else {
        setStrategyStatus({
          status: "failed",
          error: "No results found for this strategy",
        });

        if (
          strategyData.strategy &&
          strategyData.strategy.status === "running"
        ) {
          await updateStrategyStatusInFirebase(strategyId, "failed");
        }
      }
    } catch (error) {
      console.error("Error fetching strategy results:", error);

      if (axios.isAxiosError(error)) {
        if (
          error.response?.status === 404 ||
          error.response?.data?.error === "Strategy not found"
        ) {
          setStrategyStatus({
            status: "not_found",
            error: "Strategy not found or backtest not completed yet",
          });
        } else {
          setStrategyStatus({
            status: "failed",
            error:
              error.response?.data?.error || "Failed to fetch strategy results",
          });

          if (
            strategyData.strategy &&
            strategyData.strategy.status === "running"
          ) {
            await updateStrategyStatusInFirebase(strategyId, "failed");
          }
        }
      } else {
        setStrategyStatus({
          status: "failed",
          error: "Network error occurred",
        });
      }

      if (retry) {
        toast.error("Failed to load strategy results");
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // Calculate all metrics on-demand from WebSocket data
  const calculateAllMetrics = (): CalculatedMetrics | null => {
    if (!strategyStatus.summary || !strategyStatus.groupedTrades) return null;

    const allTrades: TradeData[] = Object.values(
      strategyStatus.groupedTrades
    ).flat();
    const totalTrades = allTrades.length;
    const totalPnl = strategyStatus.summary.reduce(
      (sum, item) => sum + item.totalPnl,
      0
    );

    const winningTrades = allTrades.filter((trade) => trade.pnlAmount > 0);
    const losingTrades = allTrades.filter((trade) => trade.pnlAmount < 0);

    const totalWinningTrades = winningTrades.length;
    const totalLosingTrades = losingTrades.length;
    const winRate =
      totalTrades > 0 ? (totalWinningTrades / totalTrades) * 100 : 0;

    // Financial metrics
    const totalWinAmount = winningTrades.reduce(
      (sum, trade) => sum + trade.pnlAmount,
      0
    );
    const totalLossAmount = Math.abs(
      losingTrades.reduce((sum, trade) => sum + trade.pnlAmount, 0)
    );

    const avgWinAmount =
      totalWinningTrades > 0 ? totalWinAmount / totalWinningTrades : 0;
    const avgLossAmount =
      totalLosingTrades > 0 ? totalLossAmount / totalLosingTrades : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => t.pnlAmount))
        : 0;
    const largestLoss =
      losingTrades.length > 0
        ? Math.min(...losingTrades.map((t) => t.pnlAmount))
        : 0;

    const profitFactor =
      totalLossAmount > 0
        ? totalWinAmount / totalLossAmount
        : totalWinAmount > 0
        ? 999
        : 0;

    // Max drawdown calculation
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;

    const sortedTrades = allTrades.sort(
      (a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime()
    );

    sortedTrades.forEach((trade) => {
      runningPnl += trade.pnlAmount;
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Sharpe ratio calculation
    const returns = allTrades.map((trade) => trade.pnlPercentage / 100);
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio =
      stdDev !== 0
        ? (avgReturn * Math.sqrt(252)) / (stdDev * Math.sqrt(252))
        : 0;

    return {
      totalTrades,
      totalPnl,
      winRate,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
      avgWinAmount,
      avgLossAmount,
      largestWin,
      largestLoss,
      totalWinningTrades,
      totalLosingTrades,
      symbolsCount: strategyStatus.summary.length,
    };
  };

  // Calculate equity curve on-demand
  const calculateEquityCurve = () => {
    if (!strategyStatus.groupedTrades) return [];

    const allTrades: TradeData[] = Object.values(
      strategyStatus.groupedTrades
    ).flat();
    const sortedTrades = allTrades.sort(
      (a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime()
    );

    let equity = strategyData.strategy?.initialEquity || 100000;
    const equityCurve: Array<{ date: string; equity: number }> = [
      { date: strategyData.strategy?.dateRange.from || "", equity },
    ];

    sortedTrades.forEach((trade) => {
      equity += trade.pnlAmount;
      equityCurve.push({
        date: trade.exitTime,
        equity: equity,
      });
    });

    return equityCurve;
  };

  // Initial load - fetch strategy metadata from Firebase
  useEffect(() => {
    if (id) {
      fetchStrategyMetadata(id);
    } else {
      setStrategyStatus({
        status: "failed",
        error: "No strategy ID provided",
      });
      setStrategyData({
        strategy: null,
        loading: false,
        error: "No strategy ID provided",
      });
    }
  }, [id, user?.uid]);

  // Fetch results after strategy metadata is loaded
  useEffect(() => {
    if (id && strategyData.strategy && !strategyData.loading) {
      fetchStrategyResults(id);
    }
  }, [id, strategyData.strategy, strategyData.loading, user?.uid]);

  // Fetch candle data when symbol is selected
  useEffect(() => {
    if (
      selectedSymbol &&
      strategyStatus.groupedTrades &&
      strategyData.strategy
    ) {
      const selectedGroupedTrade = strategyStatus.groupedTrades[selectedSymbol];

      if (selectedGroupedTrade && selectedGroupedTrade.length > 0) {
        const entryTimes = selectedGroupedTrade.map(
          (trade) => new Date(trade.entryTime.trim())
        );
        const exitTimes = selectedGroupedTrade.map(
          (trade) => new Date(trade.exitTime.trim())
        );

        const earliestEntry = new Date(
          Math.min(...entryTimes.map((date) => date.getTime()))
        )
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        const latestExit = new Date(
          Math.max(...exitTimes.map((date) => date.getTime()))
        )
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        // Extract table name from timeframe (e.g., "bnf.c4h" -> "c4h")
        const tableName = strategyData.strategy.timeframe.includes(".")
          ? strategyData.strategy.timeframe.split(".")[1]
          : strategyData.strategy.timeframe;

        // Fetch candle data
        const fetchCandle = async () => {
          try {
            const response = await axios.post("/api/candles", {
              table: tableName,
              ticker: selectedSymbol.trim(),
              dateFrom: earliestEntry,
              dateTo: latestExit,
            });

            const selectedCandle: ApiCandleData[] = response.data.data.data;
            const transformedCandle: ChartDataCandlestick[] =
              transformCandleData(selectedCandle);
            setCandleData(transformedCandle);
          } catch (error) {
            console.error("Error fetching candle data:", error);
            toast.error("Failed to load chart data");
          }
        };

        fetchCandle();
      }
    }
  }, [selectedSymbol, strategyStatus.groupedTrades, strategyData.strategy]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleRetry = () => {
    if (id) {
      fetchStrategyResults(id, true);
    }
  };

  // Format timeframe for display
  const formatTimeframe = (timeframe: string) => {
    if (!timeframe) return "Unknown";

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

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const metrics = calculateAllMetrics();

  if (!id) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Missing Strategy ID
          </h2>
          <p className="text-gray-600">
            No strategy ID was provided in the URL.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = strategyData.loading || strategyStatus.status === "loading";

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Alveria Backtesting Platform
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/strategies">Strategies</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {strategyData.strategy?.name || id}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4 pt-0">
        {/* Strategy Info Card */}
        {strategyData.strategy && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {strategyData.strategy.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      strategyData.strategy.status === "completed"
                        ? "default"
                        : strategyData.strategy.status === "running"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {strategyData.strategy.status}
                  </Badge>
                  {isUpdatingStatus && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                      Syncing...
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Timeframe</p>
                    <p className="font-medium">
                      {formatTimeframe(strategyData.strategy.timeframe)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Initial Equity</p>
                    <p className="font-medium">
                      ${strategyData.strategy.initialEquity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date Range</p>
                    <p className="font-medium">
                      {formatDate(strategyData.strategy.dateRange.from)} -{" "}
                      {formatDate(strategyData.strategy.dateRange.to)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {strategyData.strategy.createdAt
                        ? formatDate(
                            strategyData.strategy.createdAt.toDate?.() ||
                              strategyData.strategy.createdAt
                          )
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                <span className="text-lg">
                  {strategyData.loading
                    ? "Loading strategy information..."
                    : "Loading backtest results..."}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error States */}
        {strategyData.error && (
          <Card className="mb-4 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Strategy Error
                  </h3>
                  <p className="text-red-700">{strategyData.error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {strategyStatus.status === "failed" && (
          <Card className="mb-4 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">
                      Failed to Load Results
                    </h3>
                    <p className="text-red-700">{strategyStatus.error}</p>
                  </div>
                </div>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  variant="outline"
                >
                  {isRetrying ? "Retrying..." : "Retry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {strategyStatus.status === "not_found" && (
          <Card className="mb-4 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900">
                      Backtest In Progress
                    </h3>
                    <p className="text-yellow-700">
                      {strategyStatus.error ||
                        "The backtest may still be running. Please wait and try again."}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  variant="outline"
                >
                  {isRetrying ? "Checking..." : "Check Again"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary - All metrics calculated fresh from WebSocket data */}
        {strategyStatus.status === "completed" && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total P&L
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        metrics.totalPnl >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ${metrics.totalPnl.toFixed(2)}
                    </p>
                  </div>
                  {metrics.totalPnl >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Win Rate
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {metrics.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Profit Factor
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {metrics.profitFactor > 999
                        ? "∞"
                        : metrics.profitFactor.toFixed(2)}
                    </p>
                  </div>
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Max Drawdown
                    </p>
                    <p className="text-xl font-bold text-red-600">
                      ${metrics.maxDrawdown.toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Sharpe Ratio
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {metrics.sharpeRatio.toFixed(2)}
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Trades
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {metrics.totalTrades}
                    </p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional detailed metrics */}
        {strategyStatus.status === "completed" && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Win</p>
                  <p className="text-lg font-bold text-green-600">
                    ${metrics.avgWinAmount.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Loss</p>
                  <p className="text-lg font-bold text-red-600">
                    ${Math.abs(metrics.avgLossAmount).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Largest Win
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    ${metrics.largestWin.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Largest Loss
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    ${Math.abs(metrics.largestLoss).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart and Trading List */}
        {strategyStatus.status === "completed" &&
          strategyStatus.summary &&
          strategyStatus.groupedTrades && (
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              {/* Chart Section */}
              <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col lg:order-1">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedSymbol ? (
                    <span className="flex items-center gap-2">
                      {selectedSymbol} Price Chart
                      <Badge variant="outline">
                        {formatTimeframe(
                          strategyData.strategy?.timeframe || ""
                        )}
                      </Badge>
                    </span>
                  ) : (
                    "Select a symbol to view chart"
                  )}
                </h2>
                <div className="flex-1 min-h-[400px]">
                  {selectedSymbol ? (
                    <TradingChart
                      data={candleData}
                      type={"Candlestick"}
                      showVolume={true}
                      tradeData={
                        strategyStatus.groupedTrades[selectedSymbol] || []
                      }
                      width="100%"
                      height="100%"
                      theme="light"
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>
                          Select a symbol from the market watch to view its
                          chart
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Chart will show price action with entry/exit markers
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trading List Section */}
              <div className="bg-white rounded-lg shadow-md p-4 lg:w-80 lg:order-2 order-first lg:order-last">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Market Watch</h3>
                  {metrics && (
                    <Badge variant="outline" className="text-xs">
                      {metrics.symbolsCount} symbols
                    </Badge>
                  )}
                </div>
                <ScrollArea
                  className="w-full pr-4"
                  style={{ height: scrollHeight }}
                >
                  <div className="space-y-2">
                    {strategyStatus.summary?.map((item) => (
                      <TradingListItem
                        key={item.symbol}
                        item={item}
                        isSelected={selectedSymbol === item.symbol}
                        onClick={handleSymbolSelect}
                      />
                    ))}

                    {strategyStatus.summary?.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No trading data available</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Summary Stats in Sidebar */}
                {metrics && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Win/Loss Ratio:</span>
                        <span className="font-medium">
                          {metrics.totalWinningTrades}/
                          {metrics.totalLosingTrades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Trade:</span>
                        <span className="font-medium text-green-600">
                          ${metrics.largestWin.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Worst Trade:</span>
                        <span className="font-medium text-red-600">
                          ${metrics.largestLoss.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Factor:</span>
                        <span className="font-medium">
                          {metrics.profitFactor > 999
                            ? "∞"
                            : metrics.profitFactor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Empty state when no results */}
        {strategyStatus.status === "completed" &&
          (!strategyStatus.summary || strategyStatus.summary.length === 0) && (
            <Card className="mb-4">
              <CardContent className="p-8">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Trading Results
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This strategy completed but didn't generate any trades. This
                    could be due to strategy conditions not being met during the
                    backtest period.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handleRetry}>
                      Retry Loading
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading strategy...</p>
                </div>
              </div>
            }
          >
            <StrategyContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
