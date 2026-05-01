import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTransaction, deleteTransaction, getSummary, getTransactions, updateTransaction } from "../api/transactions";
import { useAuth } from "../auth";
import { CreateTransactionPayload, UpdateTransactionPayload } from "../types/transaction";

const transactionsKey = ["transactions"] as const;
const summaryKey = ["summary"] as const;

export function useTransactions() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: [...transactionsKey, user?.id ?? "anonymous"],
    queryFn: () => getTransactions(token || ""),
    enabled: !!token && !!user?.id
  });
}

export function useSummary() {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: [...summaryKey, user?.id ?? "anonymous"],
    queryFn: () => getSummary(token || ""),
    enabled: !!token && !!user?.id
  });
}

export function useCreateTransaction() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => createTransaction(payload, token || ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}

export function useUpdateTransaction() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, payload }: { transactionId: string; payload: UpdateTransactionPayload }) =>
      updateTransaction(transactionId, payload, token || ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}

export function useDeleteTransaction() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => deleteTransaction(transactionId, token || ""),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionsKey }),
        queryClient.invalidateQueries({ queryKey: summaryKey })
      ]);
    }
  });
}
