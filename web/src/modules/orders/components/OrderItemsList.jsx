import React from 'react';

export default function OrderItemsList({
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0
}) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number).replace(/(,00)/g, '');
  };

  const getItemEmojiAndBg = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('caramel') || lower.includes('sally')) {
      return { emoji: '🧋', bg: 'bg-orange-50 border-orange-100 text-orange-600' };
    }
    if (lower.includes('kopi') || lower.includes('aren') || lower.includes('coffee')) {
      return { emoji: '🥤', bg: 'bg-yellow-50 border-yellow-100 text-yellow-600' };
    }
    if (lower.includes('teh') || lower.includes('tea') || lower.includes('lemon')) {
      return { emoji: '🥤', bg: 'bg-green-50 border-green-100 text-green-600' };
    }
    return { emoji: '🥤', bg: 'bg-orange-50 border-orange-100 text-orange-600' };
  };

  return (
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
        <span>📋</span>
        <span>Order Items ({items.reduce((acc, item) => acc + (item.qty || 1), 0)})</span>
      </div>
      
      <div className="space-y-3 mb-3">
        {items.map((item, index) => {
          const { emoji, bg } = getItemEmojiAndBg(item.name);
          return (
            <div key={index} className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center text-lg border shrink-0 ${bg}`}>
                  {emoji}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm leading-tight">
                    {item.qty || 1}x {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-none">
                    {item.variant || 'Standard'}
                  </div>
                </div>
              </div>
              <div className="font-bold text-slate-800 text-sm shrink-0">
                {formatRupiah(item.price * (item.qty || 1))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 text-sm pt-2 border-t border-slate-100">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Delivery Fee</span>
          <span>{formatRupiah(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-100">
          <span>Total Amount</span>
          <span className="text-green-600 font-extrabold">{formatRupiah(total)}</span>
        </div>
      </div>
    </div>
  );
}
