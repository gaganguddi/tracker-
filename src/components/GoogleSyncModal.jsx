import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, testGoogleConnection, exportExpensesToCSV, requestGoogleAuthToken, appendExpenseViaGoogleAPI } from '../services/googleSyncService';

export const GoogleSyncModal = ({ onLockVault }) => {
  const {
    isSyncModalOpen,
    setIsSyncModalOpen,
    googleConfig,
    setGoogleConfig,
    syncStatus,
    triggerSyncNow,
    pullFromGoogle,
    pullFromDirectSheetId,
    clearSampleData,
    setIsBudgetModalOpen,
    expenses,
    showToast
  } = useExpense();

  const [connectionMethod, setConnectionMethod] = useState(googleConfig.sheetId ? 'sheetId' : 'appsScript');
  const [urlInput, setUrlInput] = useState(googleConfig.webAppUrl || '');
  const [sheetInput, setSheetInput] = useState(googleConfig.sheetId || '');
  const [folderName, setFolderName] = useState(googleConfig.driveFolderName || 'SpendWise Receipts');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  if (!isSyncModalOpen) return null;

  // Test Apps Script connection
  const handleTestAppsScript = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testGoogleConnection(urlInput);
    setIsTesting(false);
    setTestResult(result);
    if (result.success) {
      setGoogleConfig(prev => ({
        ...prev,
        webAppUrl: urlInput.trim(),
        driveFolderName: folderName,
        isConnected: true
      }));
      showToast('Connected to Google Sheets & Drive Web App!');
    }
  };

  // Connect via Direct Sheet Link/ID
  const handleConnectSheetId = async () => {
    if (!sheetInput.trim()) {
      alert("Please paste your Google Sheet link or Sheet ID");
      return;
    }
    await pullFromDirectSheetId(sheetInput);
  };

  const handleSave = () => {
    setGoogleConfig(prev => ({
      ...prev,
      webAppUrl: urlInput.trim(),
      sheetId: sheetInput.trim(),
      driveFolderName: folderName,
      isConnected: Boolean(urlInput.trim() || sheetInput.trim())
    }));
    showToast('Google sync settings saved');
    setIsSyncModalOpen(false);
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    showToast('Google Apps Script copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[390px] bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-high">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-on-surface leading-tight">
                Google Sheets & Drive Data Sync
              </h3>
              <p className="text-[10px] text-on-surface-variant">
                Fetch real transactions & store receipt files
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 no-scrollbar">
          {/* Status Alert Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            googleConfig.isConnected
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${googleConfig.isConnected ? 'bg-primary shadow-[0_0_8px_rgba(78,222,163,0.8)]' : 'bg-amber-400'}`}></span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">
                  {googleConfig.isConnected ? 'Google Sheet Connected (Real Data Active)' : 'Local Offline / Sample Mode'}
                </span>
                <span className="text-[10px]">
                  {googleConfig.lastSyncTime ? `Last synced: ${googleConfig.lastSyncTime}` : 'Connect your Google Sheet below to fetch real transactions'}
                </span>
              </div>
            </div>

            {googleConfig.isConnected && (
              <button
                onClick={triggerSyncNow}
                disabled={syncStatus === 'syncing'}
                className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <span className={`material-symbols-outlined text-[14px] ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>sync</span>
                <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Fetch Live'}</span>
              </button>
            )}
          </div>

          {/* Direct Google Cloud Push Authorization Banner */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="bg-surface-container-high p-3 rounded-2xl border border-primary/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Direct Google Account Push</span>
                    <span className="text-[10px] text-on-surface-variant">Push straight to your sheet via Google OAuth</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = await requestGoogleAuthToken();
                        showToast("Google Account connected! Testing push...", "info");
                        // Push a quick test expense directly to sheet
                        const testExp = {
                          id: `tx-${Date.now()}`,
                          date: new Date().toISOString().split('T')[0],
                          category: 'Other',
                          merchant: 'SpendWise Test Sync',
                          amount: 10,
                          paymentMethod: 'UPI',
                          notes: 'Verified direct Google Cloud push'
                        };
                        await appendExpenseViaGoogleAPI(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, testExp);
                        showToast("Success! Test row added to your Google Sheet!");
                      } catch (err) {
                        showToast(err.message || "Failed to push row to Google Sheet", "error");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                    <span>Sign In & Test Push</span>
                  </button>
                </div>
              </div>

              {/* Authorized Origin Help */}
              <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-on-surface-variant shrink-0 font-medium">Your App Origin:</span>
                  <span className="font-mono text-primary truncate select-all">{window.location.origin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    showToast("Origin URL copied: " + window.location.origin);
                  }}
                  className="text-primary hover:underline font-semibold shrink-0 ml-1.5"
                >
                  Copy Origin
                </button>
              </div>
            </div>
          )}

          {/* Connection Mode Tabs */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setConnectionMethod('sheetId')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                connectionMethod === 'sheetId'
                  ? 'bg-surface-container-high text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Option 1: Google Sheet Link / ID
            </button>
            <button
              type="button"
              onClick={() => setConnectionMethod('appsScript')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                connectionMethod === 'appsScript'
                  ? 'bg-surface-container-high text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Option 2: Apps Script Web App
            </button>
          </div>

          {/* METHOD 1: Direct Google Sheet Link / ID */}
          {connectionMethod === 'sheetId' && (
            <div className="space-y-2.5 bg-surface-container-high/60 p-4 rounded-2xl border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  Google Sheet Link or Spreadsheet ID
                </span>
                <span className="text-[10px] text-primary font-medium">Fastest Real Data Setup</span>
              </div>

              {/* Env Sheet ID Quick Connect Button */}
              {import.meta.env.VITE_GOOGLE_SPREADSHEET_ID && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0">check_circle</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-on-surface truncate">Configured in .env</span>
                      <span className="text-[9px] text-primary font-mono truncate">{import.meta.env.VITE_GOOGLE_SPREADSHEET_ID}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetInput(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID);
                      pullFromDirectSheetId(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold shrink-0 shadow-sm hover:brightness-110 active:scale-95 transition-all"
                  >
                    Sync Now
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit or Sheet ID"
                  className="flex-1 bg-surface-container text-on-surface text-xs rounded-xl px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleConnectSheetId}
                  disabled={syncStatus === 'syncing' || !sheetInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:brightness-110 transition-all shrink-0 disabled:opacity-40"
                >
                  {syncStatus === 'syncing' ? 'Fetching...' : 'Fetch Live'}
                </button>
              </div>

              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Requirement:</strong> In your Google Sheet, ensure <strong className="text-on-surface">Share &gt; Anyone with link can view</strong> is set so SpendWise can pull your rows directly!
              </p>
            </div>
          )}

          {/* METHOD 2: Apps Script Web App for Bidirectional Sync & Drive Receipts */}
          {connectionMethod === 'appsScript' && (
            <div className="space-y-3 bg-surface-container-high/60 p-4 rounded-2xl border border-outline-variant/30">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Google Apps Script Web App URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-surface-container text-on-surface text-xs rounded-xl px-3 py-2.5 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleTestAppsScript}
                    disabled={isTesting || !urlInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-primary text-xs font-semibold border border-outline-variant/30 transition-colors shrink-0 disabled:opacity-40"
                  >
                    {isTesting ? 'Testing...' : 'Test'}
                  </button>
                </div>

                {testResult && (
                  <p className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${testResult.success ? 'text-primary' : 'text-error'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {testResult.success ? 'check_circle' : 'error'}
                    </span>
                    <span>{testResult.success ? `Connected! Server responded in ${testResult.latency}ms.` : testResult.error}</span>
                  </p>
                )}
              </div>

              {/* Google Drive Folder Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Google Drive Receipts Folder Name</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">Auto-created in your Drive</span>
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="SpendWise Receipts"
                  className="w-full bg-surface-container text-on-surface text-xs rounded-xl px-3 py-2 border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* 1-Minute Setup Guide Box */}
              <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">1-Minute Apps Script Setup</span>
                  <button
                    type="button"
                    onClick={copyScriptCode}
                    className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">{copiedCode ? 'check' : 'content_copy'}</span>
                    <span>{copiedCode ? 'Copied Script!' : 'Copy Script'}</span>
                  </button>
                </div>

                <ol className="text-[11px] text-on-surface-variant space-y-1 list-decimal list-inside">
                  <li>In Google Sheets: <strong className="text-on-surface">Extensions &gt; Apps Script</strong>.</li>
                  <li>Paste script code, click <strong className="text-on-surface">Deploy &gt; New deployment</strong>.</li>
                  <li>Select <strong className="text-on-surface">Web app</strong>, Who has access: <strong className="text-on-surface">Anyone</strong>, and copy URL.</li>
                </ol>

                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="text-[10px] text-primary hover:underline font-medium block pt-0.5"
                >
                  {showCodePreview ? 'Hide script code' : 'View Google Apps Script source code'}
                </button>

                {showCodePreview && (
                  <pre className="text-[10px] bg-surface-container-lowest p-2 rounded-lg text-on-surface overflow-x-auto max-h-36 border border-outline-variant/30 font-mono">
                    {GOOGLE_APPS_SCRIPT_TEMPLATE}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Quick Management Actions: Budget & Sample Data */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider pl-1">
              Data Management & Budgets
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Add / Edit Budget Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setIsBudgetModalOpen(true);
                }}
                className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-amber-400/30 text-xs font-semibold text-on-surface flex items-center gap-2 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <div>
                  <div className="font-bold">Set Monthly Budget</div>
                  <div className="text-[10px] text-on-surface-variant">Configure limit & categories</div>
                </div>
              </button>

              {/* Clear Sample Data to start fresh */}
              <button
                type="button"
                onClick={clearSampleData}
                className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-error/30 text-xs font-semibold text-on-surface flex items-center gap-2 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                </div>
                <div>
                  <div className="font-bold text-error">Clear Sample Data</div>
                  <div className="text-[10px] text-on-surface-variant">Empty list for real sheet</div>
                </div>
              </button>
            </div>

            {/* CSV Backup Export */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => exportExpensesToCSV(expenses)}
                className="flex-1 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                <span>Download CSV Backup</span>
              </button>

              {onLockVault && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    onLockVault();
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-xs font-semibold text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Lock Vault</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-outline-variant/30 flex items-center justify-end gap-2 bg-surface-container-high">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
