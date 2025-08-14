export const COLLECTIONS = {
  STRATEGIES: "strategies",
  PORTFOLIOS: "portfolios",
  TRADE_HISTORY: "trade_history",
  USER_SETTINGS: "user_settings",
  NOTIFICATIONS: "notifications",
  MARKET_DATA: "market_data",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
