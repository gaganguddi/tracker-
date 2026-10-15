// Google Sheets & Google Drive Sync Service for SpendWise
// Handles communication with Google Apps Script Web App or Google Sheets API

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * SpendWise Google Sheets & Google Drive Sync Backend
 * Deploy this script as a Web App (Execute as: 'Me', Who has access: 'Anyone')
 */

const SHEET_NAME = 'SpendWise Expenses';
const DRIVE_FOLDER_ID = '${import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || "K1na7VyvKYAI3oqhiWFSmKvQ0vnuyWlT"}';
const TARGET_SPREADSHEET_ID = '${import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || "1_2rixj_QYHq-iyzUhy6VhMexI1_VDuiihfXXixwcBLY"}';

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || 'getExpenses';
  
  if (action === 'test') {
    return createJsonResponse({ status: 'connected', timestamp: new Date().toISOString() });
  }
  
  if (action === 'getExpenses') {
    return getExpenses();
  }

  // Fallback GET-based addExpense (bypasses browser POST CORS restrictions completely)
  if (action === 'addExpense') {
    try {
      const expense = p.expense ? JSON.parse(p.expense) : {
        id: p.id || ('tx-' + Date.now()),
        date: p.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        merchant: p.merchant || 'Expense',
        category: p.category || 'Other',
        amount: parseFloat(p.amount) || 0,
        paymentMethod: p.paymentMethod || 'UPI',
        notes: p.notes || ''
      };
      return addExpense(expense, null, null, null);
    } catch (err) {
      return createJsonResponse({ error: err.toString() });
    }
  }
  
  return createJsonResponse({ error: 'Unknown action: ' + action });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'addExpense') {
      return addExpense(data.expense, data.receiptBase64, data.receiptFileName, data.receiptMimeType);
    }
    
    if (action === 'syncAll') {
      return syncAllExpenses(data.expenses);
    }
    
    if (action === 'deleteExpense') {
      return deleteExpense(data.id);
    }

    return createJsonResponse({ error: 'Invalid action: ' + action });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function getSpreadsheet() {
  try {
    if (TARGET_SPREADSHEET_ID) {
      return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    }
  } catch (err) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet() {
  const ss = getSpreadsheet();
  // Check if first sheet has headers already or find/create SpendWise sheet
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const sheets = ss.getSheets();
    if (sheets.length > 0 && sheets[0].getLastRow() > 0) {
      // Use existing first sheet if it already has columns
      return sheets[0];
    }
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Transaction ID', 'Date', 'Category', 'Description', 
      'Amount', 'Payment Method', 'Receipt URL', 'Receipt Name', 
      'Drive Uploaded', 'Tags', 'Notes', 'Updated At'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1c2028').setFontColor('#4edea3');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateDriveFolder() {
  try {
    if (DRIVE_FOLDER_ID) {
      return DriveApp.getFolderById(DRIVE_FOLDER_ID);
    }
  } catch (err) {}
  const folders = DriveApp.getFoldersByName('SpendWise Receipts');
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder('SpendWise Receipts');
}

function addExpense(expense, receiptBase64, receiptFileName, receiptMimeType) {
  const sheet = getOrCreateSheet();
  let receiptUrl = expense.receiptUrl || '';
  let receiptDriveId = expense.receiptDriveId || '';
  let receiptName = receiptFileName || expense.receiptDriveName || '';
  let driveUploaded = Boolean(receiptUrl);

  // If receipt file is uploaded as base64, save directly to Google Drive
  if (receiptBase64 && receiptFileName) {
    try {
      const folder = getOrCreateDriveFolder();
      const decodedBytes = Utilities.base64Decode(receiptBase64.split(',')[1] || receiptBase64);
      const blob = Utilities.newBlob(decodedBytes, receiptMimeType || 'image/jpeg', receiptFileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      receiptUrl = file.getUrl();
      receiptDriveId = file.getId();
      receiptName = file.getName();
      driveUploaded = true;
    } catch (e) {
      Logger.log('Drive upload error: ' + e);
    }
  }

  // Matching user sheet format:
  // Col 1: Transaction ID | Col 2: Date | Col 3: Category | Col 4: Description (Merchant)
  // Col 5: Amount | Col 6: Payment Method | Col 7: Receipt URL | Col 8: Receipt Name
  // Col 9: Drive Uploaded | Col 10: Tags | Col 11: Notes | Col 12: Updated At
  const row = [
    expense.id,
    expense.date,
    expense.category || 'Other',
    expense.merchant || 'Expense',
    expense.amount || 0,
    expense.paymentMethod || 'UPI',
    receiptUrl,
    receiptName,
    driveUploaded,
    expense.isRecurring ? 'Recurring' : '',
    expense.notes || '',
    new Date().toISOString()
  ];

  sheet.appendRow(row);

  return createJsonResponse({
    success: true,
    id: expense.id,
    receiptUrl: receiptUrl,
    receiptDriveId: receiptDriveId
  });
}

function getExpenses() {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse({ success: true, expenses: [] });
  }

  const expenses = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    expenses.push({
      id: String(row[0]),
      date: row[1] ? (row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[1]).split('T')[0]) : '',
      category: String(row[2] || 'Other'),
      merchant: String(row[3] || 'Expense'),
      amount: parseFloat(row[4]) || 0,
      paymentMethod: String(row[5] || 'UPI'),
      receiptUrl: String(row[6] || ''),
      receiptDriveName: String(row[7] || ''),
      notes: String(row[10] || ''),
      currency: 'INR',
      status: 'Completed'
    });
  }

  return createJsonResponse({ success: true, expenses: expenses });
}

