export const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'restaurant', color: '#4edea3' },
  { id: 'home', name: 'Home items', icon: 'home', color: '#68fcbf' },
  { id: 'travel', name: 'Traveling', icon: 'directions_car', color: '#45dfa4' },
  { id: 'others', name: 'Others', icon: 'more_horiz', color: '#86948a' }
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function normalizeCategory(value) {
  const n = String(value || '').toLowerCase();
  if (n.includes('food') || n.includes('dining') || n.includes('groc')) return 'Food';
  if (n.includes('home') || n.includes('bill') || n.includes('rent') || n.includes('util') || n.includes('shop')) {
    return 'Home items';
  }
  if (n.includes('travel') || n.includes('transport') || n.includes('uber') || n.includes('ola')) {
    return 'Traveling';
  }
  if (CATEGORY_NAMES.includes(value)) return value;
  return 'Others';
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const str = String(value).split('T')[0];
  const d = new Date(`${str}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isInRange(expenseDate, from) {
  const d = parseDate(expenseDate);
  return Boolean(d && d >= from);
}
