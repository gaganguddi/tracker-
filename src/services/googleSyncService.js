export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Expense Tracker â€” Google Sheets backend
 * Deploy as Web App: Execute as Me, Who has access: Anyone
 */

const EXPENSE_SHEET = 'Expenses';
const BUDGET_SHEET = 'Budget';
const TARGET_SPREADSHEET_ID = '${import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || ''}';

function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || 'getExpenses';

  if (action === 'test') {
    return json({ success: true, status: 'connected', spreadsheetId: getSpreadsheet().getId(), timestamp: new Date().toISOString() });
  }
  if (action === 'getExpenses') return getExpenses();
  if (action === 'getBudget') return getBudget();
  if (action === 'setBudget') {
    return setBudget(parseFloat(p.amount) || 0);
  }
  if (action === 'deleteExpense') return deleteExpense(p.id);
  if (action === 'addExpense') {
    try {
      const expense = p.expense ? JSON.parse(p.expense) : {
        id: p.id || ('tx-' + Date.now()),
        date: p.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        category: p.category || 'Others',
        merchant: p.merchant || p.description || '',
        amount: parseFloat(p.amount) || 0,
        notes: p.notes || ''
      };
      return addExpense(expense);
    } catch (err) {
      return json({ success: false, error: err.toString() });
    }
  }
  return json({ error: 'Unknown action: ' + action });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'addExpense') return addExpense(data.expense);
    if (data.action === 'setBudget') return setBudget(data.amount);
    if (data.action === 'deleteExpense') return deleteExpense(data.id);
    return json({ error: 'Invalid action' });
  } catch (err) {
    return json({ error: err.toString() });
  }
}

function getSpreadsheet() {
  try {
    if (TARGET_SPREADSHEET_ID) return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  } catch (err) {}
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getExpenseSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(EXPENSE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EXPENSE_SHEET);
    sheet.appendRow(['ID', 'Date', 'Category', 'Description', 'Amount', 'Notes', 'Updated At']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getBudgetSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(BUDGET_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(BUDGET_SHEET);
    sheet.appendRow(['Key', 'Value']);
    sheet.appendRow(['monthlyBudget', 0]);
  }
  return sheet;
}

function addExpense(expense) {
  const sheet = getExpenseSheet();
  sheet.appendRow([
    expense.id,
    expense.date,
    expense.category || 'Others',
    expense.merchant || expense.description || '',
    expense.amount || 0,
    expense.notes || '',
    new Date().toISOString()
  ]);
  return json({ success: true, id: expense.id });
}

function getExpenses() {
  const sheet = getExpenseSheet();
  const values = sheet.getDataRange().getValues();
  const expenses = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[4]) continue;
    expenses.push({
      id: String(row[0] || ('tx-' + i)),
      date: row[1] instanceof Date
        ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : String(row[1] || '').split('T')[0],
      category: String(row[2] || 'Others'),
      merchant: String(row[3] || ''),
      amount: parseFloat(row[4]) || 0,
      notes: String(row[5] || '')
    });
  }
  return json({ success: true, expenses: expenses });
}

function deleteExpense(id) {
  const sheet = getExpenseSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return json({ success: true, deletedId: id });
    }
  }
  return json({ success: false, message: 'Not found' });
}

function getBudget() {
  const sheet = getBudgetSheet();
  const values = sheet.getDataRange().getValues();
  let amount = 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === 'monthlyBudget') {
      amount = parseFloat(values[i][1]) || 0;
    }
  }
  return json({ success: true, amount: amount });
}

function setBudget(amount) {
  const sheet = getBudgetSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === 'monthlyBudget') {
      sheet.getRange(i + 1, 2).setValue(Number(amount) || 0);
      return json({ success: true, amount: Number(amount) || 0 });
    }
  }
  sheet.appendRow(['monthlyBudget', Number(amount) || 0]);
  return json({ success: true, amount: Number(amount) || 0 });
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

function isAppsScriptWebAppUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.hostname === 'script.google.com'
      && /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

function normalizeWebAppUrl(value) {
  return String(value || '').trim().replace(/\/dev\/?(?=\?|$)/, '/exec');
}

function urlForAction(webAppUrl, action, params = {}) {
  const url = new URL(normalizeWebAppUrl(webAppUrl));
  url.searchParams.set('action', action);
  url.searchParams.set('t', String(Date.now()));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function readJsonResponse(res) {
  const body = await res.text();
  if (!res.ok) throw new Error(`Apps Script returned HTTP ${res.status}.`);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Apps Script did not return JSON. Use the deployed /exec URL and allow access for Anyone.');
  }
}

function extractSheetId(sheetIdOrUrl) {
  const raw = String(sheetIdOrUrl || '').trim();
  const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : raw;
}

