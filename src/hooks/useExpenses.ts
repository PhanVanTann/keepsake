import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { expenseRepo } from '@/data';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: expenseRepo.getCategories });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) => expenseRepo.createCategory(name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useCurrentCycle() {
  return useQuery({
    queryKey: ['currentCycle'],
    queryFn: async () => (await expenseRepo.getCurrentCycle()) ?? null,
  });
}

export function useCycles() {
  return useQuery({ queryKey: ['cycles'], queryFn: expenseRepo.getCycles });
}

export function useSavingGoal(cycleId?: string) {
  return useQuery({
    queryKey: ['savingGoal', cycleId],
    queryFn: async () => (await expenseRepo.getSavingGoal(cycleId as string)) ?? null,
    enabled: !!cycleId,
  });
}

export function useTransactions(cycleId?: string) {
  return useQuery({
    queryKey: ['transactions', cycleId],
    queryFn: () => expenseRepo.getTransactions(cycleId as string),
    enabled: !!cycleId,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => (await expenseRepo.getTransaction(id)) ?? null,
    enabled: !!id,
  });
}

export function useRecurringTransactions() {
  return useQuery({ queryKey: ['recurringTransactions'], queryFn: expenseRepo.getRecurringTransactions });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof expenseRepo.createRecurringTransaction>[0]) =>
      expenseRepo.createRecurringTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
}

export function useCategoryUsageCounts() {
  return useQuery({ queryKey: ['categoryUsageCounts'], queryFn: expenseRepo.getCategoryUsageCounts });
}
