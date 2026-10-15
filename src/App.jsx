import React, { useEffect, useRef, useState } from 'react';
import { AddExpense } from './components/AddExpense';
import { AppLock } from './components/AppLock';
import { BottomNav } from './components/BottomNav';
import { BudgetModal } from './components/BudgetModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Header } from './components/Header';
import { History } from './components/History';
import { Home } from './components/Home';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';

const AppContent = () => {
  const { activeTab, toastMessage, isBudgetModalOpen, setIsBudgetModalOpen } = useExpense();
  const [isLocked, setIsLocked] = useState(false);
  const lastActivityAt = useRef(0);

  useEffect(() => {
    const lockAfterMs = 30 * 60 * 1000;
    if (!lastActivityAt.current) lastActivityAt.current = Date.now();
    const recordActivity = () => {
      if (!isLocked) lastActivityAt.current = Date.now();
    };
    const checkForInactivity = () => {
      if (!isLocked && Date.now() - lastActivityAt.current >= lockAfterMs) setIsLocked(true);
    };
    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    window.addEventListener('focus', checkForInactivity);
    document.addEventListener('visibilitychange', checkForInactivity);
    const interval = window.setInterval(checkForInactivity, 15000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener('focus', checkForInactivity);
      document.removeEventListener('visibilitychange', checkForInactivity);
      window.clearInterval(interval);
    };
  }, [isLocked]);

  const unlock = () => {
    lastActivityAt.current = Date.now();
    setIsLocked(false);
  };

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
      {isLocked && <AppLock onUnlock={unlock} />}
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
