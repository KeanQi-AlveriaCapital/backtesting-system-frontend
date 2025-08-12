"use client";

import { AppSidebar } from "@/components/app-sidebar";
import TradingChart from "@/components/trading-chart";
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

export default function Page() {
  const scrollHeight = useResponsiveHeight();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [priceData, setPriceData] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [chartType, setChartType] = useState<"Line" | "Candlestick">(
    "Candlestick"
  );

  const [tradingData, setTradingData] = useState<TradingItem[]>([]);

  // Simulate data fetching
  useEffect(() => {
    // Your data fetching logic here
    // This could connect to your Python backtesting API
    const fetchData = async () => {
      // Mock data - replace with your API call
      const mockPriceData = Array.from({ length: 50 }, (_, i) => ({
        time: new Date(Date.now() - (49 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        value: 50000 + Math.random() * 10000 - 5000,
      }));

      const mockCandleData = Array.from({ length: 30 }, (_, i) => {
        const basePrice = 50000 + Math.random() * 10000 - 5000;
        const open = basePrice + Math.random() * 1000 - 500;
        const close = basePrice + Math.random() * 1000 - 500;
        const high = Math.max(open, close) + Math.random() * 500;
        const low = Math.min(open, close) - Math.random() * 500;

        return {
          time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          open,
          high,
          low,
          close,
        };
      });

      setPriceData(mockPriceData);
      setCandleData(mockCandleData);
    };

    const handleGetStrategy = async () => {
      //TODO: POST /api/trades to get data
      setTradingData([]);
    };

    fetchData();
    handleGetStrategy();
  }, [selectedSymbol]);

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
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
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
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
                  data={chartType === "Line" ? priceData : candleData}
                  type={chartType}
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
  );
}
