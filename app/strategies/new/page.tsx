"use client";

import { AppSidebar } from "@/components/app-sidebar";
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
import ProtectedRoute from "@/components/protected-route";
import DateRangePicker from "@/components/date-range-picker";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeframeLabels, timeframes } from "@/lib/trades";
import { toast } from "sonner";
import { Save, Play, Rocket, BarChart3, TrendingUp } from "lucide-react";
import AdvancedCodeEditor from "@/components/advance-code-editor";

interface StrategyConfig {
  name: string;
  initialEquity: number;
  timeframe: string;
  dateRange: DateRange | undefined;
  code: string;
  language: string;
}

export default function NewStrategyPage() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    name: "",
    initialEquity: 100000,
    timeframe: "",
    dateRange: undefined,
    code: "",
    language: "cpp",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (code: string, language: string) => {
    setStrategyConfig((prev) => ({
      ...prev,
      code,
      language,
    }));
  };

  const handleSaveStrategy = async () => {
    // Enhanced validation
    if (!strategyConfig.name.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    if (strategyConfig.name.length < 3) {
      toast.error("Strategy name must be at least 3 characters long");
      return;
    }

    if (!strategyConfig.timeframe) {
      toast.error("Please select a trading timeframe");
      return;
    }

    if (!range?.from || !range?.to) {
      toast.error("Please select a backtest date range");
      return;
    }

    if (!strategyConfig.code.trim()) {
      toast.error("Please enter your strategy code");
      return;
    }

    if (strategyConfig.code.length < 50) {
      toast.error(
        "Strategy code seems too short. Please add more implementation details."
      );
      return;
    }

    setIsLoading(true);

    try {
      const strategyData = {
        ...strategyConfig,
        dateRange: range,
        createdAt: new Date().toISOString(),
        version: "1.0.0",
      };

      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Strategy saved successfully! 🎉", {
        description: `Saved as "${strategyConfig.name}" with ${strategyConfig.code.length} lines of code.`,
      });

      console.log("Saving strategy:", strategyData);

      // Here you would send to your backend API
      // const response = await fetch('/api/strategies', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(strategyData)
      // });
    } catch (error) {
      toast.error("Failed to save strategy. Please try again.");
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBacktest = async () => {
    if (!strategyConfig.name.trim() || !strategyConfig.code.trim()) {
      toast.error("Please complete the strategy configuration first");
      return;
    }

    // setIsLoading(true);

    try {
      // // Simulate running backtest with progress updates
      // toast.info("Initializing backtest...", { duration: 1000 });

      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // toast.info("Loading historical data...", { duration: 1000 });

      // await new Promise((resolve) => setTimeout(resolve, 1500));
      // toast.info("Running strategy simulation...", { duration: 1000 });

      // await new Promise((resolve) => setTimeout(resolve, 2000));
      // toast.info("Calculating performance metrics...", { duration: 1000 });

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // toast.success("Backtest completed! 🚀 Redirecting to results...", {
      //   description:
      //     "Your strategy has been successfully backtested with historical data.",
      // });

      // // Here you would navigate to results page
      // // router.push(`/strategy?id=${strategyId}`);

      console.log(strategyConfig);
    } catch (error) {
      toast.error("Backtest failed. Please try again.");
      console.error("Backtest error:", error);
    } finally {
      setIsLoading(false);
    }
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
                    <BreadcrumbLink href="/strategies">
                      Strategies
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create New Strategy</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Strategy Configuration
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="strategy-name">Strategy Name *</Label>
                    <Input
                      id="strategy-name"
                      type="text"
                      placeholder="e.g., SMA Crossover v1.0"
                      value={strategyConfig.name}
                      onChange={(e) =>
                        setStrategyConfig((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={
                        !strategyConfig.name.trim() ? "border-red-300" : ""
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label htmlFor="initial-equity">Initial Equity ($) *</Label>
                    <Input
                      id="initial-equity"
                      type="number"
                      min={1000}
                      max={10000000}
                      step={1000}
                      placeholder="100000"
                      value={strategyConfig.initialEquity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 1000) {
                          setStrategyConfig((prev) => ({
                            ...prev,
                            initialEquity: value,
                          }));
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label htmlFor="timeframe">Trading Timeframe *</Label>
                    <Select
                      value={strategyConfig.timeframe}
                      onValueChange={(value) =>
                        setStrategyConfig((prev) => ({
                          ...prev,
                          timeframe: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Crypto</SelectLabel>
                          {timeframes.map((timeframe) => (
                            <SelectItem
                              key={timeframe}
                              value={"bnf." + timeframe}
                            >
                              {timeframeLabels[timeframe]}
                            </SelectItem>
                          ))}
                          <SelectLabel>Stocks</SelectLabel>
                          {timeframes.map((timeframe) => (
                            <SelectItem key={timeframe} value={timeframe}>
                              {timeframeLabels[timeframe]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <DateRangePicker
                    title="Backtest Date Range *"
                    range={range}
                    onRangeChange={(newRange) => {
                      setRange(newRange);
                      setStrategyConfig((prev) => ({
                        ...prev,
                        dateRange: newRange,
                      }));
                    }}
                  />
                </div>
              </CardContent>

              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Code Lines: {strategyConfig.code.split("\n").length}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Language: {strategyConfig.language.toUpperCase()}
                    </div>
                    {range?.from && range?.to && (
                      <div>
                        Backtest Period:{" "}
                        {Math.ceil(
                          (range.to.getTime() - range.from.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveStrategy}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4" />
                      Save Strategy
                    </Button>

                    <Button
                      onClick={handleRunBacktest}
                      disabled={isLoading || !strategyConfig.code.trim()}
                    >
                      <Play className="h-4 w-4" />
                      {isLoading ? "Running Backtest..." : "Run Backtest"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Code Editor */}
            <AdvancedCodeEditor
              defaultLanguage="cpp"
              onChange={handleCodeChange}
              showToolbar={true}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
