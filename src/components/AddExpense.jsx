import React, { useState, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { CATEGORIES, PAYMENT_METHODS } from '../data/initialData';

export const AddExpense = () => {
  const {
    activeCurrency,
    setActiveCurrency,
    currencySymbol,
    addExpense,
    setActiveTab,
    googleConfig
  } = useExpense();

  const [currentAmount, setCurrentAmount] = useState('450.00');
  const [selectedCategory, setSelectedCategory] = useState('Food & Dining');
  const [merchant, setMerchant] = useState('Swiggy');
  const [paymentMethod, setPaymentMethod] = useState('UPI (GPay/PhonePe)');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Keypad actions
  const handleKeypadPress = (key) => {
    if (key === 'backspace') {
      if (currentAmount.length <= 1) {
        setCurrentAmount('0');
      } else {
        setCurrentAmount(prev => prev.slice(0, -1));
      }
    } else if (key === '.') {
      if (!currentAmount.includes('.')) {
        setCurrentAmount(prev => prev + '.');
      }
    } else {
      if (currentAmount === '0') {
        setCurrentAmount(key);
      } else {
        const parts = currentAmount.split('.');
        if (parts[1] && parts[1].length >= 2) return;
        if (currentAmount.length < 9) {
          setCurrentAmount(prev => prev + key);
        }
      }
    }
  };

  // Preset additions
  const handlePreset = (val) => {
    const num = parseFloat(currentAmount) || 0;
    setCurrentAmount((num + val).toFixed(2));
  };

  const handleRoundUp = () => {
    const num = parseFloat(currentAmount) || 0;
    let nextWhole = Math.ceil(num);
    if (nextWhole === num) nextWhole += 1;
    setCurrentAmount(nextWhole.toFixed(2));
  };

  // Receipt handling
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    if (receiptPreviewUrl) {
      URL.revokeObjectURL(receiptPreviewUrl);
      setReceiptPreviewUrl(null);
    }
  };

  // Submit expense
  const handleSave = () => {
    const amountVal = parseFloat(currentAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSaving(true);

    const expenseRecord = {
      amount: amountVal,
      merchant: merchant.trim() || 'General Expense',
      category: selectedCategory,
      paymentMethod,
      notes: notes.trim(),
      date,
      isRecurring
    };

    addExpense(expenseRecord, receiptFile);

    setTimeout(() => {
      setIsSaving(false);
      setActiveTab('dashboard');
    }, 400);
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Modal Custom Header Bar */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          aria-label="Cancel"
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-colors shadow-sm border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-semibold">
            Fast Log
          </span>
          <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">
            New Expense
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Save"
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:brightness-110"
        >
          <span className="material-symbols-outlined text-[20px] fill-1">check</span>
        </button>
      </div>

      {/* Focal Point: Amount Display (INR Rupee Only) */}
      <section className="flex flex-col items-center justify-center bg-surface-container rounded-xl p-3 shadow-sm mb-3 relative overflow-hidden border border-outline-variant/30">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* INR Badge */}
        <div className="inline-flex items-center bg-surface-container-low px-2 py-0.5 rounded-full text-[10px] font-bold text-primary mb-1 border border-primary/20">
          Indian Rupee (₹)
        </div>

        {/* Numeric hero display */}
        <div className="flex items-baseline justify-center gap-1 my-0.5">
          <span className="text-[24px] text-primary font-bold select-none">
            {currencySymbol}
          </span>
          <div className="flex items-center">
            <span className="text-[30px] text-on-surface tabular-nums tracking-tight font-bold">
              {currentAmount}
            </span>
            <span className="inline-block w-[2.5px] h-7 ml-1 bg-primary rounded-full animate-pulse select-none"></span>
          </div>
        </div>

        {/* Quick Preset Increment Chips (INR) */}
        <div className="flex items-center justify-center gap-1.5 mt-2 w-full overflow-x-auto no-scrollbar py-0.5">
          {[50, 100, 500, 1000].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handlePreset(val)}
              className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[10px] hover:bg-surface-bright active:scale-95 transition-all shadow-sm border border-outline-variant/20 shrink-0 font-semibold"
            >
              + {currencySymbol}{val}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRoundUp}
            className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary text-[10px] hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center gap-0.5 font-bold"
          >
            <span className="material-symbols-outlined text-[12px]">arrow_circle_up</span>
            Round
          </button>
        </div>
      </section>

      {/* Category Selection Grid (2x4) - Compact */}
      <section className="flex flex-col mb-3">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] text-on-surface-variant font-medium">Select Category</span>
          <span className="text-[10px] text-primary font-semibold">Suggested</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 shadow-sm border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high border-outline-variant/20'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] mb-0.5 ${isSelected ? 'fill-1 text-on-primary' : 'text-on-surface-variant'}`}>
                  {cat.icon}
                </span>
                <span className="text-[10px] truncate max-w-full">
                  {cat.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Details Form: Merchant, Notes, Date, Payment - Compact */}
      <section className="flex flex-col gap-2.5 bg-surface-container rounded-xl p-3 shadow-sm border border-outline-variant/20 mb-3">
        {/* Merchant Name */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Merchant / Store
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">
              storefront
            </span>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy, Blinkit, D-Mart"
              className="w-full bg-surface-container-high text-on-surface text-xs rounded-lg pl-8 pr-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
          </div>
        </div>

        {/* Payment Method Pills */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Payment Method
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.label)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 transition-all ${
                  paymentMethod === pm.label
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">{pm.icon}</span>
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date & Recurring Row */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-surface-container-high text-on-surface text-[11px] rounded-lg px-2.5 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Monthly Recurring
            </label>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-medium ${
                isRecurring
                  ? 'bg-secondary/10 border-secondary text-secondary font-semibold'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
              }`}
            >
              <span>Subscription</span>
              <span className={`w-7 h-3.5 rounded-full flex items-center p-0.5 transition-colors ${
                isRecurring ? 'bg-secondary justify-end' : 'bg-surface-container-highest justify-start'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add quick note or tag..."
            className="w-full bg-surface-container-high text-on-surface text-[11px] rounded-lg px-2.5 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      {/* Google Drive Receipt Storage Section - Compact */}
      <section className="bg-surface-container rounded-xl p-3 shadow-sm border border-outline-variant/20 mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[17px]">cloud_upload</span>
            <span className="text-[11px] font-bold text-on-surface">
              Drive Receipt
            </span>
          </div>
          <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
            SpendWise Receipts
          </span>
        </div>

        {receiptPreviewUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-primary/40 bg-surface-container-highest p-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={receiptPreviewUrl}
                alt="Receipt preview"
                className="w-10 h-10 object-cover rounded-md border border-outline-variant/40"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-on-surface truncate">
                  {receiptFile?.name || 'Attached Receipt'}
                </span>
                <span className="text-[9px] text-primary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">check_circle</span>
                  Ready for Drive
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={removeReceipt}
              className="w-6 h-6 rounded-full bg-error/10 text-error hover:bg-error/20 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border border-dashed border-outline-variant/40 hover:border-primary/60 rounded-lg p-2.5 flex flex-col items-center justify-center text-center transition-colors bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[20px] text-primary mb-0.5">
              add_a_photo
            </span>
            <span className="text-[11px] font-semibold text-on-surface">
              Tap to capture receipt photo
            </span>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleReceiptChange}
          accept="image/*,application/pdf"
          className="hidden"
        />
      </section>

      {/* Numeric Keypad Grid - Mobile Compact */}
      <section className="grid grid-cols-3 gap-1.5 mb-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
          <button
            key={key}
            type="button"
            onClick={() => handleKeypadPress(key)}
            className={`keypad-btn py-2.5 rounded-lg text-base font-semibold active:bg-primary active:text-on-primary transition-all select-none shadow-sm border border-outline-variant/20 flex items-center justify-center ${
              key === 'backspace'
                ? 'bg-surface-container text-error active:bg-error/20'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {key === 'backspace' ? (
              <span className="material-symbols-outlined text-[20px]">backspace</span>
            ) : (
              key
            )}
          </button>
        ))}
      </section>

      {/* Bottom Main CTA Save Button - Compact */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
      >
        {isSaving ? (
          <>
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span>Saving & Syncing...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px] fill-1">check</span>
            <span>Save Expense ({currencySymbol}{currentAmount})</span>
          </>
        )}
      </button>
    </div>
  );
};
