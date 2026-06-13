import React from 'react';

export default function OrderTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div>
      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
        <span>⏱️</span>
        <span>Order Timeline</span>
      </div>

      <div className="relative pl-2.5 flex flex-col gap-3">
        {/* Vertical line connector */}
        <div className="absolute left-[14px] top-1.5 bottom-1.5 w-0.5 bg-[var(--surface-tertiary)]"></div>

        {timeline.map((event, index) => {
          const isCreated = event.label.toLowerCase().includes('created');
          const isPayment = event.label.toLowerCase().includes('payment') || event.label.toLowerCase().includes('received');
          const isCancelled = event.label.toLowerCase().includes('cancel');
          const isPreparing = event.label.toLowerCase().includes('preparing');
          const isCompleted = event.label.toLowerCase().includes('completed');
          const isReady = event.label.toLowerCase().includes('ready');

          let dotColor = 'bg-[var(--border-strong)]';
          if (isCreated) dotColor = 'bg-[var(--brand-500)]';
          if (isPayment || isCompleted) dotColor = 'bg-[var(--success-500)]';
          if (isPreparing) dotColor = 'bg-[var(--warning-500)]';
          if (isReady) dotColor = 'bg-[var(--ai-500)]';
          if (isCancelled) dotColor = 'bg-[var(--danger-500)]';

          return (
            <div key={index} className="relative flex items-center gap-4 z-10">
              {/* Dot marker */}
              <div className={`w-[9px] h-[9px] rounded-full shrink-0 ${dotColor} ring-4 ring-[var(--surface-primary)]`}></div>

              {/* Event content */}
              <div className="flex items-center justify-between w-full gap-4 text-xs font-medium">
                <span className="text-[var(--text-muted)] text-[11px] shrink-0 w-[125px]">
                  {event.time}
                </span>
                <span className="text-[var(--text-secondary)] flex-1 text-left">
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
