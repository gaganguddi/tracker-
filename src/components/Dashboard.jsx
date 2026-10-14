import React, { useState, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';

export const Dashboard = () => {
  const {
    expenses,
    totalSpent,
    remainingBudget,
    budgetLimit,
    percentUsed,
    categoryTotals,
    currencySymbol,
    activePeriod,
    setActivePeriod,
    setActiveTab,
    setSelectedReceipt,
    addExpense,
    triggerSyncNow,
    syncStatus,
    googleConfig,
    setIsBudgetModalOpen,
    setIsSyncModalOpen
  } = useExpense();

  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Available periods
  const periods = ["October 2024", "September 2024", "August 2024"];

  // Calculate daily pacing
  const today = 22; // Day of month
  const totalDaysInMonth = 31;
  const daysRemaining = totalDaysInMonth - today;
  const dailyAverage = today > 0 ? (totalSpent / today).toFixed(2) : '0.00';
  const safeDailyPace = daysRemaining > 0 ? (remainingBudget / daysRemaining).toFixed(2) : '0.00';
  const isPaceHealthy = Number(dailyAverage) <= Number(safeDailyPace) * 1.1;

  // Handle instant receipt scan/upload from Dashboard
  const handleQuickReceiptScan = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate smart quick OCR receipt detection in India (INR)
    const sampleMerchants = ["Swiggy / Zomato", "Blinkit / Zepto", "Blue Tokai Coffee", "Indian Oil Fuel", "Reliance Smart", "Apollo Pharmacy"];
    const randomMerchant = sampleMerchants[Math.floor(Math.random() * sampleMerchants.length)];
    const randomAmount = (Math.floor(Math.random() * 800) + 120).toFixed(2);

    addExpense({
      merchant: `${randomMerchant} (Scan)`,
      category: "Food & Dining",
      amount: parseFloat(randomAmount),
      notes: "Scanned via Quick Receipt button",
      paymentMethod: "UPI (GPay)"
    }, file);
  };

  const recentTransactions = expenses.slice(0, 5);

  return (
    <div className="flex flex-col w-full gap-3 pb-4">
      {/* Real Google Sheet Connect Banner if not yet connected */}
      {!googleConfig.isConnected && (
        <div className="bg-gradient-to-r from-surface-container-high to-surface-container rounded-xl p-2.5 border border-primary/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 min-w-0 pr-1.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-on-surface truncate">
                Connect Real Google Sheet
              </span>
              <span className="text-[9px] text-on-surface-variant truncate">
                Paste link to fetch your live transactions
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold shrink-0 shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Connect
          </button>
        </div>
      )}

      {/* Header Greeting & Month Selector */}
      <section className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Live Cashflow
            </span>
            {googleConfig.isConnected && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] bg-primary/10 text-primary border border-primary/20">
                Sheets Synced
              </span>
            )}
          </div>
          <h1 className="text-[17px] font-bold text-on-surface truncate">
            Good morning, Alex
          </h1>
        </div>

        {/* Dropdown Period Pill */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
            className="flex items-center gap-1 bg-surface-container-high hover:bg-surface-container-highest px-2.5 py-1 rounded-full shadow-sm transition-all active:scale-95 text-on-surface border border-outline-variant/30 text-[11px]"
          >
            <span className="material-symbols-outlined text-primary text-[14px]">calendar_today</span>
            <span className="font-semibold">{activePeriod}</span>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              {isPeriodMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isPeriodMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-surface-container-highest rounded-xl p-1 shadow-xl z-30 border border-outline-variant/40 animate-in fade-in zoom-in-95 duration-150">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setActivePeriod(p);
                    setIsPeriodMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition-colors ${
                    activePeriod === p
                      ? 'bg-surface-container text-primary font-semibold'
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span>{p}</span>
                  {activePeriod === p && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Hero Financial Overview Card - Mobile Compact */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container p-3.5 shadow-lg border border-outline-variant/20">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-2.5">
          {/* Upper Metrics Block */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Total Spent This Month
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[24px] text-on-surface tracking-tight font-bold">
                  {currencySymbol}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-on-surface-variant">
                  Limit: <strong className="text-on-surface font-semibold">{currencySymbol}{budgetLimit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(true)}
                  title="Edit Monthly Budget Limit"
                  className="inline-flex items-center gap-0.5 px-0 py-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[6px] font-bold border border-primary/20 transition-colors ml-1"
                >
                  <span className="material-symbols-outlined text-[6px]">edit</span>
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Safe to spend Badge */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-container/20 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[13px]">account_balance_wallet</span>
                <span className="text-[11px] font-bold">
                  +{currencySymbol}{remainingBudget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-primary font-medium mt-0.5">
                {percentUsed}% limit used
              </span>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="flex flex-col gap-1 pt-0.5">
            <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_8px_rgba(78,222,163,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-[9px]">
              <span>0%</span>
              <span className="text-on-surface font-semibold">{today} days elapsed</span>
              <span>100%</span>
            </div>
          </div>

          {/* Pace Gauge Callout */}
          <div className="rounded-lg bg-surface-container-low p-2 flex items-center justify-between gap-2 border border-outline-variant/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[14px]">speed</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-on-surface-variant font-medium">Daily Avg</span>
                <span className="text-[11px] font-bold text-on-surface truncate">
                  {currencySymbol}{dailyAverage} / day
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-on-surface-variant font-medium">Safe Target</span>
              <div className="flex items-center gap-1 justify-end">
                <span className="text-[11px] font-bold text-primary">
                  {currencySymbol}{safeDailyPace}
                </span>
                <span className="material-symbols-outlined text-[13px] text-primary">
                  {isPaceHealthy ? 'check_circle' : 'warning'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Interactive Buttons (4 columns, compact) */}
      <section className="grid grid-cols-4 gap-1.5">
        {/* Quick Add Expense */}
        <button
          onClick={() => setActiveTab('add-expense')}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 shadow-sm transition-all active:scale-95 text-center group"
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-0.5 group-hover:bg-primary group-hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface">Log Exp</span>
        </button>

        {/* Set / Edit Budget */}
        <button
          onClick={() => setIsBudgetModalOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 shadow-sm transition-all active:scale-95 text-center group"
        >
          <div className="w-7 h-7 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mb-0.5 group-hover:bg-amber-400 group-hover:text-black transition-colors">
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface">Budget</span>
        </button>

        {/* Scan & Store Receipt to Drive */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 shadow-sm transition-all active:scale-95 text-center group"
        >
          <div className="w-7 h-7 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mb-0.5 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
            <span className="material-symbols-outlined text-[16px]">document_scanner</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface">Receipt</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleQuickReceiptScan}
          accept="image/*,application/pdf"
          className="hidden"
        />

        {/* Sync with Google Sheets */}
        <button
          onClick={triggerSyncNow}
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 shadow-sm transition-all active:scale-95 text-center group"
        >
          <div className={`w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-0.5 ${
            syncStatus === 'syncing' ? 'animate-spin' : 'group-hover:bg-primary group-hover:text-on-primary'
          } transition-colors`}>
            <span className="material-symbols-outlined text-[16px]">sync</span>
          </div>
          <span className="text-[10px] font-semibold text-on-surface">Sync</span>
        </button>
      </section>

      {/* Top Spending Categories - Compact 2x2 grid */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[13px] font-bold text-on-surface">
            Top Categories
          </h2>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
          >
            Insights <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categoryTotals.slice(0, 4).map(cat => (
            <div
              key={cat.id}
              className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/20 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-on-surface truncate">
                    {cat.shortName}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-primary">{cat.percent}%</span>
              </div>

              <div className="mt-2">
                <span className="font-bold text-[12px] text-on-surface block">
                  {currencySymbol}{cat.amount.toFixed(0)}
                </span>
                <div className="w-full h-1 rounded-full bg-surface-container-highest mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (cat.amount / cat.budget) * 100)}%`,
                      backgroundColor: cat.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Transactions List - Compact */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[13px] font-bold text-on-surface">
              Recent Transactions
            </h2>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-medium">
              {expenses.length}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
          >
            See all <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {recentTransactions.map(tx => (
            <div
              key={tx.id}
              className="bg-surface-container hover:bg-surface-container-high transition-colors p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[16px]">
                    {tx.category === 'Food & Dining' ? 'restaurant' :
                     tx.category === 'Groceries' ? 'shopping_cart' :
                     tx.category === 'Transportation' ? 'directions_car' :
                     tx.category === 'Shopping' ? 'shopping_bag' :
                     tx.category === 'Bills & Utilities' ? 'receipt_long' :
                     tx.category === 'Entertainment' ? 'movie' : 'payments'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-[12px] text-on-surface truncate">
                    {tx.merchant}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span className="truncate">{tx.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Receipt Badge if attached */}
                {tx.receiptUrl && (
                  <button
                    onClick={() => setSelectedReceipt(tx)}
                    title="View Receipt stored in Google Drive"
                    className="w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors border border-primary/20"
                  >
                    <span className="material-symbols-outlined text-[13px]">receipt</span>
                  </button>
                )}

                <span className="font-bold text-[12px] text-on-surface tabular-nums">
                  -{currencySymbol}{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
