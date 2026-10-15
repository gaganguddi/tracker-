import React from 'react';
import { useExpense } from '../context/ExpenseContext';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useExpense();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-2xl border-t border-outline-variant/30">
      <div className="relative flex items-center justify-around h-13 px-2 max-w-[420px] mx-auto">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center min-w-[70px] h-11 gap-0.5 ${
            activeTab === 'home' ? 'text-primary font-semibold' : 'text-on-surface-variant'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'home' ? 'fill-1' : ''}`}>home</span>
          <span className="text-[9px]">Home</span>
        </button>

        <div className="relative -top-3.5 flex flex-col items-center">
          <button
            aria-label="Add Expense"
            onClick={() => setActiveTab('add-expense')}
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-secondary text-on-primary flex items-center justify-center shadow-[0_0_18px_rgba(78,222,163,0.45)] ${
              activeTab === 'add-expense' ? 'ring-3 ring-primary/30 scale-105' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
          <span className="text-[9px] text-on-surface-variant mt-0.5">Add</span>
        </div>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center min-w-[70px] h-11 gap-0.5 ${
            activeTab === 'history' ? 'text-primary font-semibold' : 'text-on-surface-variant'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] ${activeTab === 'history' ? 'fill-1' : ''}`}>history</span>
          <span className="text-[9px]">History</span>
        </button>
      </div>
    </nav>
  );
};
