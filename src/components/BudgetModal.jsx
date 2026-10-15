import React, { useEffect, useState } from 'react';
import { formatMoney } from '../data/categories';
import { useExpense } from '../context/ExpenseContext';

export const BudgetModal = ({ isOpen, onClose }) => {
  const { budgetLimit, saveBudget, monthSpent } = useExpense();
  const [value, setValue] = useState(budgetLimit ? String(budgetLimit) : '');

  useEffect(() => {
    if (isOpen) setValue(budgetLimit ? String(budgetLimit) : '');
  }, [isOpen, budgetLimit]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    await saveBudget(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80">
      <div className="w-full max-w-[390px] bg-surface-container rounded-2xl border border-outline-variant/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-on-surface">Monthly budget</h3>
          <button onClick={onClose} className="text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant mb-2">
          Spent this month: {formatMoney(monthSpent)}
        </p>
        <div className="flex items-center gap-2 bg-surface-container-high rounded-lg p-2.5 border border-outline-variant/40 mb-3">
          <span className="text-xl font-bold text-primary">₹</span>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="20000"
            className="w-full bg-transparent text-xl font-bold text-on-surface focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-on-surface-variant">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
