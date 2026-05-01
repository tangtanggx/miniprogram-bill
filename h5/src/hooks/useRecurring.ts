/**
 * 周期记账 Hook
 */

import { useRecurringStore } from '@/stores';

export function useRecurring() {
  const recurringBills = useRecurringStore((s) => s.recurringBills);
  const addRecurring = useRecurringStore((s) => s.addRecurring);
  const updateRecurring = useRecurringStore((s) => s.updateRecurring);
  const deleteRecurring = useRecurringStore((s) => s.deleteRecurring);
  const toggleRecurring = useRecurringStore((s) => s.toggleRecurring);
  const getDueBills = useRecurringStore((s) => s.getDueBills);
  const markExecuted = useRecurringStore((s) => s.markExecuted);

  const dueBills = getDueBills();

  return {
    recurringBills,
    dueBills,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    toggleRecurring,
    markExecuted,
  };
}
