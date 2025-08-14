// lib/services/strategyService.ts
import { COLLECTIONS } from "../constants/collection";
import {
  createDocument,
  getDocumentById,
  getDocuments,
  updateDocument,
  deleteDocument,
  documentExists,
  QueryOptions,
} from "../firestore";
import { Strategy } from "../types/documents";

// Strategy operations
export const createStrategy = async (
  strategy: Omit<Strategy, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  return createDocument<Strategy>(COLLECTIONS.STRATEGIES, strategy);
};

export const getStrategy = async (id: string): Promise<Strategy | null> => {
  return getDocumentById<Strategy>(COLLECTIONS.STRATEGIES, id);
};

export const getUserStrategies = async (
  userId: string,
  options?: {
    status?: Strategy["status"];
    limit?: number;
  }
): Promise<Strategy[]> => {
  const queryOptions: QueryOptions = {
    where: [{ field: "userId", operator: "==", value: userId }],
    orderBy: [{ field: "createdAt", direction: "desc" }],
  };

  if (options?.status) {
    queryOptions.where!.push({
      field: "status",
      operator: "==",
      value: options.status,
    });
  }

  if (options?.limit) {
    queryOptions.limit = options.limit;
  }

  return getDocuments<Strategy>(COLLECTIONS.STRATEGIES, queryOptions);
};

export const updateStrategy = async (
  id: string,
  updates: Partial<Strategy>
): Promise<void> => {
  return updateDocument<Strategy>(COLLECTIONS.STRATEGIES, id, updates);
};

export const deleteStrategy = async (id: string): Promise<void> => {
  return deleteDocument(COLLECTIONS.STRATEGIES, id);
};
