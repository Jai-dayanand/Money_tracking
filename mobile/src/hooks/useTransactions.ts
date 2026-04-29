import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTransaction, deleteTransaction, getSummary, getTransactions, updateTransaction } from "../api/transactions";
import { CreateTransactionPayload, UpdateTransactionPayload } from "../types/transaction";

const transactionsKey = ["transactions"] as const;
const summaryKey = ["summary"] as const;

export function useTransactions() {
  return useQuery({
    queryKey: transactionsKey,
    queryFn: getTransactions
  });
}

export function useSummary() {
  return useQuery({
    queryKey: summaryKey,
    queryFn: getSummary
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => createTransaction(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, payload }: { transactionId: string; payload: UpdateTransactionPayload }) =>
      updateTransaction(transactionId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(transactionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}
