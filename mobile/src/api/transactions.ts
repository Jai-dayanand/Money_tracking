import { CreateTransactionPayload, Summary, Transaction } from "../types/transaction";
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

const fallbackTransactions: Transaction[] = [
  {
    id: "1",
    title: "Salary",
    amount: 3200,
    category: "Income",
    date: new Date().toISOString(),
    kind: "income",
    notes: "Monthly salary",
    isFixed: true
  },
  {
    id: "2",
    title: "Groceries",
    amount: 86.42,
    category: "Food",
    date: new Date().toISOString(),
    kind: "expense",
    notes: "Weekly shopping",
    isFixed: false
  },
  {
    id: "3",
    title: "Spotify",
    amount: 10.99,
    category: "Subscriptions",
    date: new Date().toISOString(),
    kind: "expense",
    notes: "Premium plan",
    isFixed: true
  }
];

let fallbackStore = [...fallbackTransactions];

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

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await http<ServerTransaction[]>("/api/v1/transactions");
    return data.map(mapServerTransaction);
  } catch {
    return fallbackStore;
  }
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  try {
    const data = await http<ServerTransaction>("/api/v1/transactions", {
      method: "POST",
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

export async function getSummary(): Promise<Summary> {
  try {
    const data = await http<ServerSummary>("/api/v1/transactions/summary");
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
