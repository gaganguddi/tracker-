import React from 'react';
import { AddExpense } from './components/AddExpense';
import { BottomNav } from './components/BottomNav';
import { BudgetModal } from './components/BudgetModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Header } from './components/Header';
import { History } from './components/History';
import { Home } from './components/Home';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';

const AppContent = () => {
  const { activeTab, toastMessage, isBudgetModalOpen, setIsBudgetModalOpen } = useExpense();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body-md antialiased">
      <Header />
      <main className="flex-1 w-full max-w-[420px] mx-auto pt-16 pb-20 px-3">
        {activeTab === 'home' && <Home />}
        {activeTab === 'add-expense' && <AddExpense />}
        {activeTab === 'history' && <History />}
      </main>
      <BottomNav />
      <GoogleSyncModal />
      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} />
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-surface-container-highest/95 border border-primary/40 text-xs font-semibold">
          {toastMessage.message}
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