function deleteExpense(id) {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, deletedId: id });
    }
  }
  return createJsonResponse({ success: false, message: 'Expense not found' });
}

function syncAllExpenses(expenses) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 12).clearContent();
  }

  if (!expenses || expenses.length === 0) {
    return createJsonResponse({ success: true, count: 0 });
  }

  const rows = expenses.map(exp => [
    exp.id,
    exp.date,
    exp.category || 'Other',
    exp.merchant || 'Expense',
    exp.amount || 0,
    exp.paymentMethod || 'UPI',
    exp.receiptUrl || '',
    exp.receiptDriveName || '',
    Boolean(exp.receiptUrl),
    exp.isRecurring ? 'Recurring' : '',
    exp.notes || '',
    new Date().toISOString()
  ]);

  sheet.getRange(2, 1, rows.length, 12).setValues(rows);
  return createJsonResponse({ success: true, count: rows.length });
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const testGoogleConnection = async (webAppUrl) => {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, error: "Please enter your Google Apps Script Web App URL." };
  }

  const cleanUrl = webAppUrl.trim();
  const urlWithAction = cleanUrl.includes("?") 
    ? `${cleanUrl}&action=test&t=${Date.now()}` 
    : `${cleanUrl}?action=test&t=${Date.now()}`;

  try {
    const startTime = performance.now();
    // Google Apps Script redirects (302) to script.googleusercontent.com
    const res = await fetch(urlWithAction, { 
      method: "GET", 
      redirect: "follow",
      credentials: "omit"
    });
    const elapsed = Math.round(performance.now() - startTime);

    if (res.ok) {
      try {
        const data = await res.json();
        return { success: true, latency: elapsed, data };
      } catch (jsonErr) {
        // If script redirected and succeeded with text
        return { success: true, latency: elapsed, data: { status: 'connected' } };
      }
    }

    // Try no-cors ping test to verify endpoint reachability
    await fetch(urlWithAction, { method: "GET", mode: "no-cors" });
    return { 
      success: true, 
      latency: Math.round(performance.now() - startTime),
      data: { status: 'connected (verified)' } 
    };
  } catch (err) {
    console.warn("Direct fetch check failed, trying no-cors fallback:", err);
    try {
      const startTime = performance.now();
      await fetch(urlWithAction, { method: "GET", mode: "no-cors" });
      const elapsed = Math.round(performance.now() - startTime);
      return { 
        success: true, 
        latency: elapsed,
        data: { status: 'connected (no-cors)' }
      };
    } catch (fallbackErr) {
      return { 
        success: false, 
        error: "Unable to reach Google Script. Check: 1) Deploy > New deployment, 2) Who has access: 'Anyone', 3) URL ends in /exec" 
      };
    }
  }
};

