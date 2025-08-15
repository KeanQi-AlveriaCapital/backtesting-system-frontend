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
import { useState, useEffect } from "react";
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
import {
  Save,
  Play,
  Rocket,
  BarChart3,
  TrendingUp,
  Loader2,
} from "lucide-react";
import AdvancedCodeEditor from "@/components/advance-code-editor";
import axios from "axios";
import { Strategy } from "@/lib/types/documents";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { updateStrategy } from "@/lib/services/strategy-services";

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
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const isEditing = !!editingId;

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
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(isEditing);
  const [existingStrategy, setExistingStrategy] = useState<Strategy | null>(
    null
  );

  // Load existing strategy if editing
  useEffect(() => {
    const loadExistingStrategy = async () => {
      if (!isEditing || !editingId || !user?.uid) return;

      try {
        setIsLoadingStrategy(true);

        const response = await axios.get(`/api/code`, {
          params: {
            id: editingId,
            userId: user.uid,
          },
        });

        if (response.data.success) {
          const { strategy, code, message } = response.data;
          setExistingStrategy(strategy);

          // Parse date range
          const dateRange: DateRange = {
            from: new Date(strategy.dateRange.from),
            to: new Date(strategy.dateRange.to),
          };

          // Set form data
          setStrategyConfig({
            name: strategy.name,
            initialEquity: strategy.initialEquity,
            timeframe: strategy.timeframe,
            dateRange: dateRange,
            code: code || "", // Use fetched code or empty string
            language: "cpp", // Default to cpp, you could store this in strategy if needed
          });

          setRange(dateRange);

          if (message) {
            toast.info(message);
          } else {
            toast.success("Strategy loaded successfully");
          }
        }
      } catch (error) {
        console.error("Error loading strategy:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            toast.error("Strategy not found");
            router.push("/strategies");
          } else if (error.response?.status === 403) {
            toast.error("You don't have permission to edit this strategy");
            router.push("/strategies");
          } else {
            toast.error("Failed to load strategy");
          }
        } else {
          toast.error("Failed to load strategy");
        }
      } finally {
        setIsLoadingStrategy(false);
      }
    };

    loadExistingStrategy();
  }, [isEditing, editingId, user?.uid, router]);

  const handleCodeChange = (code: string, language: string) => {
    setStrategyConfig((prev) => ({
      ...prev,
      code,
      language,
    }));
  };

  const handleRunBacktest = async () => {
    if (!strategyConfig.name.trim() || !strategyConfig.code.trim()) {
      toast.error("Please complete the strategy configuration first");
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
      dateRange: range
        ? {
            from: formatLocalDate(range.from!),
            to: formatLocalDate(range.to!),
          }
        : undefined,
    };
    setIsLoading(true);

    try {
      const resp = await axios.post("/api/backtest", strategyBody);
      toast.success("Backtest completed! 🚀");

      // Navigate to results page
      if (resp.data.strategyId) {
        router.push(`/strategy?id=${resp.data.strategyId}`);
      }
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

  // Show loading state while fetching strategy
  if (isLoadingStrategy) {
    return (
      <ProtectedRoute>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">
                  Loading Strategy...
                </h2>
                <p className="text-gray-600">
                  Please wait while we fetch your strategy details.
                </p>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
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
                      {isEditing ? "Edit Strategy" : "Create New Strategy"}
                    </BreadcrumbPage>
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
                    {isEditing
                      ? `Edit Strategy: ${existingStrategy?.name}`
                      : "Strategy Configuration"}
                  </CardTitle>
                  {isEditing && existingStrategy && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span
                        className={`text-sm font-medium ${
                          existingStrategy.status === "completed"
                            ? "text-green-600"
                            : existingStrategy.status === "running"
                            ? "text-blue-600"
                            : existingStrategy.status === "failed"
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {existingStrategy.status}
                      </span>
                    </div>
                  )}
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
              defaultValue={strategyConfig.code} // This will be populated from the loaded strategy
              onChange={handleCodeChange}
              showToolbar={true}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
