import { motion } from 'motion/react';
import { ArrowUp, ChevronDown } from 'lucide-react';
import { OutletStats } from '../types';

interface TopOutletsProps {
  outlets: OutletStats[];
  onSelectOutlet: (outletName: string) => void;
}

export default function TopOutlets({ outlets, onSelectOutlet }: TopOutletsProps) {
  // Sort outlets by sales desc just in case
  const sortedOutlets = [...outlets].sort((a, b) => b.sales - a.sales);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace('IDR', 'Rp');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800">
          Top Outlets <span className="text-slate-400 font-medium text-[11px] ml-1">(by Sales)</span>
        </h2>
        <div className="relative">
          <select className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 font-medium text-xs rounded-xl px-3.5 py-2 pr-8 cursor-pointer hover:bg-slate-100/50 transition-colors focus:outline-none">
            <option>Hari Ini</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-x-auto p-2 scrollbar-none">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-50">
              <th className="p-3 w-10 text-center">No</th>
              <th className="p-3">Nama Outlet</th>
              <th className="p-3 text-right">Penjualan</th>
              <th className="p-3 text-right w-24">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sortedOutlets.map((outlet, index) => {
              return (
                <motion.tr
                  key={outlet.id}
                  onClick={() => onSelectOutlet(outlet.name)}
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  className="cursor-pointer transition-colors group border-b border-slate-50/50 last:border-0 rounded-xl"
                >
                  {/* Rank */}
                  <td className="p-3 w-10 text-center font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {index + 1}
                  </td>
                  {/* Outlet Name */}
                  <td className="p-3 font-semibold text-slate-800 truncate max-w-[120px]">
                    {outlet.name}
                  </td>
                  {/* Sales */}
                  <td className="p-3 text-right font-bold text-slate-700 font-mono">
                    {formatRupiah(outlet.sales)}
                  </td>
                  {/* Trend Indicator */}
                  <td className="p-3 text-right text-emerald-500 font-bold font-mono">
                    <span className="inline-flex items-center justify-end px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px]">
                      <ArrowUp className="w-2.5 h-2.5 mr-0.5" />
                      {outlet.change}%
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer view detailed report link */}
      <div className="p-4 border-t border-slate-50 flex items-center justify-center bg-slate-50/30">
        <button
          onClick={() => onSelectOutlet(sortedOutlets[0]?.name)}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 hover:underline"
        >
          Lihat semua detail outlet
        </button>
      </div>
    </motion.div>
  );
}
