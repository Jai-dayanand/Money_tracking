export type TransactionKind = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  kind: TransactionKind;
  notes?: string;
  isFixed: boolean;
};

export type CreateTransactionPayload = {
  title: string;
  amount: number;
  category: string;
  date: string;
  kind: TransactionKind;
  notes?: string;
  isFixed: boolean;
};

export type UpdateTransactionPayload = CreateTransactionPayload;

export type CategorySpend = {
  category: string;
  amount: number;
};

export type Summary = {
  monthlyIncome: number;
  monthlyExpense: number;
  balance: number;
  topCategories: CategorySpend[];
};
