import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic interfaces
export interface BaseDocument {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface QueryOptions {
  where?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction?: OrderByDirection;
  }>;
  limit?: number;
}

export interface BatchOperation {
  type: "create" | "update" | "delete";
  collection: string;
  id?: string;
  data?: any;
}

// Helper function to build query constraints
const buildQueryConstraints = (options?: QueryOptions): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];

  if (options?.where) {
    options.where.forEach(({ field, operator, value }) => {
      constraints.push(where(field, operator, value));
    });
  }

  if (options?.orderBy) {
    options.orderBy.forEach(({ field, direction = "asc" }) => {
      constraints.push(orderBy(field, direction));
    });
  }

  if (options?.limit) {
    constraints.push(limit(options.limit));
  }

  return constraints;
};

// Generic CRUD operations
export const createDocument = async <T extends BaseDocument>(
  collectionName: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocumentById = async <T extends BaseDocument>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async <T extends BaseDocument>(
  collectionName: string,
  options?: QueryOptions
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const constraints = buildQueryConstraints(options);
    const queryRef = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(queryRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async <T extends BaseDocument>(
  collectionName: string,
  id: string,
  updates: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Utility functions
export const documentExists = async (
  collectionName: string,
  id: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(
      `Error checking document existence in ${collectionName}:`,
      error
    );
    throw error;
  }
};

export const countDocuments = async (
  collectionName: string,
  options?: QueryOptions
): Promise<number> => {
  try {
    const documents = await getDocuments(collectionName, options);
    return documents.length;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    throw error;
  }
};
