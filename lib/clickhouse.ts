// lib/clickhouse.ts
import { createClient } from "@clickhouse/client";

const client = createClient({
  host: "http://192.168.88.4:8123",
  username: "default",
  password: "123456",
  database: "bnf",
});

export default client;
