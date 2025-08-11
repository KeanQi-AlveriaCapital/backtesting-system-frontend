// components/TradingChart.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineData,
  CandlestickData,
  LineSeries,
  CandlestickSeries,
  LineSeriesOptions,
  CandlestickSeriesOptions,
} from "lightweight-charts";

interface ChartDataLine {
  time: string;
  value: number;
}

interface ChartDataCandlestick {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  data: ChartDataLine[] | ChartDataCandlestick[];
  type?: "Line" | "Candlestick";
  width?: string | number; // Can be "90%" or 800
  height?: string | number; // Can be "400px" or 400
  theme?: "light" | "dark";
  customOptions?: Partial<LineSeriesOptions | CandlestickSeriesOptions>;
  className?: string;
}

export default function TradingChart({
  data,
  type = "Line",
  width = "100%",
  height = 400,
  theme = "light",
  customOptions = {},
  className = "",
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  // ResizeObserver to detect container size changes
  const updateSize = useCallback(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();

    const newWidth = rect.width;
    const newHeight =
      typeof height === "string" ? parseInt(height.replace("px", "")) : height;

    if (newWidth !== chartSize.width || newHeight !== chartSize.height) {
      setChartSize({ width: newWidth, height: newHeight });

      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: newWidth,
          height: newHeight,
        });
      }
    }
  }, [height, chartSize.width, chartSize.height]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initial size calculation
    updateSize();

    // Theme colors
    const backgroundColor = theme === "dark" ? "#1a1a1a" : "white";
    const textColor = theme === "dark" ? "#ffffff" : "black";
    const gridColor = theme === "dark" ? "#2a2a2a" : "#f0f3fa";
    const borderColor = theme === "dark" ? "#555555" : "#cccccc";

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      width: chartSize.width || 800,
      height: chartSize.height || 400,
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: borderColor,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create series based on type
    if (type === "Candlestick") {
      const defaultCandlestickOptions: Partial<CandlestickSeriesOptions> = {
        upColor: "#4caf50",
        downColor: "#f44336",
        borderDownColor: "#f44336",
        borderUpColor: "#4caf50",
        wickDownColor: "#f44336",
        wickUpColor: "#4caf50",
      };

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        ...defaultCandlestickOptions,
        ...customOptions,
      });

      seriesRef.current = candlestickSeries;
      candlestickSeries.setData(data as CandlestickData[]);
    } else {
      const defaultLineOptions: Partial<LineSeriesOptions> = {
        color: "#2196F3",
        lineWidth: 2,
      };

      const lineSeries = chart.addSeries(LineSeries, {
        ...defaultLineOptions,
        ...customOptions,
      });

      seriesRef.current = lineSeries;
      lineSeries.setData(data as LineData[]);
    }

    // ResizeObserver for modern browsers
    let resizeObserver: ResizeObserver | null = null;

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(chartContainerRef.current);
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", updateSize);
    }

    // Cleanup
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateSize);
      }
      chart.remove();
    };
  }, [data, type, theme, customOptions, updateSize]);

  // Container style
  const containerStyle: React.CSSProperties = {
    width: typeof width === "string" ? width : `${width}px`,
    height: typeof height === "string" ? height : `${height}px`,
    position: "relative",
  };

  return (
    <div
      ref={chartContainerRef}
      className={`chart-container ${className}`}
      style={containerStyle}
    />
  );
}
