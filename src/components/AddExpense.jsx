import React, { useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { useExpense } from '../context/ExpenseContext';

export const AddExpense = () => {
  const { addExpense, setActiveTab, syncStatus } = useExpense();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    const ok = await addExpense({
      amount: value,
      category,
      merchant: note.trim() || category,
      notes: note.trim(),
      date
    });
    setSaving(false);
    if (ok) {
      setAmount('');
      setNote('');
      setActiveTab('history');
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 pt-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Amount (₹)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-3 text-2xl font-bold text-on-surface focus:outline-none focus:border-primary"
          required
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Category</span>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.name)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border text-sm ${
                category === cat.name
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-outline-variant/30 bg-surface-container text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Note</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you buy?"
          className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={saving || syncStatus === 'syncing'}
        className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-bold py-3 disabled:opacity-50"
      >
        {saving ? 'Saving to Google Sheet...' : 'Save expense'}
      </button>
    </form>
  );
};
