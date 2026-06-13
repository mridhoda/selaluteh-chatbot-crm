import React from 'react';

export default function OrderTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
        <span>⏱️</span>
        <span>Order Timeline</span>
      </div>
      
      <div className="relative pl-2.5 flex flex-col gap-3">
        {/* Vertical line connector */}
        <div className="absolute left-[14px] top-1.5 bottom-1.5 w-0.5 bg-slate-100"></div>

        {timeline.map((event, index) => {
          const isCreated = event.label.toLowerCase().includes('created');
          const isPayment = event.label.toLowerCase().includes('payment') || event.label.toLowerCase().includes('received');
          const isCancelled = event.label.toLowerCase().includes('cancel');
          const isPreparing = event.label.toLowerCase().includes('preparing');
          const isCompleted = event.label.toLowerCase().includes('completed');
          const isReady = event.label.toLowerCase().includes('ready');
          
          let dotColor = 'bg-slate-300'; // default gray
          if (isCreated) dotColor = 'bg-orange-500';
          if (isPayment || isPreparing || isCompleted || isReady) dotColor = 'bg-green-500';
          if (isCancelled) dotColor = 'bg-red-500';

          return (
            <div key={index} className="relative flex items-center gap-4 z-10">
              {/* Dot marker */}
              <div className={`w-[9px] h-[9px] rounded-full shrink-0 ${dotColor} ring-4 ring-white`}></div>

              {/* Event content */}
              <div className="flex items-center justify-between w-full gap-4 text-xs font-medium">
                <span className="text-slate-400 text-[11px] shrink-0 w-[125px]">
                  {event.time}
                </span>
                <span className="text-slate-700 flex-1 text-left">
                  {event.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
