import { motion } from 'motion/react';
import { MessageCircle, Send, Instagram, Globe, ChevronDown } from 'lucide-react';

const CHANNEL_ICONS = {
  WhatsApp: {
    icon: MessageCircle,
    bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  Telegram: {
    icon: Send,
    bg: 'bg-blue-50 text-blue-500 border border-blue-100',
  },
  Instagram: {
    icon: Instagram,
    bg: 'bg-pink-50 text-pink-600 border border-pink-100',
  },
  Website: {
    icon: Globe,
    bg: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
  },
};

export default function ChannelPerformance({ channels, onSelectChannel }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800">Channel Performance</h2>
        <div className="relative">
          <select className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 font-medium text-xs rounded-xl px-3.5 py-2 pr-8 cursor-pointer hover:bg-slate-100/50 transition-colors focus:outline-none">
            <option>Hari Ini</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 p-4 overflow-x-auto scrollbar-none">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="text-slate-400 font-bold uppercase tracking-wider text-[9px] border-b border-slate-50">
              <th className="py-2 px-3">Channel</th>
              <th className="py-2 px-3 text-right">Orders</th>
              <th className="py-2 px-3 text-right">Sales</th>
              <th className="py-2 px-3 text-right">CVR</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((chan) => {
              const iconConfig = CHANNEL_ICONS[chan.name];
              const IconComponent = iconConfig ? iconConfig.icon : Globe;

              return (
                <motion.tr
                  key={chan.name}
                  onClick={() => onSelectChannel?.(chan.name)}
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  className="cursor-pointer transition-colors group border-b border-slate-50/50 last:border-0"
                >
                  {/* Channel Identifier */}
                  <td className="py-3 px-3 flex items-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-transform group-hover:scale-105 ${iconConfig?.bg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-800">{chan.name}</span>
                  </td>

                  {/* Orders */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                    {chan.orders}
                  </td>

                  {/* Sales */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                    {formatRupiah(chan.sales)}
                  </td>

                  {/* Conversion Rate */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-500">
                    {chan.cvr}%
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer View Channel Report Link */}
      <div className="p-4 border-t border-slate-50 flex items-center justify-center bg-slate-50/30">
        <button
          onClick={() => onSelectChannel?.('WhatsApp')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 hover:underline"
        >
          Lihat laporan detail channel
        </button>
      </div>
    </motion.div>
  );
}
