import React from 'react';
import { useExpense } from '../context/ExpenseContext';

export const Header = () => {
  const { activeTab, googleConfig, syncStatus, setIsSyncModalOpen, triggerSyncNow } = useExpense();

  const subtitle = {
    home: 'Overview',
    'add-expense': 'Add expense',
    history: 'History'
  }[activeTab] || 'Overview';

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 pt-safe">
      <div className="h-13 py-2 px-3 flex items-center justify-between max-w-[420px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary/20 to-primary-container/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[18px]">currency_rupee</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-on-surface tracking-tight leading-none">Expenses</span>
            <span className="text-[10px] text-primary font-medium leading-tight mt-0.5">{subtitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (googleConfig.sheetId || googleConfig.webAppUrl) triggerSyncNow();
              else setIsSyncModalOpen(true);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 text-[10px]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'syncing'
                ? 'bg-amber-400'
                : googleConfig.isConnected
                  ? 'bg-primary'
                  : 'bg-outline'
            }`} />
            <span className={googleConfig.isConnected ? 'text-primary font-semibold' : 'text-on-surface-variant'}>
              {syncStatus === 'syncing' ? 'Syncing...' : googleConfig.isConnected ? 'Sheets' : 'Connect'}
            </span>
          </button>
          <button
            aria-label="Google Sheet settings"
            onClick={() => setIsSyncModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant/30 text-primary"
          >
            <span className="material-symbols-outlined text-[17px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
