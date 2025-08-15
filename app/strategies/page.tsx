// app/strategies/page.tsx
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/contexts/AuthContext";
import { Strategy } from "@/lib/types/documents";
import {
  getUserStrategies,
  deleteStrategy,
  createStrategy,
} from "@/lib/services/strategy-services";
import { StrategyCard } from "@/components/strategy-card";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function StrategiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load strategies
  const loadStrategies = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const userStrategies = await getUserStrategies(user.uid, {
        orderBy: sortBy as "createdAt" | "updatedAt" | "name",
        orderDirection: "desc",
      });
      setStrategies(userStrategies);
      setFilteredStrategies(userStrategies);
    } catch (error) {
      console.error("Error loading strategies:", error);
      toast.error("Failed to load strategies");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      loadStrategies();
    }
  }, [user?.uid, sortBy]);

  // Filter and search strategies
  useEffect(() => {
    let filtered = strategies;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (strategy) => strategy.status === statusFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (strategy) =>
          strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.timeframe.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStrategies(filtered);
  }, [strategies, searchTerm, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStrategies();
    setIsRefreshing(false);
    toast.success("Strategies refreshed");
  };

  const handleCreateNew = () => {
    router.push("/strategies/new");
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      await deleteStrategy(id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      toast.success("Strategy deleted successfully");
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy");
    }
  };

  const handleDuplicateStrategy = async (strategy: Strategy) => {
    if (!user?.uid) return;

    try {
      const duplicatedStrategy: Strategy = {
        ...strategy,
        name: `${strategy.name} (Copy)`,
        status: "draft",
        userId: user.uid,
        runCount: 0,
        results: undefined,
        error: undefined,
        lastRunAt: undefined,
      };

      // Remove fields that shouldn't be duplicated
      delete duplicatedStrategy.id;
      delete duplicatedStrategy.createdAt;
      delete duplicatedStrategy.updatedAt;

      const newId = await createStrategy(duplicatedStrategy);
      toast.success("Strategy duplicated successfully");

      // Refresh the list
      await loadStrategies();

      // Navigate to edit the new strategy
      router.push(`/strategies/new?id=${newId}`);
    } catch (error) {
      console.error("Error duplicating strategy:", error);
      toast.error("Failed to duplicate strategy");
    }
  };

  // Statistics
  const stats = {
    total: strategies.length,
    draft: strategies.filter((s) => s.status === "draft").length,
    running: strategies.filter((s) => s.status === "running").length,
    completed: strategies.filter((s) => s.status === "completed").length,
    failed: strategies.filter((s) => s.status === "failed").length,
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading strategies...</p>
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
                    <BreadcrumbPage>Strategies</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">My Strategies</h1>
                <p className="text-muted-foreground">
                  Manage and monitor your trading strategies
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4" />
                  Create Strategy
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm text-muted-foreground">Draft</span>
                </div>
                <div className="text-2xl font-bold">{stats.draft}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-muted-foreground">Running</span>
                </div>
                <div className="text-2xl font-bold">{stats.running}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                </div>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-muted-foreground">Failed</span>
                </div>
                <div className="text-2xl font-bold">{stats.failed}</div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search strategies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Last Updated</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strategies Grid */}
            {filteredStrategies.length === 0 ? (
              <div className="text-center py-12">
                {strategies.length === 0 ? (
                  <div>
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No strategies yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first trading strategy to get started
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className="h-4 w-4" />
                      Create Your First Strategy
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No strategies found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onDelete={handleDeleteStrategy}
                    onDuplicate={handleDuplicateStrategy}
                  />
                ))}
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
