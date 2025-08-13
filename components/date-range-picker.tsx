"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  range?: DateRange;
  title: string;
  onRangeChange: (range: DateRange | undefined) => void;
}

export default function DateRangePicker({
  range,
  title,
  onRangeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="dates" className="px-1">
        {title}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="dates"
            className="w-56 justify-between font-normal"
          >
            {range?.from && range?.to
              ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
              : range?.from
              ? `${range.from.toLocaleDateString()} - Select end date`
              : "Select date range"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            captionLayout="dropdown"
            onSelect={onRangeChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
