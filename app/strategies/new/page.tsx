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
import { timeframeLabels, timeframes } from "@/lib/trades";

export default function NewStrategyPage() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
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
                    <BreadcrumbPage>Create New</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col p-4 pt-0">
            {/* Header with controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="dates" className="px-1">
                    Strategy Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value > 0) {
                        // Handle valid input
                        console.log(value);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="dates" className="px-1">
                      Initial Equity
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={10000}
                      placeholder="Enter amount"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          // Handle valid input
                          console.log(value);
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="dates" className="px-1">
                      Trading Timeframe
                    </Label>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
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
                    title="Backtest Date Range"
                    range={range}
                    onRangeChange={setRange}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
