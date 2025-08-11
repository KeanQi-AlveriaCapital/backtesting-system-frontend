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
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const [tradingData] = useState([
    {
      symbol: "BTC",
      price: "$67,245",
      change: "+2.35%",
      volume: "1.2B",
      status: "active",
    },
    {
      symbol: "ETH",
      price: "$3,456",
      change: "-1.24%",
      volume: "892M",
      status: "active",
    },
    {
      symbol: "AAPL",
      price: "$189.50",
      change: "+0.87%",
      volume: "45.6M",
      status: "active",
    },
    {
      symbol: "TSLA",
      price: "$256.78",
      change: "+3.21%",
      volume: "89.3M",
      status: "active",
    },
    {
      symbol: "NVDA",
      price: "$876.32",
      change: "+5.67%",
      volume: "134.7M",
      status: "active",
    },
    {
      symbol: "MSFT",
      price: "$412.18",
      change: "-0.45%",
      volume: "23.8M",
      status: "active",
    },
    {
      symbol: "GOOGL",
      price: "$165.43",
      change: "+1.89%",
      volume: "34.2M",
      status: "active",
    },
    {
      symbol: "AMZN",
      price: "$178.92",
      change: "+2.14%",
      volume: "56.7M",
      status: "active",
    },
    {
      symbol: "META",
      price: "$487.65",
      change: "-0.78%",
      volume: "41.9M",
      status: "active",
    },
    {
      symbol: "NFLX",
      price: "$598.43",
      change: "+4.32%",
      volume: "12.4M",
      status: "active",
    },
    {
      symbol: "AMD",
      price: "$143.87",
      change: "+2.98%",
      volume: "67.8M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
    {
      symbol: "INTC",
      price: "$28.45",
      change: "-1.67%",
      volume: "89.2M",
      status: "active",
    },
  ]);

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
              <ScrollArea className="h-[70vh] w-full pr-4">
                <div className="space-y-2">
                  {tradingData.map((item, index) => (
                    <div
                      key={item.symbol}
                      onClick={() => setSelectedSymbol(item.symbol)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                        selectedSymbol === item.symbol
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">
                              {item.symbol}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {item.price}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              Vol: {item.volume}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                item.change.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {item.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
