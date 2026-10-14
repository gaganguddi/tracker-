import React from 'react';
import { useExpense } from '../context/ExpenseContext';

export const BottomNav = () => {
  const { activeTab, setActiveTab, setIsSyncModalOpen } = useExpense();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="relative flex items-center justify-around h-13 px-2 max-w-[420px] mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[50px] h-11 transition-all gap-0.5 ${
            activeTab === 'dashboard' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'dashboard' ? 'fill-1' : ''}`}>
            grid_view
          </span>
          <span className="text-[9px] tracking-tight">Home</span>
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center min-w-[50px] h-11 transition-all gap-0.5 ${
            activeTab === 'analytics' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'analytics' ? 'fill-1' : ''}`}>
            bar_chart
          </span>
          <span className="text-[9px] tracking-tight">Analytics</span>
        </button>

        {/* Elevated Center Add Button */}
        <div className="relative -top-3.5 flex flex-col items-center">
          <button
            aria-label="Add Expense"
            onClick={() => setActiveTab('add-expense')}
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-secondary text-on-primary flex items-center justify-center shadow-[0_0_18px_rgba(78,222,163,0.45)] hover:shadow-[0_0_24px_rgba(78,222,163,0.7)] hover:scale-105 active:scale-95 transition-all ${
              activeTab === 'add-expense' ? 'ring-3 ring-primary/30 scale-105' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[24px] font-bold">add</span>
          </button>
          <span className="text-[9px] text-on-surface-variant font-medium mt-0.5">Add</span>
        </div>

        {/* Transactions / History Tab */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center min-w-[50px] h-11 transition-all gap-0.5 ${
            activeTab === 'transactions' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'transactions' ? 'fill-1' : ''}`}>
            receipt_long
          </span>
          <span className="text-[9px] tracking-tight">History</span>
        </button>

        {/* Google Sync / Settings Tab */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] h-11 text-on-surface-variant hover:text-on-surface transition-all gap-0.5"
        >
          <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
          <span className="text-[9px] tracking-tight">Sheets</span>
        </button>
      </div>
    </nav>
  );
};
