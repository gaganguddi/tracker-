import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { INITIAL_EXPENSES, CATEGORIES } from '../data/initialData';
import {
  syncExpenseToGoogle,
  syncAllExpensesToGoogle,
  fetchExpensesFromGoogle,
  fetchFromGoogleSheetId,
  testGoogleConnection
} from '../services/googleSyncService';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  // Load expenses from localStorage or initial fallback
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const activeCurrency = 'INR';
  const setActiveCurrency = () => {}; // locked to INR
  const [activePeriod, setActivePeriod] = useState('October 2024');

  // Budget Limit state with localStorage persistence (default ₹50,000)
  const [budgetLimit, setBudgetLimit] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_budget_limit');
      return saved ? parseFloat(saved) : 50000.00;
    } catch {
      return 50000.00;
    }
  });

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Google Sheets & Drive Settings
  const [googleConfig, setGoogleConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_google_config');
      return saved ? JSON.parse(saved) : {
        webAppUrl: '',
        sheetId: '',
        driveFolderName: 'SpendWise Receipts',
        autoSync: true,
        isConnected: false,
        lastSyncTime: null
      };
    } catch {
      return {
        webAppUrl: '',
        sheetId: '',
        driveFolderName: 'SpendWise Receipts',
        autoSync: true,
        isConnected: false,
        lastSyncTime: null
      };
    }
  });

  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Persist expenses
  useEffect(() => {
    try {
      localStorage.setItem('spendwise_expenses', JSON.stringify(expenses));
    } catch (err) {
      console.error("Storage error:", err);
    }
  }, [expenses]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem('spendwise_google_config', JSON.stringify(googleConfig));
    } catch (err) {
      console.error("Config storage error:", err);
    }
  }, [googleConfig]);

  // Auto-fetch real data from Google Sheet if configured on load
  useEffect(() => {
    if (googleConfig.webAppUrl) {
      pullFromGoogle();
    } else if (googleConfig.sheetId) {
      pullFromDirectSheetId(googleConfig.sheetId);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Indian Rupee currency only
  const currencySymbol = '₹';

  // Financial aggregates
  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => {
    return Math.max(0, budgetLimit - totalSpent);
  }, [budgetLimit, totalSpent]);

  const percentUsed = useMemo(() => {
    if (budgetLimit <= 0) return 0;
    return Math.min(100, Math.round((totalSpent / budgetLimit) * 100));
  }, [totalSpent, budgetLimit]);

  const categoryTotals = useMemo(() => {
    const map = {};
    CATEGORIES.forEach(c => {
      map[c.name] = 0;
    });

    expenses.forEach(e => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + Number(e.amount);
    });

    return CATEGORIES.map(c => {
      const amount = map[c.name] || 0;
      const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
      return {
        ...c,
        amount,
        percent: pct
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  // Add Expense
  const addExpense = async (newExpenseData, receiptFile = null) => {
    let receiptUrl = newExpenseData.receiptUrl || null;
    let receiptDriveId = null;
    let receiptDriveName = null;

    // Create local object
    const newExpense = {
      ...newExpenseData,
      id: `tx-${Date.now()}`,
      currency: activeCurrency,
      date: newExpenseData.date || new Date().toISOString().split('T')[0],
      time: newExpenseData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Completed',
      receiptUrl,
      receiptDriveId,
      receiptDriveName
    };

    if (receiptFile && !receiptUrl) {
      try {
        newExpense.receiptUrl = URL.createObjectURL(receiptFile);
        newExpense.receiptDriveName = receiptFile.name;
      } catch (e) {
        console.warn("Could not create local blob URL:", e);
      }
    }

    setExpenses(prev => [newExpense, ...prev]);
    showToast(`Logged ${currencySymbol}${Number(newExpense.amount).toFixed(2)} at ${newExpense.merchant}!`);

    // If Google Apps Script is connected, sync asynchronously
    if (googleConfig.webAppUrl && googleConfig.autoSync) {
      setSyncStatus('syncing');
      try {
        const result = await syncExpenseToGoogle(googleConfig.webAppUrl, newExpense, receiptFile);
        if (result && result.success) {
          if (result.receiptUrl) {
            setExpenses(prev => prev.map(e => e.id === newExpense.id ? { 
              ...e, 
              receiptUrl: result.receiptUrl, 
              receiptDriveId: result.receiptDriveId 
            } : e));
          }
          setSyncStatus('synced');
          setGoogleConfig(prev => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString(), isConnected: true }));
          showToast(`Saved to Google Sheets & Receipt uploaded to Drive!`, 'info');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error("Auto sync failed:", err);
        setSyncStatus('error');
      }
    }
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast('Transaction removed', 'info');
  };

  const triggerSyncNow = async () => {
    if (!googleConfig.webAppUrl && !googleConfig.sheetId) {
      setIsSyncModalOpen(true);
      return;
    }

    if (googleConfig.webAppUrl) {
      setSyncStatus('syncing');
      showToast('Syncing with Google Sheets & Drive...', 'info');

      try {
        const result = await syncAllExpensesToGoogle(googleConfig.webAppUrl, expenses);
        if (result && result.success) {
          setSyncStatus('synced');
          setGoogleConfig(prev => ({ ...prev, isConnected: true, lastSyncTime: new Date().toLocaleTimeString() }));
          showToast(`Successfully synced ${expenses.length} records to Google Sheet!`);
        } else {
          setSyncStatus('error');
          showToast('Google sync error. Check your Web App URL permissions.', 'error');
        }
      } catch (err) {
        setSyncStatus('error');
        showToast('Network error syncing with Google.', 'error');
      }
    } else if (googleConfig.sheetId) {
      pullFromDirectSheetId(googleConfig.sheetId);
    }
  };

  const pullFromGoogle = async () => {
    if (!googleConfig.webAppUrl) return;
    setSyncStatus('syncing');
    try {
      const result = await fetchExpensesFromGoogle(googleConfig.webAppUrl);
      if (result && result.success && Array.isArray(result.expenses) && result.expenses.length > 0) {
        setExpenses(result.expenses);
        setSyncStatus('synced');
        setGoogleConfig(prev => ({ ...prev, isConnected: true, lastSyncTime: new Date().toLocaleTimeString() }));
        showToast(`Imported ${result.expenses.length} real expenses from Google Sheet!`);
      } else {
        showToast('Google Sheet is currently empty or has no transactions yet.', 'info');
        setSyncStatus('idle');
      }
    } catch (err) {
      setSyncStatus('error');
      showToast('Failed to pull from Google Sheet.', 'error');
    }
  };

  const pullFromDirectSheetId = async (sheetIdOrUrl) => {
    setSyncStatus('syncing');
    showToast('Fetching real data from Google Sheet...', 'info');
    try {
      const result = await fetchFromGoogleSheetId(sheetIdOrUrl);
      if (result && result.success) {
        if (result.expenses && result.expenses.length > 0) {
          setExpenses(result.expenses);
          setSyncStatus('synced');
          setGoogleConfig(prev => ({
            ...prev,
            sheetId: result.sheetId,
            isConnected: true,
            lastSyncTime: new Date().toLocaleTimeString()
          }));
          showToast(`Loaded ${result.expenses.length} real transactions from Google Sheet!`);
        } else {
          showToast('Connected to Google Sheet! No transactions found in sheet yet.', 'info');
          setSyncStatus('synced');
          setGoogleConfig(prev => ({
            ...prev,
            sheetId: result.sheetId,
            isConnected: true,
            lastSyncTime: new Date().toLocaleTimeString()
          }));
        }
      } else {
        setSyncStatus('error');
        showToast(result.error || 'Failed to fetch from Google Sheet', 'error');
      }
    } catch (err) {
      setSyncStatus('error');
      showToast('Error connecting to Google Sheet: ' + err.message, 'error');
    }
  };

  // Option to reset/clear sample data and start fresh
  const clearSampleData = () => {
    if (window.confirm("Are you sure you want to clear the sample transactions and start with an empty list for your real Google Sheet data?")) {
      setExpenses([]);
      showToast("Cleared sample data. Ready for your real Google Sheet transactions!", "info");
    }
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      setExpenses,
      activeTab,
      setActiveTab,
      activeCurrency,
      setActiveCurrency,
      currencySymbol,
      activePeriod,
      setActivePeriod,
      budgetLimit,
      setBudgetLimit,
      totalSpent,
      remainingBudget,
      percentUsed,
      categoryTotals,
      selectedReceipt,
      setSelectedReceipt,
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
      triggerSyncNow,
      pullFromGoogle,
      pullFromDirectSheetId,
      clearSampleData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error("useExpense must be used within ExpenseProvider");
  return context;
};
