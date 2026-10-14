import React from 'react';
import { useExpense } from '../context/ExpenseContext';

export const ReceiptModal = () => {
  const { selectedReceipt, setSelectedReceipt, currencySymbol } = useExpense();

  if (!selectedReceipt) return null;

  const downloadReceipt = () => {
    if (!selectedReceipt.receiptUrl) return;
    const link = document.createElement('a');
    link.href = selectedReceipt.receiptUrl;
    link.download = selectedReceipt.receiptDriveName || `Receipt_${selectedReceipt.merchant}_${selectedReceipt.date}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-on-surface leading-tight">
                {selectedReceipt.merchant} Receipt
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {selectedReceipt.date} • {currencySymbol}{Number(selectedReceipt.amount).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Receipt Image / Document Display */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-surface-container-lowest min-h-[280px]">
          {selectedReceipt.receiptUrl ? (
            <img
              src={selectedReceipt.receiptUrl}
              alt="Receipt preview"
              className="max-w-full max-h-[50vh] rounded-xl object-contain shadow-md border border-outline-variant/30"
            />
          ) : (
            <div className="flex flex-col items-center text-on-surface-variant p-6 text-center">
              <span className="material-symbols-outlined text-4xl mb-2">description</span>
              <span className="text-sm font-semibold text-on-surface">No image attached</span>
              <span className="text-xs mt-1">Receipt reference is recorded without an image file.</span>
            </div>
          )}
        </div>

        {/* Details & Drive Actions Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-high flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Payment: <strong className="text-on-surface">{selectedReceipt.paymentMethod}</strong></span>
            <span>Category: <strong className="text-on-surface">{selectedReceipt.category}</strong></span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {selectedReceipt.receiptDriveId ? (
              <a
                href={selectedReceipt.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Open in Google Drive</span>
              </a>
            ) : (
              <button
                onClick={downloadReceipt}
                className="flex-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download File</span>
              </button>
            )}

            <button
              onClick={() => setSelectedReceipt(null)}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-highest text-on-surface-variant text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
