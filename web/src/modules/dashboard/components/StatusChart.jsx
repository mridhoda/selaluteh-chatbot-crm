import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const COLORS = {
  Incoming: { stroke: '#94a3b8', bg: 'bg-slate-400' },
  Preparing: { stroke: '#f97316', bg: 'bg-orange-500' },
  Ready: { stroke: '#10b981', bg: 'bg-emerald-500' },
  Completed: { stroke: '#6366f1', bg: 'bg-indigo-500' },
};

export default function StatusChart({
  incoming,
  preparing,
  ready,
  completed,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [timeframe, setTimeframe] = useState('Hari Ini');

  const total = incoming + preparing + ready + completed;

  const data = [
    { label: 'Incoming', count: incoming, color: COLORS.Incoming.stroke, bgClass: COLORS.Incoming.bg },
    { label: 'Preparing', count: preparing, color: COLORS.Preparing.stroke, bgClass: COLORS.Preparing.bg },
    { label: 'Ready', count: ready, color: COLORS.Ready.stroke, bgClass: COLORS.Ready.bg },
    { label: 'Completed', count: completed, color: COLORS.Completed.stroke, bgClass: COLORS.Completed.bg },
  ];

  // SVG Calculations
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const center = 85;

  let accumulatedPercentage = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.025)] flex flex-col justify-between h-full"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-slate-800">Orders by Status</h2>
        <div className="relative">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-100 text-slate-600 font-medium text-xs rounded-xl px-3.5 py-2 pr-8 cursor-pointer hover:bg-slate-100/50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          >
            <option>Hari Ini</option>
            <option>Kemarin</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center relative flex-1">
        {/* SVG Container */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center select-none">
          <svg className="w-full h-full" viewBox={`0 0 ${center * 2} ${center * 2}`}>
            <defs>
              <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.04" />
              </filter>
            </defs>

            {/* Empty track circle if total is 0 */}
            {total === 0 && (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="14"
              />
            )}

            {total > 0 &&
              data.map((item) => {
                if (item.count === 0) return null;

                const percentage = (item.count / total) * 100;
                const strokeDashoffset = circumference - (circumference * percentage) / 100;
                const rotation = -90 + (accumulatedPercentage * 360) / 100;

                // Accumulate percentage for the next circle
                accumulatedPercentage += percentage;

                const isHovered = hoveredSegment === item.label;

                return (
                  <g
                    key={item.label}
                    onMouseEnter={() => setHoveredSegment(item.label)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <motion.circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={isHovered ? '16' : '12'}
                      strokeDasharray={`${circumference} ${circumference}`}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                      transform={`rotate(${rotation} ${center} ${center})`}
                      strokeLinecap={percentage === 100 ? 'butt' : 'round'}
                      filter={isHovered ? 'url(#drop-shadow)' : undefined}
                    />
                  </g>
                );
              })}
          </svg>

          {/* Centered label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.span
              key={total}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight"
            >
              {total}
            </motion.span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Total Orders
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-full mt-6 space-y-2.5">
          {data.map((item) => {
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
            const isHovered = hoveredSegment === item.label;

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredSegment(item.label)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex justify-between items-center text-xs p-1.5 rounded-xl transition-all duration-200 ${
                  isHovered ? 'bg-slate-50 scale-[1.01]' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${item.bgClass} mr-2.5 shadow-sm`} />
                  <span className={`font-semibold transition-colors ${isHovered ? 'text-slate-800' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-700">
                  {item.count}{' '}
                  <span className="text-slate-400 font-medium text-[10px] ml-1">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
