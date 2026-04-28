import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTransaction, getSummary, getTransactions } from "../api/transactions";
import { CreateTransactionPayload } from "../types/transaction";

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
