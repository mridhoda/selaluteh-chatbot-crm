import { PUBLIC_ORDER_STATUS, PUBLIC_ORDER_STATUS_LABELS } from '../types/orderStatus.types'

export default function OrderStatusTimeline({ status }) {
  const cancelled = status === PUBLIC_ORDER_STATUS.CANCELLED || status === PUBLIC_ORDER_STATUS.PAYMENT_EXPIRED

  // Determine active step index:
  // 0: Diproses (PAYMENT_PENDING, PAID, AWAITING_OUTLET_APPROVAL, PREPARING)
  // 1: Siap Diambil (READY_FOR_PICKUP)
  // 2: Selesai (COMPLETED)
  let activeStep = 0
  if (status === PUBLIC_ORDER_STATUS.COMPLETED) {
    activeStep = 2
  } else if (status === PUBLIC_ORDER_STATUS.READY_FOR_PICKUP) {
    activeStep = 1
  }

  // Get specific text for Step 1 based on current status
  const getStep1Subtitle = () => {
    if (activeStep > 0) return 'Selesai'
    if (status === PUBLIC_ORDER_STATUS.PAYMENT_PENDING) return 'Menunggu bayar'
    if (status === PUBLIC_ORDER_STATUS.PAID) return 'Pembayaran berhasil'
    if (status === PUBLIC_ORDER_STATUS.AWAITING_OUTLET_APPROVAL) return 'Menunggu konfirmasi'
    if (status === PUBLIC_ORDER_STATUS.PREPARING) return 'Sedang dibuat'
    return 'Sedang diproses'
  }

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes active-glow {
          0% {
            box-shadow: 0 0 0 0px var(--brand-100);
          }
          70% {
            box-shadow: 0 0 0 10px transparent;
          }
          100% {
            box-shadow: 0 0 0 0px transparent;
          }
        }
        .active-step-glowing {
          animation: active-glow 2s infinite;
        }
      `}</style>

      <h3 className="m-0 text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Status Pesanan</h3>

      {cancelled ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
          <p className="m-0 text-sm font-bold text-red-700">{PUBLIC_ORDER_STATUS_LABELS[status]}</p>
        </div>
      ) : (
        <div className="relative flex justify-between items-start w-full z-10 pt-2 pb-2 select-none overflow-visible">
          {/* Connecting Lines Background */}
          <div className="absolute top-[36px] left-[15%] right-[15%] h-1 flex z-[-1] bg-gray-100 rounded-full overflow-hidden">
            {/* First Segment (Step 1 to Step 2) */}
            <div
              className="h-full transition-all duration-500"
              style={{
                width: '50%',
                background: activeStep >= 1 
                  ? 'linear-gradient(to right, #22c55e, var(--brand-500))' 
                  : 'linear-gradient(to right, #22c55e, #e5e7eb)'
              }}
            />
            {/* Second Segment (Step 2 to Step 3) */}
            <div
              className="h-full transition-all duration-500"
              style={{
                width: '50%',
                background: activeStep === 2 
                  ? 'linear-gradient(to right, var(--brand-500), #10b981)' 
                  : '#e5e7eb'
              }}
            />
          </div>

          {/* Step 1: Sedang Diproses */}
          <div className="flex flex-col items-center w-1/3">
            <div className="relative mb-3 flex justify-center items-center h-[68px]">
              {activeStep === 0 ? (
                // Active State (Larger, glowing)
                <div 
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center p-1 relative z-10 active-step-glowing"
                  style={{
                    backgroundColor: 'var(--brand-50)',
                    transition: 'all 0.3s'
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: 'var(--brand-500)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                      <line x1="6" y1="2" x2="6" y2="4" />
                      <line x1="10" y1="2" x2="10" y2="4" />
                      <line x1="14" y1="2" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-20 text-white text-[11px] font-bold"
                    style={{ backgroundColor: 'var(--brand-600)' }}
                  >
                    1
                  </div>
                </div>
              ) : (
                // Completed State (Green check)
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full border-[1.5px] border-green-500 bg-white flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                        <line x1="6" y1="2" x2="6" y2="4" />
                        <line x1="10" y1="2" x2="10" y2="4" />
                        <line x1="14" y1="2" x2="14" y2="4" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            <p 
              className="m-0 font-black text-[12px] text-center mb-1 leading-tight"
              style={{ color: activeStep === 0 ? 'var(--brand-600)' : '#111827' }}
            >
              Sedang Diproses
            </p>
            {activeStep === 0 ? (
              <div className="m-0 text-gray-500 text-[9px] text-center leading-tight max-w-[85px] flex items-center justify-center gap-1 mx-auto">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--brand-500)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--brand-500)' }} />
                </span>
                <span>{getStep1Subtitle()}</span>
              </div>
            ) : (
              <span className="bg-green-50 text-green-700 text-[9px] font-bold px-3 py-0.5 rounded-full">
                Selesai
              </span>
            )}
          </div>

          {/* Step 2: Siap Diambil */}
          <div className="flex flex-col items-center w-1/3">
            <div className="relative mb-3 flex justify-center items-center h-[68px]">
              {activeStep === 1 ? (
                // Active State (Larger, glowing)
                <div 
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center p-1 relative z-10 active-step-glowing"
                  style={{
                    backgroundColor: 'var(--brand-50)',
                    transition: 'all 0.3s'
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: 'var(--brand-500)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-20 text-white text-[11px] font-bold"
                    style={{ backgroundColor: 'var(--brand-600)' }}
                  >
                    2
                  </div>
                </div>
              ) : activeStep > 1 ? (
                // Completed State (Green check)
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full border-[1.5px] border-green-500 bg-white flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </div>
              ) : (
                // Future State (Grey/disabled)
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full border-[1.5px] border-gray-200 bg-white flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                    2
                  </div>
                </div>
              )}
            </div>

            <p 
              className="m-0 font-black text-[12px] text-center mb-1 leading-tight"
              style={{ 
                color: activeStep === 1 ? 'var(--brand-600)' : activeStep > 1 ? '#111827' : '#6b7280' 
              }}
            >
              Siap Diambil
            </p>
            {activeStep === 1 ? (
              <div className="m-0 text-gray-500 text-[9px] text-center leading-tight max-w-[85px] flex items-center justify-center gap-1 mx-auto">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--brand-500)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--brand-500)' }} />
                </span>
                <span>Siap diambil</span>
              </div>
            ) : activeStep > 1 ? (
              <span className="bg-green-50 text-green-700 text-[9px] font-bold px-3 py-0.5 rounded-full">
                Selesai
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-3 py-0.5 rounded-full">
                Mendatang
              </span>
            )}
          </div>

          {/* Step 3: Selesai */}
          <div className="flex flex-col items-center w-1/3">
            <div className="relative mb-3 flex justify-center items-center h-[68px]">
              {activeStep === 2 ? (
                // Active State (Larger, glowing)
                <div 
                  className="w-[68px] h-[68px] rounded-full flex items-center justify-center p-1 relative z-10 active-step-glowing"
                  style={{
                    backgroundColor: 'var(--brand-50)',
                    transition: 'all 0.3s'
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: 'var(--brand-500)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                      <path d="M16 8H8" />
                      <path d="M16 12H8" />
                      <path d="M15 16H8" />
                    </svg>
                  </div>
                  <div 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-20 text-white text-[11px] font-bold"
                    style={{ backgroundColor: 'var(--brand-600)' }}
                  >
                    3
                  </div>
                </div>
              ) : (
                // Future State (Grey/disabled)
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center p-1">
                    <div className="w-full h-full rounded-full border-[1.5px] border-gray-200 bg-white flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                        <path d="M16 8H8" />
                        <path d="M16 12H8" />
                        <path d="M15 16H8" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">
                    3
                  </div>
                </div>
              )}
            </div>

            <p 
              className="m-0 font-black text-[12px] text-center mb-1 leading-tight"
              style={{ color: activeStep === 2 ? 'var(--brand-600)' : '#6b7280' }}
            >
              Selesai
            </p>
            {activeStep === 2 ? (
              <div className="m-0 text-gray-500 text-[9px] text-center leading-tight max-w-[85px] flex items-center justify-center gap-1 mx-auto">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--brand-500)' }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--brand-500)' }} />
                </span>
                <span>Selesai</span>
              </div>
            ) : (
              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-3 py-0.5 rounded-full">
                Mendatang
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
