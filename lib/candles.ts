import { ChartDataCandlestick } from "@/components/trading-chart";
import { Time } from "lightweight-charts";

export interface ApiCandleData {
  ts: string;
  ticker: string;
  o: number;
  c: number;
  h: number;
  l: number;
  n: string;
  v: number;
  vw: number;
}

export const transformCandleData = (
  apiData: ApiCandleData[]
): ChartDataCandlestick[] => {
  return apiData.map((candle) => ({
    time: parseInt(candle.ts) as Time, // Cast to Time in v5
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    volume: candle.v,
  }));
};