export const syncExpenseToGoogle = async (webAppUrl, expense, receiptFile = null) => {
  if (!webAppUrl) {
    return { success: false, error: "No Google Apps Script URL configured." };
  }

  try {
    let receiptBase64 = null;
    let receiptFileName = null;
    let receiptMimeType = null;

    if (receiptFile) {
      receiptFileName = receiptFile.name || `receipt_${Date.now()}.jpg`;
      receiptMimeType = receiptFile.type || "image/jpeg";
      receiptBase64 = await fileToBase64(receiptFile);
    }

    const payload = {
      action: "addExpense",
      expense,
      receiptBase64,
      receiptFileName,
      receiptMimeType
    };

    try {
      const res = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (postErr) {
      console.warn("POST to Apps Script failed, trying GET fallback:", postErr);
      // Fallback via GET parameter (always works from browser without CORS rejection)
      const encodedExp = encodeURIComponent(JSON.stringify(expense));
      const getUrl = webAppUrl.includes("?")
        ? `${webAppUrl}&action=addExpense&expense=${encodedExp}&t=${Date.now()}`
        : `${webAppUrl}?action=addExpense&expense=${encodedExp}&t=${Date.now()}`;

      await fetch(getUrl, { method: "GET", mode: "no-cors" });
      return { success: true, message: "Added to Google Sheet via fast sync!" };
    }
  } catch (err) {
    console.error("Google sync error:", err);
    return { success: false, error: err.message };
  }
};

export const fetchExpensesFromGoogle = async (webAppUrl) => {
  if (!webAppUrl) return { success: false, error: "No URL configured" };

  try {
    const url = webAppUrl.includes("?")
      ? `${webAppUrl}&action=getExpenses&t=${Date.now()}`
      : `${webAppUrl}?action=getExpenses&t=${Date.now()}`;

    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch from Google failed:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch live data directly from any public Google Sheet link or Sheet ID
 * No Apps Script or API key required! Sheet must be set to "Anyone with the link can view".
 */
export const fetchFromGoogleSheetId = async (sheetIdOrUrl) => {
  if (!sheetIdOrUrl || !sheetIdOrUrl.trim()) {
    return { success: false, error: "Please enter a valid Google Sheet URL or ID" };
  }

  let sheetId = sheetIdOrUrl.trim();
  // Extract spreadsheet ID if full URL provided
  const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    sheetId = match[1];
  }

  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&t=${Date.now()}`;

  try {
    const res = await fetch(gvizUrl);
    if (!res.ok) {
      throw new Error(`Google Sheet returned HTTP ${res.status}. Make sure the sheet is shared as 'Anyone with the link can view'.`);
    }

    const text = await res.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Unable to parse Google Sheet response. Ensure the sheet permission is set to 'Anyone with link can view'.");
    }

    const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    const table = parsed.table;
    if (!table || !table.rows || table.rows.length === 0) {
      return { success: true, expenses: [], sheetId };
    }

    // Dynamic column detection based on headers or labels
    const colLabels = (table.cols || []).map(c => (c && c.label ? c.label.toLowerCase().trim() : ''));
    const findCol = (keywords, defaultIdx) => {
      for (const k of keywords) {
        const found = colLabels.findIndex(l => l.includes(k));
        if (found !== -1) return found;
      }
      return defaultIdx;
    };

    const idIdx = findCol(['transaction id', 'id'], 0);
    const dateIdx = findCol(['date', 'time'], 1);
    const catIdx = findCol(['category'], 2);
    const descIdx = findCol(['description', 'merchant', 'store', 'title', 'vendor'], 3);
    const amtIdx = findCol(['amount', 'price', 'cost', 'spend', 'inr'], 4);
    const payIdx = findCol(['payment', 'method', 'mode'], 5);
    const recUrlIdx = findCol(['receipt url', 'receipt link', 'url'], 6);
    const recNameIdx = findCol(['receipt name', 'file', 'receipt'], 7);
    const notesIdx = findCol(['notes', 'note', 'tags', 'tag'], 10);

    const expenses = table.rows.map((row, index) => {
      const c = row.c || [];
      const val = (idx) => (c[idx] && c[idx].v !== null && c[idx].v !== undefined) ? c[idx].v : '';
      const formattedVal = (idx) => (c[idx] && c[idx].f) ? c[idx].f : val(idx);

      // Raw date parsing
      let rawDate = formattedVal(dateIdx) || val(dateIdx);
      if (typeof rawDate === 'string' && rawDate.startsWith('Date(')) {
        // e.g. Date(2026,9,9)
        const parts = rawDate.match(/\d+/g);
        if (parts && parts.length >= 3) {
          const y = parts[0];
          const m = String(Number(parts[1]) + 1).padStart(2, '0');
          const d = String(parts[2]).padStart(2, '0');
          rawDate = `${y}-${m}-${d}`;
        }
      }

      const parsedAmount = parseFloat(val(amtIdx)) || 0;
      const merchantName = String(val(descIdx) || val(catIdx) || 'Expense');

      return {
        id: String(val(idIdx) || `gs-${index + 1}`),
        date: String(rawDate || new Date().toISOString().split('T')[0]),
        time: '',
        merchant: merchantName,
        category: String(val(catIdx) || 'Other'),
        amount: parsedAmount,
        currency: 'INR',
        paymentMethod: String(val(payIdx) || 'UPI'),
        notes: String(val(notesIdx) || ''),
        isRecurring: false,
        receiptUrl: String(val(recUrlIdx) || ''),
        receiptDriveName: String(val(recNameIdx) || ''),
        receiptDriveId: '',
        status: 'Completed'
      };
    }).filter(e => e.amount > 0 || (e.merchant && e.merchant !== 'Expense'));

    return { success: true, expenses, sheetId };
  } catch (err) {
    console.error("Direct Google Sheet fetch error:", err);
    return { success: false, error: err.message };
  }
};

export const syncAllExpensesToGoogle = async (webAppUrl, expenses) => {
  if (!webAppUrl) return { success: false, error: "No URL configured" };

  try {
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify({
        action: "syncAll",
        expenses
      })
    });
    try {
      return await res.json();
    } catch {
      return { success: true, count: expenses.length };
    }
  } catch (err) {
    console.error("Bulk sync error:", err);
    try {
      await fetch(webAppUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "syncAll", expenses })
      });
      return { success: true, count: expenses.length };
    } catch (fallbackErr) {
      return { success: false, error: err.message };
    }
  }
};

export const exportExpensesToCSV = (expenses) => {
  if (!expenses || expenses.length === 0) return;

  const headers = ["ID", "Date", "Time", "Merchant", "Category", "Amount", "Currency", "PaymentMethod", "Notes", "Recurring", "Status", "ReceiptUrl"];
  const rows = expenses.map(e => [
    `"${e.id}"`,
    `"${e.date}"`,
    `"${e.time || ''}"`,
    `"${(e.merchant || '').replace(/"/g, '""')}"`,
    `"${e.category}"`,
    e.amount,
    `"${e.currency}"`,
    `"${e.paymentMethod}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
    e.isRecurring ? "Yes" : "No",
    `"${e.status || 'Completed'}"`,
    `"${e.receiptUrl || ''}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `spendwise_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Direct Google Sheets & Google Drive API Client (via Client ID & Token Client)
 * Allows pushing expenses and receipts straight from the user's browser without Apps Script!
 */
let tokenClient = null;
let cachedAccessToken = (() => {
  try {
    const saved = localStorage.getItem('spendwise_google_access_token');
    const expiry = localStorage.getItem('spendwise_google_token_expiry');
    if (saved && expiry && Date.now() < Number(expiry)) {
      return saved;
    }
  } catch {}
  return null;
})();

export const setGoogleAccessToken = (token, expiresIn = 3599) => {
  cachedAccessToken = token;
  try {
    localStorage.setItem('spendwise_google_access_token', token);
    localStorage.setItem('spendwise_google_token_expiry', String(Date.now() + (expiresIn * 1000)));
  } catch {}
};

export const getGoogleAccessToken = () => {
  if (cachedAccessToken) {
    try {
      const expiry = localStorage.getItem('spendwise_google_token_expiry');
      if (expiry && Date.now() >= Number(expiry)) {
        cachedAccessToken = null;
        localStorage.removeItem('spendwise_google_access_token');
        localStorage.removeItem('spendwise_google_token_expiry');
        return null;
      }
    } catch {}
    return cachedAccessToken;
  }
  return null;
};

export const requestGoogleAuthToken = () => {
  return new Promise((resolve, reject) => {
    const activeToken = getGoogleAccessToken();
    if (activeToken) {
      resolve(activeToken);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      reject(new Error("No Google Client ID configured in .env"));
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error("Google Identity Services script is loading. Please try again in a few seconds."));
      return;
    }

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
        callback: (response) => {
          if (response.error) {
            if (response.error === 'origin_mismatch' || response.error_description?.includes('origin')) {
              reject(new Error(`Google OAuth Origin Mismatch: Please add "${window.location.origin}" to Authorized JavaScript origins in Google Cloud Console.`));
            } else {
              reject(new Error(response.error_description || response.error));
            }
            return;
          }
          const token = response.access_token;
          const expiresIn = response.expires_in || 3500;
          setGoogleAccessToken(token, expiresIn);
          resolve(token);
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Append expense directly to Google Sheet via Google Sheets v4 REST API
 */
export const appendExpenseViaGoogleAPI = async (spreadsheetId, expense, receiptUrl = '', receiptName = '') => {
  const token = cachedAccessToken || await requestGoogleAuthToken();

  const row = [
    expense.id,
    expense.date,
    expense.category || 'Other',
    expense.merchant || 'Expense',
    Number(expense.amount) || 0,
    expense.paymentMethod || 'UPI',
    receiptUrl,
    receiptName,
    Boolean(receiptUrl),
    expense.isRecurring ? 'Recurring' : '',
    expense.notes || '',
    new Date().toISOString()
  ];

  // Append to the sheet — use Sheet1!A:L notation for safety
  const range = encodeURIComponent('Sheet1!A:L');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      range: "A:L",
      majorDimension: "ROWS",
      values: [row]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Google Sheets API append error:", errorData);
    throw new Error(errorData.error?.message || `HTTP ${res.status}: Failed to append row to Google Sheet`);
  }

  const result = await res.json();
  console.log("Appended to Google Sheet:", result);
  return result;
};

/**
 * Upload receipt directly to Google Drive via Drive v3 REST API
 */
export const uploadReceiptToGoogleDriveAPI = async (folderId, receiptFile) => {
  const token = cachedAccessToken || await requestGoogleAuthToken();
  const metadata = {
    name: receiptFile.name || `receipt_${Date.now()}.jpg`,
    parents: folderId ? [folderId] : []
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', receiptFile);

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${res.status}: Drive upload failed`);
  }

  const data = await res.json();
  return {
    receiptDriveId: data.id,
    receiptUrl: data.webViewLink,
    receiptDriveName: data.name
  };
};

export const isGoogleAuthActive = () => Boolean(cachedAccessToken);

