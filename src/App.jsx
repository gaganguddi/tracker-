import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { AddExpense } from './components/AddExpense';
import { Analytics } from './components/Analytics';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SecurityLock } from './components/SecurityLock';
import { BudgetModal } from './components/BudgetModal';

const AppContent = () => {
  const { activeTab, toastMessage, isBudgetModalOpen, setIsBudgetModalOpen } = useExpense();
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('spendwise_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const handleUnlock = () => {
    sessionStorage.setItem('spendwise_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('spendwise_unlocked');
    setIsUnlocked(false);
  };

  if (!isUnlocked) {
    return <SecurityLock onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body-md selection:bg-primary selection:text-on-primary antialiased">
      {/* Fixed Header */}
      <Header onLock={handleLock} />

      {/* Main Content Area - Mobile-first compact shell */}
      <main className="flex-1 w-full max-w-[420px] mx-auto pt-16 pb-20 px-3">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'add-expense' && <AddExpense />}
        {activeTab === 'analytics' && <Analytics />}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav />

      {/* Modals & Dialogs */}
      <GoogleSyncModal onLockVault={handleLock} />
      <ReceiptModal />
      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto px-4 py-2.5 rounded-full bg-surface-container-highest/95 backdrop-blur-md border border-primary/40 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className={`material-symbols-outlined text-[18px] ${
            toastMessage.type === 'error' ? 'text-error' :
            toastMessage.type === 'info' ? 'text-secondary' : 'text-primary'
          }`}>
            {toastMessage.type === 'error' ? 'error' :
             toastMessage.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span className="text-xs font-semibold text-on-surface">
            {toastMessage.message}
          </span>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}

export default App;
