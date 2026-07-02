import { motion } from 'motion/react';
import { ShoppingBag, CheckCircle2, MessageSquare, Megaphone, Info } from 'lucide-react';

const ACTIVITY_CONFIGS = {
  order: {
    icon: ShoppingBag,
    bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  },
  payment: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  chat: {
    icon: MessageSquare,
    bg: 'bg-rose-50 text-rose-600 border border-rose-100',
  },
  system: {
    icon: Info,
    bg: 'bg-slate-50 text-slate-600 border border-slate-100',
  },
  broadcast: {
    icon: Megaphone,
    bg: 'bg-amber-50 text-amber-600 border border-amber-100',
  },
};

const STATUS_STYLING = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border border-amber-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
  neutral: 'bg-slate-50 text-slate-700 border border-slate-100',
  danger: 'bg-rose-50 text-rose-700 border border-rose-100',
};

export default function RecentActivities({ activities, onSelectActivity }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="card bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-50">
        <h2 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h2>
      </div>

      {/* Activity List Container */}
      <div className="flex-1 p-6 space-y-6 relative overflow-y-auto max-h-[360px] scrollbar-none select-none">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Tidak ada aktivitas terbaru.
          </div>
        ) : (
          activities.map((act, index) => {
            const config = ACTIVITY_CONFIGS[act.type] || ACTIVITY_CONFIGS.system;
            const IconComponent = config.icon;
            const statusStyle = act.statusType ? STATUS_STYLING[act.statusType] : STATUS_STYLING.neutral;

            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                onClick={() => onSelectActivity?.(act)}
                className="flex relative group cursor-pointer"
              >
                {/* Connecting Timeline Line */}
                {index < activities.length - 1 && (
                  <div className="absolute top-8 bottom-[-24px] left-4 w-[1.5px] bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                )}

                {/* Left Side Icon */}
                <div className="flex-shrink-0 mr-4 z-10">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${config.bg}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                {/* Right Side Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {act.title}
                      </p>
                      {act.statusLabel && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusStyle}`}>
                          {act.statusLabel}
                        </span>
                      )}
                      {act.type === 'chat' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 ml-1.5 animate-pulse shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium font-mono whitespace-nowrap ml-2">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                    {act.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer view activities link */}
      <div className="p-4 border-t border-slate-50 flex items-center justify-center bg-slate-50/30">
        <button
          onClick={() => activities[0] && onSelectActivity?.(activities[0])}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 hover:underline"
        >
          Lihat semua aktivitas
        </button>
      </div>
    </motion.div>
  );
}
