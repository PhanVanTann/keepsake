import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { incomeRepo, type AddIncomeInput } from '@/data';
import type { IncomeStatus } from '@/types';

export function useIncomes(cycleId?: string) {
  return useQuery({
    queryKey: ['incomes', cycleId],
    queryFn: () => incomeRepo.getIncomes(cycleId as string),
    enabled: !!cycleId,
  });
}

export function useAddIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddIncomeInput) => incomeRepo.addIncome(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['incomes', variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ['currentCycle'] });
    },
  });
}

export function useConfirmIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      incomeId,
      status,
      amount,
    }: {
      incomeId: string;
      status: Extract<IncomeStatus, 'RECEIVED' | 'SKIPPED'>;
      amount?: number;
    }) => incomeRepo.confirmIncome(incomeId, status, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}
