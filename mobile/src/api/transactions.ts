import { CreateTransactionPayload, Summary, Transaction, UpdateTransactionPayload } from "../types/transaction";
import { http } from "./http";

type ServerTransaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  kind: "income" | "expense";
  notes?: string;
  is_fixed: boolean;
};

type ServerSummary = {
  monthly_income: number;
  monthly_expense: number;
  balance: number;
  top_categories: Array<{ category: string; amount: number }>;
};

let fallbackStore: Transaction[] = [];

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapServerTransaction(item: ServerTransaction): Transaction {
  return {
    id: item.id,
    title: item.title,
    amount: item.amount,
    category: item.category,
    date: item.date,
    kind: item.kind,
    notes: item.notes,
    isFixed: item.is_fixed
  };
}

function buildFallbackSummary(transactions: Transaction[]): Summary {
  const monthlyIncome = transactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyExpense = transactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const byCategory = transactions
    .filter((item) => item.kind === "expense")
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {});

  const topCategories = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  return {
    monthlyIncome,
    monthlyExpense,
    balance: monthlyIncome - monthlyExpense,
    topCategories
  };
}

export async function getTransactions(token: string): Promise<Transaction[]> {
  try {
    const data = await http<ServerTransaction[]>("/api/v1/transactions", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return data.map(mapServerTransaction);
  } catch {
    return fallbackStore;
  }
}

export async function createTransaction(payload: CreateTransactionPayload, token: string): Promise<Transaction> {
  try {
    const data = await http<ServerTransaction>("/api/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
        kind: payload.kind,
        notes: payload.notes,
        is_fixed: payload.isFixed
      })
    });

    return mapServerTransaction(data);
  } catch {
    const localTransaction: Transaction = {
      ...payload,
      id: createLocalId()
    };

    fallbackStore = [localTransaction, ...fallbackStore];
    return localTransaction;
  }
}

export async function getSummary(token: string): Promise<Summary> {
  try {
    const data = await http<ServerSummary>("/api/v1/transactions/summary", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return {
      monthlyIncome: data.monthly_income,
      monthlyExpense: data.monthly_expense,
      balance: data.balance,
      topCategories: data.top_categories
    };
  } catch {
    return buildFallbackSummary(fallbackStore);
  }
}

export async function updateTransaction(transactionId: string, payload: UpdateTransactionPayload, token: string): Promise<Transaction> {
  try {
    const data = await http<ServerTransaction>(`/api/v1/transactions/${transactionId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        date: payload.date,
        kind: payload.kind,
        notes: payload.notes,
        is_fixed: payload.isFixed
      })
    });

    return mapServerTransaction(data);
  } catch {
    const updated: Transaction = {
      ...payload,
      id: transactionId
    };

    fallbackStore = fallbackStore.map((item) => (item.id === transactionId ? updated : item));
    return updated;
  }
}

export async function deleteTransaction(transactionId: string, token: string): Promise<void> {
  try {
    await http<unknown>(`/api/v1/transactions/${transactionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    fallbackStore = fallbackStore.filter((item) => item.id !== transactionId);
  } catch {
    // Error handled by http client
  }
}
