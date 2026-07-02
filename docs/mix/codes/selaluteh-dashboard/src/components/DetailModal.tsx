import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShoppingBag, CreditCard, Sparkles, MapPin, TrendingUp, HelpCircle } from 'lucide-react';
import { Order, Activity } from '../types';
import { OUTLET_POPULAR_PRODUCTS } from '../data';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'outlet' | 'order' | 'activity' | 'system' | null;
  targetId: string | null;
  orders: Order[];
}

export default function DetailModal({
  isOpen,
  onClose,
  type,
  targetId,
  orders,
}: DetailModalProps) {
  if (!isOpen || !type || !targetId) return null;

  // Currency Formatter
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

  // 1. If OUTLET details
  const renderOutletDetails = (outletName: string) => {
    const popularProducts = OUTLET_POPULAR_PRODUCTS[outletName] || [];
    const outletOrders = orders.filter((o) => o.outlet === outletName);
    const totalSales = outletOrders.reduce((acc, curr) => acc + curr.amount, 0);

    const maxSales = popularProducts.length > 0 ? Math.max(...popularProducts.map((p) => p.sales)) : 1;

    return (
      <div className="space-y-6">
        {/* Banner stat */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              Outlet Lokasi
            </div>
            <h4 className="text-xl font-black text-slate-800 mt-1">{outletName}</h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales (Today)</span>
            <div className="text-lg font-mono font-extrabold text-indigo-600 mt-0.5">
              {formatRupiah(totalSales || 8450000)}
            </div>
          </div>
        </div>

        {/* Popular products list */}
        <div>
          <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Menu Terlaris Hari Ini
          </h5>
          {popularProducts.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium">Belum ada data menu untuk outlet ini.</p>
          ) : (
            <div className="space-y-3.5">
              {popularProducts.map((prod, idx) => {
                const percentage = (prod.sales / maxSales) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{prod.name}</span>
                      <span className="font-mono font-bold text-slate-500">
                        {prod.qty} cup <span className="text-slate-300 font-normal mx-1">|</span> {formatRupiah(prod.sales)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order queue on this outlet */}
        <div>
          <h5 className="text-xs font-bold text-slate-800 mb-2.5">Daftar Transaksi Hari Ini</h5>
          {outletOrders.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium italic">Belum ada transaksi di outlet ini hari ini.</p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-none">
              {outletOrders.map((ord) => (
                <div key={ord.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{ord.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">{ord.orderNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-700">{formatRupiah(ord.amount)}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ml-2 ${
                      ord.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. If ORDER/RECEIPT details
  const renderOrderDetails = (orderNo: string) => {
    const order = orders.find((o) => o.orderNo === orderNo || o.id === orderNo);
    if (!order) {
      return <p className="text-xs text-slate-400 font-medium">Data transaksi tidak ditemukan.</p>;
    }

    return (
      <div className="space-y-5">
        {/* receipt design */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-800 text-white p-4 text-center">
            <h4 className="text-sm font-black tracking-wide uppercase">SelaluTeh Indonesia</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.outlet}</p>
            <p className="text-[9px] text-slate-400 font-mono mt-1">Receipt No: {order.orderNo}</p>
          </div>

          <div className="p-5 space-y-4 bg-white">
            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2.5">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">PELANGGAN</span>
                <span className="font-semibold text-slate-700">{order.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">WAKTU</span>
                <span className="font-mono font-semibold text-slate-600">{order.timestamp}</span>
              </div>
            </div>

            {/* item list */}
            <div className="space-y-3 border-b border-slate-50 pb-3">
              <span className="text-slate-400 font-bold uppercase text-[9px] block">RINCIAN PESANAN</span>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                  <div>
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-slate-400 font-semibold ml-1.5">x{item.quantity}</span>
                  </div>
                  <span className="font-mono font-bold">{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">METODE / STATUS</span>
                <span className="inline-flex items-center text-[10px] font-bold text-indigo-600">
                  {order.channel} • <span className="text-emerald-500 ml-1">Paid</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">TOTAL PEMBAYARAN</span>
                <span className="text-lg font-mono font-black text-slate-800">{formatRupiah(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              alert('Fungsi cetak receipt siap dihubungkan dengan thermal printer Bluetooth!');
              onClose();
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cetak Receipt (Struk)
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  };

  // 3. If CHAT/SYSTEM Activity Details
  const renderActivityDetails = (actId: string) => {
    return (
      <div className="space-y-5">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 mt-1">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">INFORMASI AKTIVITAS</span>
            <h4 className="text-sm font-bold text-slate-800 mt-0.5">Detail Timeline Log</h4>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Log ini diproduksi dan disinkronkan secara real-time dari WhatsApp API dan integrasi Xendit Payment Gateway.
            </p>
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl p-4 space-y-3.5 bg-white shadow-sm text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase text-[9px]">Log ID</span>
            <span className="font-mono font-bold text-slate-600">LOG-SYNC-9043285</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase text-[9px]">Waktu Sinkronisasi</span>
            <span className="font-mono font-semibold text-slate-600">Hari Ini, 9:41 AM</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase text-[9px]">Status Koneksi API</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> ONLINE & CONNECTED
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Konfirmasi & Tutup Log
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal card content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100"
        >
          {/* Top header with close button */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
              {type === 'outlet' && 'Informasi Performa Outlet'}
              {type === 'order' && 'Rincian Transaksi / Receipt'}
              {type === 'activity' && 'Detail Sinkronisasi Log'}
              {type === 'system' && 'Informasi Sistem'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal body */}
          <div className="p-6">
            {type === 'outlet' && renderOutletDetails(targetId)}
            {type === 'order' && renderOrderDetails(targetId)}
            {type === 'activity' && renderActivityDetails(targetId)}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
