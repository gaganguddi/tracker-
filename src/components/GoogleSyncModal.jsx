import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, testGoogleConnection } from '../services/googleSyncService';

export const GoogleSyncModal = () => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    googleConfig,
    setGoogleConfig,
    syncStatus,
    triggerSyncNow,
    showToast
  } = useExpense();

  const [urlInput, setUrlInput] = useState(googleConfig.webAppUrl || '');
  const [copied, setCopied] = useState(false);

  if (!isSyncModalOpen) return null;

  const handleConnect = async () => {
    if (!urlInput.trim()) {
      showToast('Paste the Apps Script Web App URL first.', 'error');
      return;
    }
    const result = await testGoogleConnection(urlInput);
    if (result.success) {
      const expectedSheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      if (expectedSheetId && result.spreadsheetId !== expectedSheetId) {
        showToast('This deployment points to a different spreadsheet. Copy the updated script, redeploy it, then connect again.', 'error');
        return;
      }
      setGoogleConfig((prev) => ({
        ...prev,
        webAppUrl: urlInput.trim(),
        isConnected: true
      }));
      showToast('Connected. You can save expenses with no Google sign-in.');
      setIsSyncModalOpen(false);
    } else {
      showToast(result.error || 'Could not connect', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80">
      <div className="relative w-full max-w-[390px] bg-surface-container rounded-2xl border border-outline-variant/40 max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-on-surface">Connect Google Sheet</h3>
            <p className="text-[10px] text-on-surface-variant">No Google sign-in. One script URL is enough.</p>
          </div>
          <button onClick={() => setIsSyncModalOpen(false)} className="text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar text-xs text-on-surface-variant">
          <div className={`p-3 rounded-xl border ${googleConfig.webAppUrl ? 'border-primary/30 bg-primary/10 text-on-surface' : 'border-outline-variant/30'}`}>
            {googleConfig.webAppUrl ? 'Ready to save to your sheet' : 'Not connected yet'}
            {googleConfig.webAppUrl && (
              <button onClick={triggerSyncNow} className="ml-2 text-primary font-semibold">
                {syncStatus === 'syncing' ? 'Loading...' : 'Reload'}
              </button>
            )}
          </div>

          <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
            <li>Open your Google Sheet → Extensions → Apps Script</li>
            <li>Tap Copy script below, paste it, then click Deploy → New deployment</li>
            <li>Type: Web app. Execute as: Me. Who has access: Anyone</li>
            <li>Paste the deployment URL ending in <code>/exec</code> here — not the Google Sheet URL</li>
          </ol>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
              setCopied(true);
              showToast('Script copied. Paste it in Apps Script.');
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full rounded-xl border border-outline-variant/40 py-2 text-on-surface"
          >
            {copied ? 'Copied' : 'Copy script'}
          </button>

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full bg-surface-container-high text-on-surface text-xs rounded-xl px-3 py-2 border border-outline-variant/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleConnect}
            className="w-full rounded-xl bg-primary text-on-primary text-xs font-bold py-2.5"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};
