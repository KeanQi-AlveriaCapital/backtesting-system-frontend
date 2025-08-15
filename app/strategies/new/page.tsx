// app/strategies/new/page.tsx
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
import { useState, useEffect, useCallback } from "react";
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
import axios from "axios";
import { Strategy } from "@/lib/types/documents";
import { useAuth } from "@/contexts/AuthContext";
import {
  createStrategy,
  updateStrategy,
} from "@/lib/services/strategy-services";
import { useRouter } from "next/navigation";

export interface StrategyConfig {
  name: string;
  initialEquity: number;
  timeframe: string;
  dateRange: DateRange | undefined;
  code: string;
  language: string;
}

export default function NewStrategyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [runCount, setRunCount] = useState(0);
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    name: "",
    initialEquity: 100000,
    timeframe: "",
    dateRange: undefined,
    code: "",
    language: "cpp",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const generateStrategyId = async () => {
      if (!user?.uid) return;

      try {
        setIsInitializing(true);

        // Check if there's already an ID in URL (user refreshed page)
        const urlParams = new URLSearchParams(window.location.search);
        const existingId = urlParams.get("id");

        if (existingId) {
          // Load existing strategy
          try {
            const response = await axios.get(`/api/strategies/${existingId}`);
            const existingStrategy = response.data;

            // Populate form with existing strategy data
            setStrategyConfig({
              name: existingStrategy.name,
              initialEquity: existingStrategy.initialEquity,
              timeframe: existingStrategy.timeframe,
              dateRange:
                existingStrategy.dateRange.from && existingStrategy.dateRange.to
                  ? {
                      from: new Date(existingStrategy.dateRange.from),
                      to: new Date(existingStrategy.dateRange.to),
                    }
                  : undefined,
              code: "", // Code would need to be loaded separately if stored
              language: "cpp", // Default language
            });

            if (
              existingStrategy.dateRange.from &&
              existingStrategy.dateRange.to
            ) {
              setRange({
                from: new Date(existingStrategy.dateRange.from),
                to: new Date(existingStrategy.dateRange.to),
              });
            }

            setRunCount(existingStrategy.runCount || 0);
            setStrategyId(existingId);

            toast.success("Loaded existing strategy for editing");
          } catch (error) {
            console.error("Failed to load existing strategy:", error);
            toast.error("Failed to load strategy. Creating new one...");
            await createNewDraftStrategy();
          }
        } else {
          await createNewDraftStrategy();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    const createNewDraftStrategy = async () => {
      const draftStrategy: Strategy = {
        initialEquity: 100000,
        dateRange: { from: "", to: "" },
        name: "Untitled Strategy",
        status: "draft",
        timeframe: "",
        userId: user?.uid || "",
        runCount: 0,
      };

      const id = await createStrategy(draftStrategy);
      setStrategyId(id);

      // Update URL to include strategy ID for future reference
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("id", id);
      window.history.replaceState({}, "", newUrl);

      toast.success("Draft strategy created. Your work will be auto-saved.");
    };

    if (user?.uid) {
      generateStrategyId();
    }
  }, [user?.uid]);

  const handleCodeChange = (code: string, language: string) => {
    setStrategyConfig((prev) => ({
      ...prev,
      code,
      language,
    }));
  };

  // Auto-save strategy config changes (debounced)
  const debouncedAutoSave = useCallback(
    debounce(async (config: StrategyConfig, id: string) => {
      if (!id || !config.name.trim()) return;

      try {
        const formatLocalDate = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        await updateStrategy(id, {
          name: config.name,
          initialEquity: config.initialEquity,
          timeframe: config.timeframe,
          dateRange: config.dateRange
            ? {
                from: formatLocalDate(config.dateRange.from!),
                to: formatLocalDate(config.dateRange.to!),
              }
            : { from: "", to: "" },
        });
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 2000),
    []
  );

  useEffect(() => {
    if (strategyId && strategyConfig.name.trim()) {
      debouncedAutoSave(strategyConfig, strategyId);
    }
  }, [strategyConfig, strategyId, debouncedAutoSave]);

  const handleSaveStrategy = async () => {
    if (!strategyId) {
      toast.error("Strategy not initialized. Please refresh the page.");
      return;
    }

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

    setIsLoading(true);

    try {
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      await updateStrategy(strategyId, {
        name: strategyConfig.name,
        initialEquity: strategyConfig.initialEquity,
        timeframe: strategyConfig.timeframe,
        dateRange: {
          from: formatLocalDate(range.from),
          to: formatLocalDate(range.to),
        },
      });

      toast.success("Strategy saved successfully! 🎉", {
        description: `Saved "${strategyConfig.name}" with ${
          strategyConfig.code.split("\n").length
        } lines of code.`,
      });
    } catch (error) {
      toast.error("Failed to save strategy. Please try again.");
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBacktest = async () => {
    if (!strategyId) {
      toast.error("Strategy not initialized. Please refresh the page.");
      return;
    }

    if (!strategyConfig.name.trim() || !strategyConfig.code.trim()) {
      toast.error("Please complete the strategy configuration first");
      return;
    }

    if (!range?.from || !range?.to) {
      toast.error("Please select a backtest date range");
      return;
    }

    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const strategyBody = {
      ...strategyConfig,
      userId: user?.uid,
      strategyId, // Pass existing strategy ID
      updateExisting: true, // Flag to update instead of create
      runCount: runCount + 1,
      dateRange: {
        from: formatLocalDate(range.from),
        to: formatLocalDate(range.to),
      },
    };

    setIsLoading(true);

    try {
      const resp = await axios.post("/api/backtest", strategyBody);
      console.log(resp);

      setRunCount((prev) => prev + 1);
      toast.success("Backtest submitted successfully! 🚀");

      // Redirect to strategy page
      router.push(`/strategy?id=${strategyId}`);
    } catch (error) {
      console.error("Backtest error:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        toast.error("Backtest Failed", {
          description: errorData.details || "Unknown error occurred",
          duration: 10000,
        });
      } else {
        toast.error("Backtest failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Initializing strategy...</p>
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
                    <BreadcrumbLink href="/strategies">
                      Strategies
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {strategyConfig.name || "Create New Strategy"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Strategy Info Banner */}
            {strategyId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span>📝</span>
                  <span>
                    Strategy ID:{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      {strategyId}
                    </code>
                    {runCount > 0 && (
                      <span className="ml-2">| Runs: {runCount}</span>
                    )}
                    <span className="ml-2">| Auto-save enabled</span>
                  </span>
                </div>
              </div>
            )}

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
                      {isLoading
                        ? "Running Backtest..."
                        : runCount > 0
                        ? "Re-run Backtest"
                        : "Run Backtest"}
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

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
