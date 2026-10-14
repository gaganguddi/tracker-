import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { CATEGORIES } from '../data/initialData';

export const BudgetModal = ({ isOpen, onClose }) => {
  const {
    budgetLimit,
    setBudgetLimit,
    categoryTotals,
    currencySymbol,
    showToast
  } = useExpense();

  const [overallBudget, setOverallBudget] = useState(budgetLimit.toString());
  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('spendwise_category_budgets');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults = {};
    CATEGORIES.forEach(c => { defaults[c.name] = c.budget; });
    return defaults;
  });

  if (!isOpen) return null;

  const handleCategoryChange = (catName, value) => {
    const val = parseFloat(value) || 0;
    setCategoryBudgets(prev => ({ ...prev, [catName]: val }));
  };

  const handlePreset = (amount) => {
    setOverallBudget(amount.toString());
  };

  const handleSave = () => {
    const parsed = parseFloat(overallBudget);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid monthly budget limit.");
      return;
    }

    setBudgetLimit(parsed);
    localStorage.setItem('spendwise_budget_limit', parsed.toString());
    localStorage.setItem('spendwise_category_budgets', JSON.stringify(categoryBudgets));

    showToast(`Monthly budget set to ${currencySymbol}${parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[390px] bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface leading-tight">
                Budget Management
              </h3>
              <p className="text-[10px] text-on-surface-variant">
                Set monthly target limits & category envelopes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 no-scrollbar">
          {/* Overall Monthly Budget Section */}
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Overall Monthly Budget Limit (₹ INR)
            </label>

            <div className="flex items-center gap-2 bg-surface-container-high rounded-lg p-2.5 border border-outline-variant/40 focus-within:border-primary">
              <span className="text-xl font-bold text-primary select-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                value={overallBudget}
                onChange={(e) => setOverallBudget(e.target.value)}
                placeholder="50000.00"
                className="w-full bg-transparent text-xl font-bold text-on-surface focus:outline-none tabular-nums"
              />
            </div>

            {/* Quick preset buttons (INR) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[25000, 40000, 50000, 75000, 100000, 150000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePreset(val)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all border ${
                    overallBudget === val.toString()
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border-outline-variant/20'
                  }`}
                >
                  {currencySymbol}{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Category Envelopes Breakdown */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Category Envelopes
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Individual limits
              </span>
            </div>

            <div className="space-y-2.5">
              {CATEGORIES.map(cat => {
                const currentBudget = categoryBudgets[cat.name] !== undefined ? categoryBudgets[cat.name] : cat.budget;
                const catTotal = categoryTotals.find(c => c.name === cat.name)?.amount || 0;
                const percent = currentBudget > 0 ? Math.round((catTotal / currentBudget) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                          style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                        >
                          <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                        </div>
                        <span className="text-xs font-semibold text-on-surface">
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-on-surface-variant font-medium">Limit: {currencySymbol}</span>
                        <input
                          type="number"
                          value={currentBudget}
                          onChange={(e) => handleCategoryChange(cat.name, e.target.value)}
                          className="w-20 bg-surface-container text-xs font-bold text-on-surface px-2 py-1 rounded-lg border border-outline-variant/40 text-right focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                      <span>Spent: {currencySymbol}{catTotal.toFixed(2)}</span>
                      <span className={`font-semibold ${percent > 100 ? 'text-error' : percent > 85 ? 'text-amber-400' : 'text-primary'}`}>
                        {percent}% of category budget
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          backgroundColor: percent > 100 ? '#ffb4ab' : cat.color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-outline-variant/30 flex items-center justify-end gap-2 bg-surface-container-high">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            <span>Apply Budget</span>
          </button>
        </div>
      </div>
    </div>
  );
};
