import React from 'react';
import { formatMoney } from '../data/categories';
import { useExpense } from '../context/ExpenseContext';

export const Home = () => {
  const {
    budgetLimit,
    remainingBudget,
    percentUsed,
    monthSpent,
    weekSpent,
    expenses,
    categoryTotals,
    setIsBudgetModalOpen,
    googleConfig,
    setIsSyncModalOpen
  } = useExpense();

  const topCategory = categoryTotals[0];
  const overBudget = remainingBudget < 0;
  const today = new Date();
  const elapsedDays = Math.max(1, today.getDate());
  const monthExpenseCount = expenses.filter((expense) => {
    const date = new Date(`${String(expense.date || '').split('T')[0]}T00:00:00`);
    return !Number.isNaN(date.getTime())
      && date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth();
  }).length;
  const dailyAverage = monthSpent / elapsedDays;

  return (
    <div className="flex flex-col gap-3 pt-2">
      {!googleConfig.isConnected && (
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="text-left p-3 rounded-xl border border-amber-400/40 bg-amber-400/10 text-xs text-on-surface"
        >
          Connect your Google Sheet (script URL). No sign-in needed.
        </button>
      )}

      <section className="rounded-2xl bg-gradient-to-br from-primary/20 via-surface-container to-surface-container border border-primary/25 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-primary font-bold">Expense analysis</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Your spending this month</p>
          </div>
          <span className="material-symbols-outlined text-primary">insights</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface/70 p-2.5">
            <p className="text-[9px] uppercase text-on-surface-variant">Entries</p>
            <p className="text-base font-bold tabular-nums text-on-surface mt-1">{monthExpenseCount}</p>
          </div>
          <div className="rounded-xl bg-surface/70 p-2.5">
            <p className="text-[9px] uppercase text-on-surface-variant">Daily avg.</p>
            <p className="text-base font-bold tabular-nums text-on-surface mt-1">{formatMoney(dailyAverage)}</p>
          </div>
          <div className="rounded-xl bg-surface/70 p-2.5">
            <p className="text-[9px] uppercase text-on-surface-variant">Top category</p>
            <p className="text-xs font-bold text-on-surface mt-1 truncate">{topCategory?.amount > 0 ? topCategory.name : '—'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container border border-outline-variant/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">This month</p>
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="text-[11px] font-semibold text-primary"
          >
            Set budget
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant">Left in budget</p>
        <p className={`text-3xl font-bold tabular-nums ${overBudget ? 'text-error' : 'text-primary'}`}>
          {budgetLimit <= 0
            ? '—'
            : overBudget
              ? `Over by ${formatMoney(Math.abs(remainingBudget))}`
              : formatMoney(remainingBudget)}
        </p>
        <p className="text-[12px] text-on-surface-variant mt-1">
          Spent {formatMoney(monthSpent)} of {budgetLimit > 0 ? formatMoney(budgetLimit) : 'no budget set'}
        </p>
        <div className="w-full h-2 rounded-full bg-surface-container-lowest mt-3 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentUsed}%`,
              backgroundColor: overBudget ? '#ffb4ab' : '#4edea3'
            }}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-container border border-outline-variant/30 p-3">
          <p className="text-[10px] uppercase text-on-surface-variant font-semibold">This week</p>
          <p className="text-lg font-bold tabular-nums text-on-surface mt-1">{formatMoney(weekSpent)}</p>
        </div>
        <div className="rounded-xl bg-surface-container border border-outline-variant/30 p-3">
          <p className="text-[10px] uppercase text-on-surface-variant font-semibold">This month</p>
          <p className="text-lg font-bold tabular-nums text-on-surface mt-1">{formatMoney(monthSpent)}</p>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container border border-outline-variant/30 p-4">
        <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Where you spend</p>
        {topCategory && topCategory.amount > 0 ? (
          <p className="text-sm text-on-surface mb-3">
            You spend most on <span className="text-primary font-semibold">{topCategory.name}</span>
            {' '}({formatMoney(topCategory.amount)})
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant mb-3">Add expenses to see category totals.</p>
        )}
        <div className="space-y-2.5">
          {categoryTotals.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: cat.color }}>{cat.icon}</span>
                  {cat.name}
                </span>
                <span className="tabular-nums text-on-surface-variant">{formatMoney(cat.amount)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
