import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  formatMoney,
  isInRange,
  normalizeCategory,
  startOfMonth,
  startOfWeek
} from '../data/categories';
import {
  deleteExpenseFromGoogle,
  fetchBudgetFromGoogle,
  fetchExpensesFromGoogle,
  fetchFromGoogleSheetId,
  DEFAULT_GOOGLE_WEB_APP_URL,
  setBudgetOnGoogle,
  syncExpenseToGoogle
} from '../services/googleSyncService';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const envSpreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || '';
  const envWebAppUrl = import.meta.env.VITE_GOOGLE_WEB_APP_URL || DEFAULT_GOOGLE_WEB_APP_URL;

  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  const [googleConfig, setGoogleConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('expense_google_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const webAppUrl = parsed.webAppUrl || envWebAppUrl;
        const sheetId = parsed.sheetId || envSpreadsheetId;
        return {
          webAppUrl,
          sheetId,
          isConnected: Boolean(webAppUrl),
          lastSyncTime: parsed.lastSyncTime || null
        };
      }
    } catch { /* ignore */ }
    return {
      webAppUrl: envWebAppUrl,
      sheetId: envSpreadsheetId,
      isConnected: Boolean(envWebAppUrl),
      lastSyncTime: null
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('expense_google_config', JSON.stringify(googleConfig));
    } catch { /* ignore */ }
  }, [googleConfig]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 3200);
  };

  const markSynced = () => {
    setSyncStatus('synced');
    setGoogleConfig((prev) => ({
      ...prev,
      isConnected: Boolean(prev.webAppUrl),
      lastSyncTime: new Date().toLocaleTimeString()
    }));
  };

  const pullFromDirectSheetId = async (sheetIdOrUrl) => {
    setSyncStatus('syncing');
    try {
      const result = await fetchFromGoogleSheetId(sheetIdOrUrl);
      if (result?.success) {
        setExpenses((result.expenses || []).map((e) => ({ ...e, category: normalizeCategory(e.category) })));
        if (typeof result.budget === 'number') setBudgetLimit(result.budget);
        setGoogleConfig((prev) => ({ ...prev, sheetId: result.sheetId, lastSyncTime: new Date().toLocaleTimeString() }));
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch {
      setSyncStatus('error');
    }
  };

  const pullFromGoogle = async () => {
    if (!googleConfig.webAppUrl) return;
    setSyncStatus('syncing');
    try {
      const result = await fetchExpensesFromGoogle(googleConfig.webAppUrl);
      if (result?.success && Array.isArray(result.expenses)) {
        setExpenses(result.expenses.map((e) => ({ ...e, category: normalizeCategory(e.category) })));
        markSynced();
        showToast(result.expenses.length ? `Loaded ${result.expenses.length} expenses` : 'Sheet connected. No expenses yet.');
      } else {
        setSyncStatus('idle');
        showToast('Could not read the sheet yet.', 'info');
      }
      const budgetResult = await fetchBudgetFromGoogle(googleConfig.webAppUrl);
      if (budgetResult?.success && typeof budgetResult.amount === 'number') {
        setBudgetLimit(budgetResult.amount);
      }
    } catch {
      setSyncStatus('error');
      showToast('Failed to load from Google Sheet.', 'error');
    }
  };

  useEffect(() => {
    if (googleConfig.webAppUrl) {
      pullFromGoogle();
    } else if (googleConfig.sheetId) {
      pullFromDirectSheetId(googleConfig.sheetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthSpent = useMemo(
    () => expenses.filter((e) => isInRange(e.date, startOfMonth())).reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const weekSpent = useMemo(
    () => expenses.filter((e) => isInRange(e.date, startOfWeek())).reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const remainingBudget = budgetLimit - monthSpent;
  const percentUsed = budgetLimit > 0 ? Math.min(100, Math.round((monthSpent / budgetLimit) * 100)) : 0;

  const categoryTotals = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => { map[c.name] = 0; });
    expenses.forEach((e) => {
      const cat = normalizeCategory(e.category);
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return CATEGORIES.map((c) => {
      const amount = map[c.name] || 0;
      return {
        ...c,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const addExpense = async (newExpenseData) => {
    if (!googleConfig.webAppUrl) {
      setIsSyncModalOpen(true);
      showToast('Connect your sheet once with the script URL. No Google sign-in.', 'error');
      return false;
    }

    const newExpense = {
      id: `tx-${Date.now()}`,
      merchant: newExpenseData.merchant || '',
      category: normalizeCategory(newExpenseData.category),
      amount: Number(newExpenseData.amount) || 0,
      date: newExpenseData.date || new Date().toISOString().split('T')[0],
      notes: newExpenseData.notes || ''
    };

    setSyncStatus('syncing');
    const result = await syncExpenseToGoogle(googleConfig.webAppUrl, newExpense);
    if (result?.success) {
      setExpenses((prev) => [newExpense, ...prev]);
      markSynced();
      showToast(`Saved ${formatMoney(newExpense.amount)} to Google Sheet`);
      return true;
    }
    setSyncStatus('error');
    showToast(result?.error || 'Could not save to Google Sheet', 'error');
    return false;
  };

  const saveBudget = async (amount) => {
    const parsed = Number(amount) || 0;
    setBudgetLimit(parsed);
    if (!googleConfig.webAppUrl) {
      setIsSyncModalOpen(true);
      showToast('Connect the sheet to save budget there. No Google sign-in.', 'info');
      return;
    }
    try {
      await setBudgetOnGoogle(googleConfig.webAppUrl, parsed);
      showToast(`Monthly budget set to ${formatMoney(parsed)}`);
    } catch (err) {
      showToast(err.message || 'Could not save budget to Google Sheet', 'error');
    }
  };

  const deleteExpense = async (id) => {
    if (!googleConfig.webAppUrl) {
      showToast('Connect your Apps Script before deleting an expense.', 'error');
      return false;
    }

    setSyncStatus('syncing');
    const result = await deleteExpenseFromGoogle(googleConfig.webAppUrl, id);
    if (result?.success) {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      markSynced();
      showToast('Expense deleted from Google Sheet.');
      return true;
    }
    setSyncStatus('error');
    showToast(result?.error || 'Could not delete the expense from Google Sheet.', 'error');
    return false;
  };

  const triggerSyncNow = async () => {
    if (googleConfig.webAppUrl) {
      await pullFromGoogle();
    } else {
      setIsSyncModalOpen(true);
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        activeTab,
        setActiveTab,
        budgetLimit,
        remainingBudget,
        percentUsed,
        monthSpent,
        weekSpent,
        categoryTotals,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isBudgetModalOpen,
        setIsBudgetModalOpen,
        googleConfig,
        setGoogleConfig,
        syncStatus,
        toastMessage,
        showToast,
        addExpense,
        deleteExpense,
        saveBudget,
        triggerSyncNow,
        pullFromGoogle,
        pullFromDirectSheetId
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpense must be used within ExpenseProvider');
  return context;
};
