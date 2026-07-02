import { motion } from 'motion/react';
import * as Icons from 'lucide-react';

const COLOR_MAPS = {
  purple: {
    bg: 'bg-indigo-50/70 text-indigo-600',
    border: 'border-indigo-100',
    sparkline: '#6366f1',
    gradient: 'from-indigo-100/50',
    hoverBg: 'hover:border-indigo-200',
  },
  blue: {
    bg: 'bg-blue-50/70 text-blue-600',
    border: 'border-blue-100',
    sparkline: '#3b82f6',
    gradient: 'from-blue-100/50',
    hoverBg: 'hover:border-blue-200',
  },
  emerald: {
    bg: 'bg-emerald-50/70 text-emerald-600',
    border: 'border-emerald-100',
    sparkline: '#10b981',
    gradient: 'from-emerald-100/50',
    hoverBg: 'hover:border-emerald-200',
  },
  orange: {
    bg: 'bg-amber-50/70 text-amber-600',
    border: 'border-amber-100',
    sparkline: '#f59e0b',
    gradient: 'from-amber-100/50',
    hoverBg: 'hover:border-amber-200',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50/70 text-fuchsia-600',
    border: 'border-fuchsia-100',
    sparkline: '#d946ef',
    gradient: 'from-fuchsia-100/50',
    hoverBg: 'hover:border-fuchsia-200',
  },
  pink: {
    bg: 'bg-pink-50/70 text-pink-600',
    border: 'border-pink-100',
    sparkline: '#ec4899',
    gradient: 'from-pink-100/50',
    hoverBg: 'hover:border-pink-200',
  },
};

export default function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs kemarin',
  iconName,
  sparklineData,
  themeColor,
  onClick,
}) {
  const selectedTheme = COLOR_MAPS[themeColor];
  const IconComponent = Icons[iconName];

  // Render SVG Sparkline
  const width = 140;
  const height = 45;
  const padding = 2;
  const maxVal = Math.max(...sparklineData);
  const minVal = Math.min(...sparklineData);
  const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points = sparklineData.map((val, i) => {
    const x = (i / (sparklineData.length - 1)) * (width - padding * 2) + padding;
    const y =
      height -
      ((val - minVal) / valRange) * (height - padding * 4) -
      padding * 2;
    return { x, y };
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`card p-5 cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between h-[180px] bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.025)] ${selectedTheme.hoverBg} transition-colors`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-xl ${selectedTheme.bg}`}>
            {IconComponent && <IconComponent className="w-5 h-5" />}
          </div>
          <button className="text-slate-300 hover:text-slate-500 transition-colors">
            <Icons.MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
          {title}
        </p>
        <h3 className="text-[20px] font-bold text-slate-800 font-mono tracking-tight mt-1 truncate">
          {value}
        </h3>
      </div>

      <div className="mt-2 flex flex-col justify-end">
        <div className="flex items-center text-[11px] mb-2 z-10">
          <span
            className={`flex items-center font-bold px-1.5 py-0.5 rounded-md ${
              change >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {change >= 0 ? (
              <Icons.ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
            ) : (
              <Icons.ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-slate-400 font-medium ml-1.5 truncate">
            {changeLabel}
          </span>
        </div>

        {/* Sparkline Canvas Area */}
        <div className="h-10 -mx-5 -mb-5 relative overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={selectedTheme.sparkline} stopOpacity={0.25} />
                <stop offset="100%" stopColor={selectedTheme.sparkline} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Gradient Fill Area */}
            {areaD && (
              <motion.path
                d={areaD}
                fill={`url(#gradient-${title.replace(/\s+/g, '')})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              />
            )}

            {/* Sparkline Path Line */}
            {pathD && (
              <motion.path
                d={pathD}
                fill="none"
                stroke={selectedTheme.sparkline}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Background soft hover overlay */}
      <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t ${selectedTheme.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
    </motion.div>
  );
}
