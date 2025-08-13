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
import { useSearchParams } from "next/navigation";
import { GroupedTrades } from "@/lib/trades";
import { ApiCandleData, transformCandleData } from "@/lib/candles";
import ProtectedRoute from "@/components/protected-route";

export default function Page() {
  const scrollHeight = useResponsiveHeight();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [candleData, setCandleData] = useState<ChartDataCandlestick[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");

  const [tradingData, setTradingData] = useState<TradingItem[]>([]);
  const [groupedTrades, setGroupedTrades] = useState<GroupedTrades>({});

  useEffect(() => {
    const handleGetStrategy = async () => {
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
    };
    handleGetStrategy();
  }, []);

  // Simulate data fetching
  useEffect(() => {
    if (selectedSymbol) {
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

      // Direct API call
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
        }
      };

      fetchCandle();
    }
  }, [selectedSymbol]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

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
                  <BreadcrumbItem>
                    <BreadcrumbPage>{id}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Main content area - this will fill remaining space */}
          <div className="flex flex-1 flex-col p-4 pt-0">
            {/* Header with controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Trading Dashboard
                </h1>
                <div className="flex gap-4">
                  <Button>Performance Metrics</Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              {/* Chart Section */}
              <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col lg:order-1">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedSymbol} Price Chart
                </h2>
                <div className="flex-1 min-h-[400px]">
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
                </div>
              </div>

              {/* Trading List Section - Responsive positioning */}
              <div className="bg-white rounded-lg shadow-md p-4 lg:w-80 lg:order-2 order-first lg:order-last">
                <h3 className="text-lg font-semibold mb-4">Market Watch</h3>
                <ScrollArea
                  className="w-full pr-4"
                  style={{ height: scrollHeight }}
                >
                  <div className="space-y-2">
                    {tradingData.map((item, index) => (
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
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
