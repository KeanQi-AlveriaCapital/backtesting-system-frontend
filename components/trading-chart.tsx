// components/TradingChart.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  createSeriesMarkers, // Important: Import this function
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineSeriesOptions,
  CandlestickSeriesOptions,
  Time,
  SeriesMarker,
} from "lightweight-charts";
import { TradeData } from "@/lib/trades";

interface ChartDataLine {
  time: string;
  value: number;
}

export interface ChartDataCandlestick {
  time: Time; // Use Time type in v5
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingChartProps {
  data: ChartDataCandlestick[];
  type?: "Line" | "Candlestick";
  showVolume?: boolean;
  tradeData: TradeData[];
  width?: string | number;
  height?: string | number;
  theme?: "light" | "dark";
  customOptions?: Partial<LineSeriesOptions | CandlestickSeriesOptions>;
  className?: string;
}

export default function TradingChart({
  data,
  type = "Line",
  showVolume = false,
  tradeData = [],
  width = "100%",
  height = 400,
  theme = "light",
  customOptions = {},
  className = "",
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const markersRef = useRef<any>(null); // Reference for markers primitive
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const rect = container.getBoundingClientRect();

    const newWidth = rect.width;
    const newHeight = rect.height;

    if (newWidth !== chartSize.width || newHeight !== chartSize.height) {
      setChartSize({ width: newWidth, height: newHeight });

      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: newWidth,
          height: newHeight,
        });
      }
    }
  }, [chartSize.width, chartSize.height]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    updateSize();

    const backgroundColor = theme === "dark" ? "#1a1a1a" : "white";
    const textColor = theme === "dark" ? "#ffffff" : "black";
    const gridColor = theme === "dark" ? "#2a2a2a" : "#f0f3fa";
    const borderColor = theme === "dark" ? "#555555" : "#cccccc";

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

      // Add volume series if showVolume is true and data has volume
      if (showVolume && data.some((d) => d.volume !== undefined)) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color:
            theme === "dark"
              ? "rgba(76, 175, 80, 0.3)"
              : "rgba(76, 175, 80, 0.5)",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "volume",
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.7,
            bottom: 0,
          },
        });

        const volumeData = data
          .filter((d) => d.volume !== undefined)
          .map((d) => ({
            time: d.time as Time,
            value: d.volume!,
            color:
              d.close >= d.open
                ? theme === "dark"
                  ? "rgba(76, 175, 80, 0.6)"
                  : "rgba(76, 175, 80, 0.8)"
                : theme === "dark"
                ? "rgba(244, 67, 54, 0.6)"
                : "rgba(244, 67, 54, 0.8)",
          }));

        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
      }

      // Add trade markers using v5 API - CORRECT WAY
      if (tradeData && tradeData.length > 0) {
        const markers: SeriesMarker<Time>[] = tradeData.flatMap((trade) => {
          const entryTime = Math.floor(
            new Date(trade.entryTime.trim()).getTime() / 1000
          ) as Time;
          const exitTime = Math.floor(
            new Date(trade.exitTime.trim()).getTime() / 1000
          ) as Time;

          return [
            {
              time: entryTime,
              position: trade.quantity > 0 ? "belowBar" : "aboveBar",
              color: trade.quantity > 0 ? "#2196F3" : "#FF9800",
              shape: trade.quantity > 0 ? "arrowUp" : "arrowDown",
              text: `Entry: $${trade.entryPrice.toFixed(3)} | Qty: ${Math.abs(
                trade.quantity
              ).toLocaleString()}`,
            },
            {
              time: exitTime,
              position: trade.quantity > 0 ? "aboveBar" : "belowBar",
              color: trade.pnlAmount > 0 ? "#4CAF50" : "#F44336",
              shape: trade.quantity > 0 ? "arrowDown" : "arrowUp",
              text: `Exit: $${trade.exitPrice.toFixed(
                3
              )} | PnL: $${trade.pnlAmount.toFixed(
                2
              )} (${trade.pnlPercentage.toFixed(2)}%)`,
            },
          ];
        });

        // Create markers using the v5 API
        markersRef.current = createSeriesMarkers(candlestickSeries, markers);
      }

      // Add stop loss lines
      if (tradeData && tradeData.length > 0) {
        tradeData.forEach((trade) => {
          const stopLossLine = chart.addSeries(LineSeries, {
            color: "#FF5722",
            lineWidth: 1,
            lineStyle: 2,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          });

          const entryTime = Math.floor(
            new Date(trade.entryTime.trim()).getTime() / 1000
          ) as Time;
          const exitTime = Math.floor(
            new Date(trade.exitTime.trim()).getTime() / 1000
          ) as Time;

          const stopLossData = [
            { time: entryTime, value: trade.stoplossPrice },
            { time: exitTime, value: trade.stoplossPrice },
          ];

          stopLossLine.setData(stopLossData);
        });
      }
    }

    let resizeObserver: ResizeObserver | null = null;

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(chartContainerRef.current);
    } else {
      window.addEventListener("resize", updateSize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateSize);
      }
      chart.remove();
    };
  }, [data, type, theme, customOptions, showVolume, tradeData, updateSize]);

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
