import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { RECURRING_SUBSCRIPTIONS } from '../data/initialData';
import { exportExpensesToCSV } from '../services/googleSyncService';

export const Transactions = () => {
  const {
    expenses,
    totalSpent,
    currencySymbol,
    activePeriod,
    setSelectedReceipt,
    deleteExpense
  } = useExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'expenses' | 'recurring' | 'receipts'

  // Filter transactions
  const filteredExpenses = useMemo(() => {
    return expenses.filter(tx => {
      // Search matching
      const matchesSearch = !searchQuery.trim() || 
        tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Filter category
      if (activeFilter === 'recurring') {
        return tx.isRecurring;
      }
      if (activeFilter === 'receipts') {
        return Boolean(tx.receiptUrl);
      }
      if (activeFilter === 'expenses') {
        return true;
      }

      return true;
    });
  }, [expenses, searchQuery, activeFilter]);

  // Group by date
  const groupedExpenses = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach(tx => {
      const date = tx.date || 'Earlier';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });
    return groups;
  }, [filteredExpenses]);

  return (
    <div className="flex flex-col w-full gap-2.5 pb-6">
      {/* Search & Filter Deck */}
      <section className="flex flex-col gap-2">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants, categories, tags..."
            className="w-full bg-surface-container-high text-on-surface text-xs rounded-xl pl-9 pr-9 py-2 placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-highest shadow-sm transition-all border border-outline-variant/30"
          />
          {searchQuery && (
            <button
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          )}
        </div>

        {/* Filter Chips Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`filter-chip px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 shadow-sm transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
            }`}
          >
            All ({expenses.length})
          </button>

          <button
            onClick={() => setActiveFilter('expenses')}
            className={`filter-chip px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
              activeFilter === 'expenses'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
            }`}
          >
            Expenses
          </button>

          <button
            onClick={() => setActiveFilter('recurring')}
            className={`filter-chip flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
              activeFilter === 'recurring'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Recurring ({expenses.filter(e => e.isRecurring).length})
          </button>

          <button
            onClick={() => setActiveFilter('receipts')}
            className={`filter-chip flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
              activeFilter === 'receipts'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">receipt</span>
            Receipts ({expenses.filter(e => e.receiptUrl).length})
          </button>
        </div>
      </section>

      {/* Month Aggregation Banner - Compact */}
      <section className="bg-surface-container-low rounded-xl p-2.5 shadow-sm flex items-center justify-between border border-outline-variant/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-on-surface truncate leading-tight">
              {activePeriod}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {filteredExpenses.length} transactions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Net Spent
            </span>
            <span className="text-[15px] text-on-surface tracking-tight font-bold tabular-nums leading-tight">
              {currencySymbol}{filteredExpenses.reduce((s, i) => s + Number(i.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => exportExpensesToCSV(expenses)}
            title="Export transactions as CSV"
            className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
          </button>
        </div>
      </section>

      {/* Recurring Subscriptions Spotlight - Compact */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Monthly Subscriptions
          </span>
          <span className="text-[10px] text-primary font-semibold">4 Active</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {RECURRING_SUBSCRIPTIONS.map(sub => (
            <div
              key={sub.id}
              className="min-w-[125px] p-2 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between shrink-0 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-[16px]" style={{ color: sub.color }}>
                  {sub.icon}
                </span>
                <span className="text-[9px] text-on-surface-variant">{sub.nextDate}</span>
              </div>
              <div className="mt-1.5">
                <span className="text-[11px] font-semibold text-on-surface block truncate">
                  {sub.name}
                </span>
                <span className="text-[12px] font-bold text-primary tabular-nums">
                  {currencySymbol}{sub.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grouped Transactions List - Compact */}
      <section className="flex flex-col gap-3">
        {Object.keys(groupedExpenses).length === 0 ? (
          <div className="p-6 text-center bg-surface-container rounded-xl border border-outline-variant/20 flex flex-col items-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1.5">search_off</span>
            <p className="text-on-surface font-semibold text-xs">No transactions match your search</p>
            <p className="text-on-surface-variant text-[11px] mt-0.5">Try clearing filters or search terms</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              className="mt-2.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([date, txs]) => (
            <div key={date} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {date === '2024-10-22' ? 'Today, Oct 22' : date === '2024-10-21' ? 'Yesterday, Oct 21' : date}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {currencySymbol}{txs.reduce((a, b) => a + Number(b.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {txs.map(tx => (
                  <div
                    key={tx.id}
                    className="bg-surface-container hover:bg-surface-container-high transition-colors p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between shadow-sm group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[17px]">
                          {tx.category === 'Food & Dining' ? 'restaurant' :
                           tx.category === 'Groceries' ? 'shopping_cart' :
                           tx.category === 'Transportation' ? 'directions_car' :
                           tx.category === 'Shopping' ? 'shopping_bag' :
                           tx.category === 'Bills & Utilities' ? 'receipt_long' :
                           tx.category === 'Entertainment' ? 'movie' :
                           tx.category === 'Health' ? 'favorite' : 'payments'}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[12px] text-on-surface truncate">
                            {tx.merchant}
                          </span>
                          {tx.isRecurring && (
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" title="Recurring"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                          <span>{tx.time || tx.category}</span>
                          <span>•</span>
                          <span className="truncate">{tx.paymentMethod}</span>
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-[90px]">{tx.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Receipt View Button */}
                      {tx.receiptUrl && (
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          title="View receipt"
                          className="w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors border border-primary/20"
                        >
                          <span className="material-symbols-outlined text-[14px]">receipt</span>
                        </button>
                      )}

                      <span className="font-bold text-[12px] text-on-surface tabular-nums">
                        -{currencySymbol}{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      {/* Delete action */}
                      <button
                        onClick={() => deleteExpense(tx.id)}
                        title="Delete expense"
                        className="opacity-0 group-hover:opacity-100 text-error hover:text-red-400 p-0.5 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
