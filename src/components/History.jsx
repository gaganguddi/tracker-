import React, { useMemo, useState } from 'react';
import { formatMoney, isInRange, startOfMonth, startOfWeek } from '../data/categories';
import { useExpense } from '../context/ExpenseContext';

const FILTERS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All' }
];

export const History = () => {
  const { expenses, deleteExpense, syncStatus } = useExpense();
  const [filter, setFilter] = useState('month');

  const filtered = useMemo(() => {
    if (filter === 'week') return expenses.filter((e) => isInRange(e.date, startOfWeek()));
    if (filter === 'month') return expenses.filter((e) => isInRange(e.date, startOfMonth()));
    return expenses;
  }, [expenses, filter]);

  const total = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleDelete = async (expense) => {
    const label = expense.merchant || expense.category || 'this expense';
    if (!window.confirm(`Delete ${label}? This will also remove it from Google Sheets.`)) return;
    await deleteExpense(expense.id);
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${
              filter === f.id
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-on-surface-variant">
        {filtered.length} expense{filtered.length === 1 ? '' : 's'} · {formatMoney(total)}
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">No expenses in this period.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="rounded-xl bg-surface-container border border-outline-variant/30 px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{e.merchant || e.category}</p>
                <p className="text-[11px] text-on-surface-variant">
                  {e.category} · {e.date}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-bold tabular-nums text-on-surface">{formatMoney(e.amount)}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(e)}
                  disabled={syncStatus === 'syncing'}
                  aria-label={`Delete ${e.merchant || e.category}`}
                  title="Delete expense"
                  className="text-error disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
