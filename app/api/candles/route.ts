import { NextRequest } from "next/server";
import client from "@/lib/clickhouse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query = `
      SELECT ts, ticker, o, c, h, l, n, v, vw 
      FROM bnf.${body.table} 
      WHERE ticker = {ticker:String} 
        AND ts >= {tsFrom:Int64} 
        AND ts <= {tsTo:Int64} 
      ORDER BY ts
    `;

    // Convert to UTC timestamps
    const tsFrom = Math.floor(
      new Date((body.dateFrom as string) + "Z").getTime() / 1000
    );
    const tsTo = Math.floor(
      new Date((body.dateTo as string) + "Z").getTime() / 1000
    );

    const result = await client.query({
      query,
      query_params: {
        ticker: body.ticker as string,
        tsFrom,
        tsTo,
      },
    });

    const data = await result.json();
    return Response.json({ message: "Success", data });
  } catch (error) {
    console.error("ClickHouse query error:", error);
    return Response.json({ error: "Failed to retrieve data" }, { status: 500 });
  }
}