function parseGvizDate(rawDate) {
  if (typeof rawDate === 'string' && rawDate.startsWith('Date(')) {
    const parts = rawDate.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const y = parts[0];
      const m = String(Number(parts[1]) + 1).padStart(2, '0');
      const d = String(parts[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return String(rawDate || '').split('T')[0];
}

async function fetchGviz(sheetId, sheetName) {
  const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json${sheetParam}&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheet returned HTTP ${res.status}. Share it as Anyone with the link can view.`);
  }
  const text = await res.text();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not read the Google Sheet. Check sharing permissions.');
  }
  return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
}

function mapExpenseRows(table) {
  if (!table || !table.rows || table.rows.length === 0) return [];

  const colLabels = (table.cols || []).map((c) => (c && c.label ? c.label.toLowerCase().trim() : ''));
  const findCol = (keywords, fallback) => {
    for (const k of keywords) {
      const found = colLabels.findIndex((l) => l.includes(k));
      if (found !== -1) return found;
    }
    return fallback;
  };

  const idIdx = findCol(['id'], 0);
  const dateIdx = findCol(['date'], 1);
  const catIdx = findCol(['category'], 2);
  const descIdx = findCol(['description', 'merchant', 'note title'], 3);
  const amtIdx = findCol(['amount', 'price', 'cost', 'spend'], 4);
  const notesIdx = findCol(['notes', 'note'], 5);

  return table.rows.map((row, index) => {
    const c = row.c || [];
    const val = (idx) => (c[idx] && c[idx].v !== null && c[idx].v !== undefined ? c[idx].v : '');
    const formattedVal = (idx) => (c[idx] && c[idx].f ? c[idx].f : val(idx));
    return {
      id: String(val(idIdx) || `gs-${index + 1}`),
      date: parseGvizDate(formattedVal(dateIdx) || val(dateIdx)),
      category: String(val(catIdx) || 'Others'),
      merchant: String(val(descIdx) || ''),
      amount: parseFloat(val(amtIdx)) || 0,
      notes: String(val(notesIdx) || '')
    };
  }).filter((e) => e.amount > 0 || e.merchant);
}

export const testGoogleConnection = async (webAppUrl) => {
  if (!isAppsScriptWebAppUrl(webAppUrl)) {
    return { success: false, error: 'Use the Apps Script deployment URL ending in /exec — not the Google Sheet link.' };
  }
  try {
    const res = await fetch(urlForAction(webAppUrl, 'test'), { method: 'GET', redirect: 'follow', credentials: 'omit' });
    const result = await readJsonResponse(res);
    return result?.success
      ? { success: true, spreadsheetId: result.spreadsheetId }
      : { success: false, error: result?.error || 'The script test failed.' };
  } catch (err) {
    return { success: false, error: err.message || 'Cannot reach the script. Deploy as Anyone and use the /exec URL.' };
  }
};

export const syncExpenseToGoogle = async (webAppUrl, expense) => {
  if (!isAppsScriptWebAppUrl(webAppUrl)) return { success: false, error: 'The configured URL is not an Apps Script /exec deployment URL.' };
  const payload = { action: 'addExpense', expense };
  try {
    const res = await fetch(normalizeWebAppUrl(webAppUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify(payload)
    });
    return await readJsonResponse(res);
  } catch (postError) {
    try {
      const res = await fetch(urlForAction(webAppUrl, 'addExpense', { expense: JSON.stringify(expense) }), { method: 'GET', redirect: 'follow', credentials: 'omit' });
      return await readJsonResponse(res);
    } catch (getError) {
      return { success: false, error: getError.message || postError.message || 'Could not save to Apps Script.' };
    }
  }
};

export const deleteExpenseFromGoogle = async (webAppUrl, id) => {
  if (!isAppsScriptWebAppUrl(webAppUrl)) {
    return { success: false, error: 'The configured URL is not an Apps Script /exec deployment URL.' };
  }
  try {
    const res = await fetch(normalizeWebAppUrl(webAppUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action: 'deleteExpense', id })
    });
    return await readJsonResponse(res);
  } catch (postError) {
    try {
      const res = await fetch(urlForAction(webAppUrl, 'deleteExpense', { id: String(id) }), { method: 'GET', redirect: 'follow', credentials: 'omit' });
      return await readJsonResponse(res);
    } catch (getError) {
      return { success: false, error: getError.message || postError.message || 'Could not delete the expense.' };
    }
  }
};

export const fetchExpensesFromGoogle = async (webAppUrl) => {
  if (!webAppUrl) return { success: false, error: 'No URL configured' };
  const res = await fetch(urlForAction(webAppUrl, 'getExpenses'));
  return await readJsonResponse(res);
};

export const fetchBudgetFromGoogle = async (webAppUrl) => {
  if (!webAppUrl) return { success: false };
  const url = urlForAction(webAppUrl, 'getBudget');
  try {
    const res = await fetch(url);
    return await readJsonResponse(res);
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const setBudgetOnGoogle = async (webAppUrl, amount) => {
  if (!webAppUrl) return { success: false, error: 'No URL configured' };
  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify({ action: 'setBudget', amount })
    });
    return await readJsonResponse(res);
  } catch (postError) {
    try {
      const res = await fetch(urlForAction(webAppUrl, 'setBudget', { amount: String(amount) }));
      return await readJsonResponse(res);
    } catch (getError) {
      return { success: false, error: getError.message || postError.message };
    }
  }
};

export const fetchFromGoogleSheetId = async (sheetIdOrUrl) => {
  if (!sheetIdOrUrl?.trim()) {
    return { success: false, error: 'Enter a Google Sheet URL or ID' };
  }
  const sheetId = extractSheetId(sheetIdOrUrl);
  try {
    let parsed;
    try {
      parsed = await fetchGviz(sheetId, 'Expenses');
    } catch {
      parsed = await fetchGviz(sheetId);
    }
    const expenses = mapExpenseRows(parsed.table);
    let budget = null;
    try {
      const budgetParsed = await fetchGviz(sheetId, 'Budget');
      const rows = budgetParsed.table?.rows || [];
      for (const row of rows) {
        const key = String(row.c?.[0]?.v || '').toLowerCase();
        if (key.includes('budget')) {
          budget = parseFloat(row.c?.[1]?.v) || 0;
        }
      }
    } catch {
      // Budget tab is optional
    }
    return { success: true, expenses, sheetId, budget };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
