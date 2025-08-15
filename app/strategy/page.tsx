// app/strategy/page.tsx
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
import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GroupedTrades } from "@/lib/trades";
import { ApiCandleData, transformCandleData } from "@/lib/candles";
import ProtectedRoute from "@/components/protected-route";
import { Strategy } from "@/lib/types/documents";
import { toast } from "sonner";
import { RefreshCw, Edit } from "lucide-react";
import { StatusBanner } from "@/components/status-banner";
import { ErrorDisplay } from "@/components/error-display";

export default function StrategyPage() {
  const scrollHeight = useResponsiveHeight();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(true);
  const [candleData, setCandleData] = useState<ChartDataCandlestick[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [tradingData, setTradingData] = useState<TradingItem[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<GroupedTrades>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch strategy data
  useEffect(() => {
    if (!id) return;

    const fetchStrategy = async () => {
      try {
        const response = await axios.get(`/api/strategies/${id}`);
        setStrategy(response.data);
      } catch (error) {
        console.error("Error fetching strategy:", error);
        toast.error("Failed to load strategy");
      } finally {
        setIsLoadingStrategy(false);
      }
    };

    fetchStrategy();
  }, [id]);

  // Poll for strategy updates when status is "running"
  useEffect(() => {
    if (!id || !strategy) return;

    if (strategy.status === "running") {
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/strategies/${id}`);
          const updatedStrategy = response.data;

          setStrategy(updatedStrategy);

          // Show notification when status changes
          if (updatedStrategy.status !== strategy.status) {
            if (updatedStrategy.status === "completed") {
              toast.success("Backtest completed successfully! 🎉");
            } else if (updatedStrategy.status === "failed") {
              toast.error(
                `Backtest failed: ${updatedStrategy.error || "Unknown error"}`
              );
            }
          }
        } catch (error) {
          console.error("Error polling strategy status:", error);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(pollInterval);
    }
  }, [id, strategy]);

  // Fetch trading results when strategy is completed
  useEffect(() => {
    if (!id || !strategy || strategy.status !== "completed") return;

    const fetchTradingResults = async () => {
      try {
        const resp = await axios.post("/api/trades", {
          id,
          action: "result",
          user: "easycbt",
          password: "123",
        });

        const summary = resp.data.data.summary;
        const groupedTrades = resp.data.data.groupedTrades;

        setTradingData(summary);
        setGroupedTrades(groupedTrades);
      } catch (error) {
        console.error("Error fetching trading results:", error);
        toast.error("Failed to load trading results");
      }
    };

    fetchTradingResults();
  }, [id, strategy?.status]);

  // Fetch candle data when symbol is selected
  useEffect(() => {
    if (!selectedSymbol || !groupedTrades[selectedSymbol]) return;

    const selectedGroupedTrade = groupedTrades[selectedSymbol];
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

    const fetchCandle = async () => {
      try {
        const response = await axios.post("/api/candles", {
          table: "c4h",
          ticker: selectedSymbol.trim(),
          dateFrom: earliestEntry,
          dateTo: latestExit,
        });

        const selectedCandle: ApiCandleData[] = response.data.data.data;
        const transformedCandle: ChartDataCandlestick[] =
          transformCandleData(selectedCandle);
        setCandleData(transformedCandle);
      } catch (error) {
        console.error("Error fetching candle:", error);
        toast.error("Failed to load chart data");
      }
    };

    fetchCandle();
  }, [selectedSymbol, groupedTrades]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleRefresh = async () => {
    if (!id) return;

    setIsRefreshing(true);
    try {
      const response = await axios.get(`/api/strategies/${id}`);
      setStrategy(response.data);
      toast.success("Strategy data refreshed");
    } catch (error) {
      console.error("Error refreshing strategy:", error);
      toast.error("Failed to refresh strategy data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditStrategy = () => {
    router.push(`/strategies/new?id=${id}`);
  };

  if (isLoadingStrategy) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading strategy...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!strategy) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Strategy Not Found</h2>
            <p className="text-gray-600 mb-4">
              The strategy you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/strategies")}>
              Back to Strategies
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
                    <BreadcrumbLink href="/strategies">
                      Strategies
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{strategy.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col p-4 pt-0">
            {/* Strategy Status Banner */}
            <StatusBanner strategy={strategy} />

            {/* Header with controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {strategy.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>
                      Initial Equity: ${strategy.initialEquity.toLocaleString()}
                    </span>
                    <span>Timeframe: {strategy.timeframe}</span>
                    <span>
                      Period: {strategy.dateRange.from} to{" "}
                      {strategy.dateRange.to}
                    </span>
                    {strategy.runCount && strategy.runCount > 1 && (
                      <span>Runs: {strategy.runCount}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button onClick={handleEditStrategy}>
                    <Edit className="h-4 w-4" />
                    Edit Strategy
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {strategy.status === "failed" && (
              <ErrorDisplay
                error={strategy.error || ""}
                onRetry={handleEditStrategy}
                strategyId={id}
              />
            )}

            {/* Results Display - Only show when completed and has results */}
            {strategy.status === "completed" && tradingData.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-4 flex-1">
                {/* Chart Section */}
                <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col lg:order-1">
                  <h2 className="text-xl font-semibold mb-4">
                    {selectedSymbol || "Select a symbol"} Price Chart
                  </h2>
                  <div className="flex-1 min-h-[400px]">
                    {selectedSymbol && candleData.length > 0 ? (
                      <TradingChart
                        data={candleData}
                        type={"Candlestick"}
                        showVolume={true}
                        tradeData={groupedTrades[selectedSymbol]}
                        width="100%"
                        height="100%"
                        theme="light"
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        {selectedSymbol
                          ? "Loading chart data..."
                          : "Select a symbol to view chart"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trading List Section */}
                <div className="bg-white rounded-lg shadow-md p-4 lg:w-80 lg:order-2 order-first lg:order-last">
                  <h3 className="text-lg font-semibold mb-4">
                    Trading Results ({tradingData.length} symbols)
                  </h3>
                  <ScrollArea
                    className="w-full pr-4"
                    style={{ height: scrollHeight }}
                  >
                    <div className="space-y-2">
                      {tradingData.map((item) => (
                        <TradingListItem
                          key={item.symbol}
                          item={item}
                          isSelected={selectedSymbol === item.symbol}
                          onClick={handleSymbolSelect}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Empty State for Completed Strategy with No Results */}
            {strategy.status === "completed" && tradingData.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">
                  No Trading Results
                </h3>
                <p className="text-gray-600 mb-4">
                  The backtest completed but didn't generate any trades. This
                  might be due to strategy logic or market conditions.
                </p>
                <Button onClick={handleEditStrategy}>
                  Review & Edit Strategy
                </Button>
              </div>
            )}

            {/* Running State Display */}
            {strategy.status === "running" && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Backtest Running</h3>
                <p className="text-gray-600">
                  Your strategy is being backtested. This page will
                  automatically update when completed.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  Started:{" "}
                  {strategy.lastRunAt
                    ? new Date(strategy.lastRunAt).toLocaleString()
                    : "Unknown"}
                </div>
              </div>
            )}

            {/* Draft State Display */}
            {strategy.status === "draft" && (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Strategy Draft</h3>
                <p className="text-gray-600 mb-4">
                  This strategy is still in draft mode. Complete the
                  configuration and run a backtest to see results.
                </p>
                <Button onClick={handleEditStrategy}>
                  Complete Strategy Setup
                </Button>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
