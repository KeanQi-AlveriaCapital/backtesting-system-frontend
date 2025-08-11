"use client";

import { AppSidebar } from "@/components/app-sidebar";
import TradingChart from "@/components/trading-chart";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export default function Page() {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [chartType, setChartType] = useState<"Line" | "Candlestick">(
    "Candlestick"
  );

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

    fetchData();
  }, [selectedSymbol]);

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
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="BTC">Bitcoin</option>
                  <option value="ETH">Ethereum</option>
                  <option value="AAPL">Apple</option>
                </select>
                <select
                  value={chartType}
                  onChange={(e) =>
                    setChartType(e.target.value as "Line" | "Candlestick")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Line">Line Chart</option>
                  <option value="Candlestick">Candlestick</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chart container - this will fill remaining vertical space */}
          <div className="bg-white rounded-lg shadow-md p-4 flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">
              {selectedSymbol} Price Chart
            </h2>
            <div className="flex-1">
              {" "}
              {/* This div will fill remaining space */}
              <TradingChart
                data={chartType === "Line" ? priceData : candleData}
                type={chartType}
                width="90%"
                height="100%" // Now 100% will work because parent has defined height
                theme="light"
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
