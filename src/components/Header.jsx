import React from 'react';
import { useExpense } from '../context/ExpenseContext';

export const Header = ({ onLock }) => {
  const { activeTab, googleConfig, syncStatus, setIsSyncModalOpen, triggerSyncNow } = useExpense();

  const getSubTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'transactions': return 'Transactions';
      case 'add-expense': return 'Fast Log';
      case 'analytics': return 'Analytics';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-md border-b border-outline-variant/20 pt-safe">
      {/* Main Header Bar - Compact Mobile Size */}
      <div className="h-13 py-2 px-3 flex items-center justify-between max-w-[420px] mx-auto">
        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary/20 to-primary-container/20 border border-primary/30 flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">currency_rupee</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-on-surface tracking-tight leading-none">
              SpendWise
            </span>
            <span className="text-[10px] text-primary font-medium leading-tight mt-0.5">
              {getSubTitle()}
            </span>
          </div>
        </div>

        {/* Action Controls & Sync Status */}
        <div className="flex items-center gap-1.5">
          {/* Live Google Sheets indicator pill */}
          <button
            onClick={() => {
              if (googleConfig.webAppUrl) {
                triggerSyncNow();
              } else {
                setIsSyncModalOpen(true);
              }
            }}
            title={googleConfig.webAppUrl ? "Click to sync with Google Sheets & Drive now" : "Click to connect Google Sheets & Drive"}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 hover:bg-surface-container-highest transition-all text-[10px]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'syncing' 
                ? 'bg-amber-400 animate-spin' 
                : googleConfig.isConnected 
                  ? 'bg-primary shadow-[0_0_6px_rgba(78,222,163,0.8)]' 
                  : 'bg-outline'
            }`}></span>
            <span className="font-medium text-on-surface-variant flex items-center gap-0.5">
              {syncStatus === 'syncing' ? (
                <span>Syncing...</span>
              ) : googleConfig.isConnected ? (
                <span className="text-primary font-semibold">Sheets Live</span>
              ) : (
                <span>Connect</span>
              )}
            </span>
          </button>

          {/* Lock Vault button */}
          {onLock && (
            <button
              onClick={onLock}
              title="Lock SpendWise Vault"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors border border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </button>
          )}

          {/* Cloud Settings / Profile Button */}
          <button
            aria-label="Google Cloud Settings"
            onClick={() => setIsSyncModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-highest transition-colors border border-outline-variant/30 text-primary"
          >
            <span className="material-symbols-outlined text-[17px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
