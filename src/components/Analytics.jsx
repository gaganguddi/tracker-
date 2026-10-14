import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';

export const Analytics = () => {
  const {
    expenses,
    totalSpent,
    budgetLimit,
    currencySymbol,
    categoryTotals,
    activePeriod
  } = useExpense();

  const [timeframe, setTimeframe] = useState('month'); // 'week' | 'month' | 'quarter' | 'year'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute stats
  const dailyAverage = (totalSpent / 22).toFixed(2);
  const projectedMonthEnd = (Number(dailyAverage) * 31).toFixed(2);
  const largestExpense = useMemo(() => {
    if (expenses.length === 0) return null;
    return [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }, [expenses]);

  // Top merchants aggregated
  const topMerchants = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const name = e.merchant || 'Unknown';
      map[name] = (map[name] || 0) + Number(e.amount);
    });

    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenses]);

  // Chart daily points (october spending velocity simulation in INR)
  const chartPoints = [
    { day: "Oct 1", spent: 450, total: 450 },
    { day: "Oct 4", spent: 1240, total: 2450 },
    { day: "Oct 7", spent: 999, total: 5800 },
    { day: "Oct 10", spent: 1850, total: 9200 },
    { day: "Oct 13", spent: 2499, total: 13500 },
    { day: "Oct 16", spent: 2200, total: 18200 },
    { day: "Oct 19", spent: 3290, total: 24100 },
    { day: "Oct 22", spent: 450, total: 28450 }
  ];

  return (
    <div className="flex flex-col w-full gap-3 pb-6">
      {/* Timeframe Selector Pill Bar */}
      <div className="w-full bg-surface-container-lowest p-0.5 rounded-full shadow-inner flex items-center justify-between border border-outline-variant/30">
        {[
          { id: 'week', label: 'Week' },
          { id: 'month', label: 'Month' },
          { id: 'quarter', label: 'Quarter' },
          { id: 'year', label: 'Year' }
        ].map(tf => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTimeframe(tf.id)}
            className={`flex-1 py-1 px-2.5 rounded-full text-center text-[11px] transition-all ${
              timeframe === tf.id
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Monthly Spending Analysis Hero Card - Compact */}
      <div className="w-full bg-surface-container-low rounded-xl p-3 shadow-md flex flex-col gap-2.5 relative overflow-hidden border border-outline-variant/30">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Outflow • {activePeriod}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[24px] font-bold text-on-surface tracking-tight leading-tight">
                {currencySymbol}{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-primary font-semibold flex items-center bg-primary/10 px-1.5 py-0.2 rounded-full border border-primary/20">
                <span className="material-symbols-outlined text-[12px] mr-0.5">arrow_downward</span>
                12%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full shadow-sm border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
            <span className="text-[10px] text-primary font-medium">Under Budget</span>
          </div>
        </div>

        {/* Spending Velocity Graph */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between text-on-surface-variant text-[10px] mb-1.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Actual Velocity
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-outline inline-block opacity-60"></span>
              Target Pace ({currencySymbol}1,600/day)
            </span>
          </div>

          {/* SVG Velocity Chart - Compact Height */}
          <div className="relative w-full h-30 bg-surface-container-lowest rounded-xl p-2.5 flex flex-col justify-end overflow-hidden border border-outline-variant/20">
            {hoveredPoint && (
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-surface-container-highest/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10 border border-primary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] text-on-surface font-semibold">
                  {hoveredPoint.day}: {currencySymbol}{hoveredPoint.spent.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spendGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.4" />
                  <stop offset="85%" stopColor="#4edea3" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line stroke="#3c4a42" strokeOpacity="0.3" strokeWidth="0.75" x1="0" x2="320" y1="25" y2="25" />
              <line stroke="#3c4a42" strokeOpacity="0.3" strokeWidth="0.75" x1="0" x2="320" y1="65" y2="65" />

              {/* Target guideline */}
              <line stroke="#86948a" strokeDasharray="3,3" strokeOpacity="0.6" strokeWidth="1.5" x1="5" x2="315" y1="85" y2="20" />

              {/* Background Volume Bars */}
              {chartPoints.map((pt, idx) => {
                const x = 20 + idx * 38;
                const h = Math.min(55, (pt.spent / 3500) * 55 + 10);
                return (
                  <rect
                    key={pt.day}
                    x={x}
                    y={90 - h}
                    width="10"
                    height={h}
                    rx="2"
                    className="fill-surface-container-high hover:fill-primary/40 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}

              {/* Smooth trend curve area */}
              <path
                d="M 20 75 C 60 70, 100 60, 140 45 C 180 35, 220 20, 280 15 L 280 90 L 20 90 Z"
                fill="url(#spendGradient)"
              />
              <path
                d="M 20 75 C 60 70, 100 60, 140 45 C 180 35, 220 20, 280 15"
                fill="none"
                stroke="#4edea3"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Highlight dot on last data point */}
              <circle cx="280" cy="15" r="4" fill="#4edea3" className="animate-pulse" />
              <circle cx="280" cy="15" r="8" fill="#4edea3" fillOpacity="0.25" />
            </svg>
          </div>
        </div>

        {/* Velocity summary pill metrics */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/20 flex flex-col text-center">
            <span className="text-[9px] text-on-surface-variant font-medium">Daily Burn</span>
            <span className="text-[12px] font-bold text-on-surface mt-0.5 tabular-nums">
              {currencySymbol}{Number(dailyAverage).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/20 flex flex-col text-center">
            <span className="text-[9px] text-on-surface-variant font-medium">Forecast End</span>
            <span className="text-[12px] font-bold text-primary mt-0.5 tabular-nums">
              {currencySymbol}{Number(projectedMonthEnd).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded-lg border border-outline-variant/20 flex flex-col text-center">
            <span className="text-[9px] text-on-surface-variant font-medium">Under Budget</span>
            <span className="text-[12px] font-bold text-secondary mt-0.5 tabular-nums">
              +{currencySymbol}{(budgetLimit - Number(projectedMonthEnd)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Details - Compact */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[13px] font-bold text-on-surface px-0.5">
          Category Distribution
        </h2>

        <div className="flex flex-col gap-2 bg-surface-container rounded-xl p-3 border border-outline-variant/20 shadow-sm">
          {categoryTotals.map(cat => (
            <div key={cat.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                  >
                    <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                  </div>
                  <span className="font-medium text-[11px] text-on-surface">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[11px] text-on-surface tabular-nums">
                    {currencySymbol}{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-on-surface-variant text-[10px] w-7 text-right font-medium">{cat.percent}%</span>
                </div>
              </div>

              <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-600"
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Merchants Card - Compact */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[13px] font-bold text-on-surface px-0.5">
          Top Merchants
        </h2>

        <div className="flex flex-col gap-1.5">
          {topMerchants.map((item, idx) => (
            <div
              key={item.name}
              className="bg-surface-container p-2.5 rounded-xl border border-outline-variant/20 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-surface-container-highest text-primary font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-on-surface">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-on-surface tabular-nums">
                {currencySymbol}{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
