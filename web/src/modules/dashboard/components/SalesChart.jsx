import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ArrowUpRight, ChevronDown } from 'lucide-react';

export default function SalesChart({
  data,
  totalSalesText = 'Rp 168.340.000',
  trendText = '14.2% vs 7 hari sebelumnya',
}) {
  const [activeBar, setActiveBar] = useState(null);
  const [timeframe, setTimeframe] = useState('7 Hari Terakhir');

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const roundedMax = Math.ceil(maxAmount / 10000000) * 10000000; // grid ticks calculation

  // Currency Formatter
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace('IDR', 'Rp');
  };

  const ticks = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.025)] h-full flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-bold text-slate-800">Penjualan 7 Hari Terakhir</h2>
          <div className="relative group">
            <Info className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-pointer transition-colors" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2 bg-slate-800 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-30">
              Total penjualan kotor seluruh outlet yang tercatat selama 7 hari operasional terakhir.
            </div>
          </div>
        </div>

        {/* Custom select dropdown simulation */}
        <div className="relative">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 font-medium text-xs rounded-xl px-3.5 py-2 pr-8 cursor-pointer hover:bg-slate-100/50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          >
            <option>7 Hari Terakhir</option>
            <option>Bulan Ini</option>
            <option>Bulan Lalu</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Overview Stat */}
      <div className="mb-6">
        <div className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight">
          {totalSalesText}
        </div>
        <div className="text-xs flex items-center mt-1 text-slate-500">
          <span className="text-emerald-500 font-semibold flex items-center mr-1">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {trendText.split(' ')[0]}
          </span>
          <span className="font-medium text-slate-400">{trendText.substring(trendText.indexOf(' ') + 1)}</span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 min-h-[220px] flex gap-3 relative select-none">
        {/* Y Axis Ticks */}
        <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono text-right w-12 pb-6 pr-2 h-full">
          {ticks.map((tick, index) => (
            <span key={index} className="truncate">
              {tick === 0 ? 'Rp 0' : `Rp ${tick / 1000000}jt`}
            </span>
          ))}
        </div>

        {/* Bar container */}
        <div className="flex-1 h-full relative">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-t border-slate-100 w-full first:border-t-0" />
            ))}
          </div>

          {/* Actual Bars */}
          <div className="absolute inset-x-0 top-0 bottom-6 flex justify-around items-end z-10 px-2 h-full">
            {data.map((item, idx) => {
              const heightPercent = maxAmount > 0 ? (item.amount / roundedMax) * 85 : 0; // scaled to 85% max height

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  style={{ width: `${100 / data.length}%` }}
                  onMouseEnter={() => setActiveBar(idx)}
                  onMouseLeave={() => setActiveBar(null)}
                >
                  {/* Tooltip */}
                  <AnimatePresence>
                    {activeBar === idx && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: -4, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute bottom-full mb-1 bg-slate-800 text-white font-mono text-[10px] font-semibold py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none z-30 whitespace-nowrap"
                        style={{ y: `-${heightPercent}%` }}
                      >
                        {formatRupiah(item.amount)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Rounded Bar Column */}
                  <div className="w-3 md:w-4.5 bg-slate-50 rounded-full h-full flex items-end relative overflow-hidden">
                    <motion.div
                      className="w-full rounded-full bg-gradient-to-t from-indigo-500 via-indigo-400 to-indigo-300 shadow-[0_2px_8px_rgba(99,102,241,0.2)]"
                      style={{ height: '0%' }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15, delay: idx * 0.05 }}
                    />
                  </div>

                  {/* Date label */}
                  <div className="absolute top-full mt-2 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {item.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
