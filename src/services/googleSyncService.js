// Google Sheets & Google Drive Sync Service for SpendWise
// Handles communication with Google Apps Script Web App or Google Sheets API

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * SpendWise Google Sheets & Google Drive Sync Backend
 * Deploy this script as a Web App (Execute as: 'Me', Who has access: 'Anyone')
 */

const SHEET_NAME = 'SpendWise Expenses';
const DRIVE_FOLDER_NAME = 'SpendWise Receipts';

function doGet(e) {
  const action = e.parameter.action || 'getExpenses';
  
  if (action === 'test') {
    return createJsonResponse({ status: 'connected', timestamp: new Date().toISOString() });
  }
  
  if (action === 'getExpenses') {
    return getExpenses();
  }
  
  return createJsonResponse({ error: 'Unknown action' });
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

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'ID', 'Date', 'Time', 'Merchant', 'Category', 'Amount', 
      'Currency', 'PaymentMethod', 'Notes', 'Recurring', 
      'ReceiptUrl', 'ReceiptDriveId', 'Status', 'CreatedAt'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1c2028').setFontColor('#4edea3');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateDriveFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function addExpense(expense, receiptBase64, receiptFileName, receiptMimeType) {
  const sheet = getOrCreateSheet();
  let receiptUrl = expense.receiptUrl || '';
  let receiptDriveId = expense.receiptDriveId || '';

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
    } catch (e) {
      Logger.log('Drive upload error: ' + e);
    }
  }

  const row = [
    expense.id,
    expense.date,
    expense.time || '',
    expense.merchant,
    expense.category,
    expense.amount,
    expense.currency || 'USD',
    expense.paymentMethod || 'Credit Card',
    expense.notes || '',
    expense.isRecurring ? 'Yes' : 'No',
    receiptUrl,
    receiptDriveId,
    expense.status || 'Completed',
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
      date: row[1] ? String(row[1]).split('T')[0] : '',
      time: String(row[2] || ''),
      merchant: String(row[3] || ''),
      category: String(row[4] || 'Other'),
      amount: parseFloat(row[5]) || 0,
      currency: String(row[6] || 'USD'),
      paymentMethod: String(row[7] || 'Credit Card'),
      notes: String(row[8] || ''),
      isRecurring: String(row[9]).toLowerCase() === 'yes',
      receiptUrl: String(row[10] || ''),
      receiptDriveId: String(row[11] || ''),
      status: String(row[12] || 'Completed')
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
  // Clear existing data rows except headers
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 14).clearContent();
  }

  if (!expenses || expenses.length === 0) {
    return createJsonResponse({ success: true, count: 0 });
  }

  const rows = expenses.map(exp => [
    exp.id,
    exp.date,
    exp.time || '',
    exp.merchant,
    exp.category,
    exp.amount,
    exp.currency || 'USD',
    exp.paymentMethod || 'Credit Card',
    exp.notes || '',
    exp.isRecurring ? 'Yes' : 'No',
    exp.receiptUrl || '',
    exp.receiptDriveId || '',
    exp.status || 'Completed',
    new Date().toISOString()
  ]);

  sheet.getRange(2, 1, rows.length, 14).setValues(rows);
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
    const res = await fetch(urlWithAction, { method: "GET", mode: "cors" });
    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return { success: true, latency: elapsed, data };
  } catch (err) {
    // If CORS blocks reading the body on Apps Script redirect, sometimes no-cors works or it's a redirect
    console.warn("Direct test failed, attempting fetch check:", err);
    return { 
      success: false, 
      error: "Unable to reach Google Script. Ensure it is deployed as 'Web app' with access set to 'Anyone'." 
    };
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

    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
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

    const expenses = table.rows.map((row, index) => {
      const c = row.c || [];
      const val = (idx) => (c[idx] && c[idx].v !== null && c[idx].v !== undefined) ? c[idx].v : '';
      const formattedVal = (idx) => (c[idx] && c[idx].f) ? c[idx].f : val(idx);

      return {
        id: String(val(0) || `gs-${index + 1}`),
        date: String(formattedVal(1) || val(1) || new Date().toISOString().split('T')[0]),
        time: String(val(2) || ''),
        merchant: String(val(3) || 'Expense Item'),
        category: String(val(4) || 'Other'),
        amount: parseFloat(val(5)) || 0,
        currency: String(val(6) || 'USD'),
        paymentMethod: String(val(7) || 'Credit Card'),
        notes: String(val(8) || ''),
        isRecurring: String(val(9)).toLowerCase() === 'yes' || String(val(9)).toLowerCase() === 'true',
        receiptUrl: String(val(10) || ''),
        receiptDriveId: String(val(11) || ''),
        status: String(val(12) || 'Completed')
      };
    }).filter(e => e.amount > 0 || (e.merchant && e.merchant !== 'Expense Item'));

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
      body: JSON.stringify({
        action: "syncAll",
        expenses
      })
    });
    return await res.json();
  } catch (err) {
    console.error("Bulk sync error:", err);
    return { success: false, error: err.message };
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
