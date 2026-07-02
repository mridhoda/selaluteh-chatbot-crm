import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Utensils,
  MessageSquare,
  Plus,
  Send,
  Check,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Es Teh Solo Original', price: 12000 },
  { name: 'Teh Melati Premium', price: 20000 },
  { name: 'Es Teh Lemon', price: 18000 },
  { name: 'Es Teh Susu Aren', price: 21000 },
  { name: 'Matcha Latte SelaluTeh', price: 20000 },
  { name: 'Teh Oolong Premium', price: 25000 },
];

const OUTLETS = ['Danau Murung', 'Samarinda Kota', 'Tenggarong', 'Balikpapan Baru', 'Bontang'];
const CHANNELS = ['WhatsApp', 'Telegram', 'Instagram', 'Website'];

export default function SimulatorPanel({
  onSimulateOrder,
  activeOrders,
  onUpdateOrderStatus,
  onResolveChat,
  chats,
  onTriggerBroadcast,
  onResetData,
}) {
  const [activeTab, setActiveTab] = useState('order');

  // Order Simulation State
  const [customerName, setCustomerName] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(OUTLETS[0]);
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleAddItem = (name, price) => {
    const existing = selectedItems.find((i) => i.name === name);
    if (existing) {
      setSelectedItems(
        selectedItems.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i))
      );
    } else {
      setSelectedItems([...selectedItems, { name, qty: 1, price }]);
    }
  };

  const handleRemoveItem = (name) => {
    const existing = selectedItems.find((i) => i.name === name);
    if (existing && existing.qty > 1) {
      setSelectedItems(
        selectedItems.map((i) => (i.name === name ? { ...i, qty: i.qty - 1 } : i))
      );
    } else {
      setSelectedItems(selectedItems.filter((i) => i.name !== name));
    }
  };

  const handleCreateOrderSubmit = (status = 'Incoming') => {
    if (!customerName.trim()) {
      alert('Tulis nama pelanggan terlebih dahulu!');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Pilih minimal satu menu!');
      return;
    }

    const amount = selectedItems.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

    onSimulateOrder({
      outlet: selectedOutlet,
      channel: selectedChannel,
      amount,
      status,
      paymentStatus: status === 'Completed' ? 'Paid' : 'Pending',
      customerName: customerName.trim(),
      items: [...selectedItems],
    });

    // Reset Form
    setCustomerName('');
    setSelectedItems([]);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Incoming':
        return 'bg-slate-100 text-slate-700';
      case 'Preparing':
        return 'bg-amber-100 text-amber-700';
      case 'Ready':
        return 'bg-emerald-100 text-emerald-700';
      case 'Completed':
        return 'bg-indigo-100 text-indigo-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card bg-white border border-indigo-100/80 rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.06)] flex flex-col h-full overflow-hidden"
    >
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 p-5 text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold tracking-tight">Interactive Playground</h2>
            <p className="text-[10px] text-indigo-200 font-medium">Simulasikan aktivitas outlet nyata</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={onResetData}
            title="Reset Data"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'order'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.08)] border border-indigo-50/50'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Order Baru
        </button>
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'kitchen'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.08)] border border-indigo-50/50'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Dapur/Antrean
          {activeOrders.filter((o) => o.status !== 'Completed').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-500 border-2 border-white text-white rounded-full text-[8px] font-extrabold flex items-center justify-center animate-bounce">
              {activeOrders.filter((o) => o.status !== 'Completed').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'chat'
              ? 'bg-white text-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.08)] border border-indigo-50/50'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Simulasi Chat
          {chats.filter((c) => !c.replied).length > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 border-2 border-white text-white rounded-full text-[8px] font-extrabold flex items-center justify-center">
              {chats.filter((c) => !c.replied).length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[360px] scrollbar-none">
        <AnimatePresence mode="wait">
          {/* TAB 1: ORDER BARU */}
          {activeTab === 'order' && (
            <motion.div
              key="tab-order"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="space-y-4"
            >
              {/* Customer input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pelanggan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kak Dila"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-800"
                />
              </div>

              {/* Outlet & Channel row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Outlet</label>
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-700"
                  >
                    {OUTLETS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Channel</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-slate-700"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu items grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tambahkan Menu</label>
                <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                  {MENU_ITEMS.map((item) => {
                    const count = selectedItems.find((i) => i.name === item.name)?.qty || 0;
                    return (
                      <div
                        key={item.name}
                        onClick={() => handleAddItem(item.name, item.price)}
                        className={`p-2 border rounded-xl flex flex-col justify-between cursor-pointer select-none transition-all active:scale-95 ${
                          count > 0
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700'
                            : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <span className="text-[10px] font-bold truncate">{item.name}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-mono font-bold text-slate-400">Rp {item.price / 1000}k</span>
                          {count > 0 ? (
                            <span className="bg-indigo-600 text-white rounded-full text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                              {count}x
                            </span>
                          ) : (
                            <Plus className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected summary */}
              {selectedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="text-[10px] text-indigo-800 font-semibold">
                    {selectedItems.length} menu terpilih
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    Total: Rp{' '}
                    {selectedItems
                      .reduce((acc, curr) => acc + curr.price * curr.qty, 0)
                      .toLocaleString('id-ID')}
                  </div>
                </motion.div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleCreateOrderSubmit('Completed')}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] tracking-wide transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Bayar Langsung
                </button>
                <button
                  onClick={() => handleCreateOrderSubmit('Incoming')}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] tracking-wide transition-all shadow-md shadow-slate-800/10 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  Masuk Antrean
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: DAPUR/ANTREAN */}
          {activeTab === 'kitchen' && (
            <motion.div
              key="tab-kitchen"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Antrean Masak Aktif</h3>
                <button
                  onClick={onTriggerBroadcast}
                  className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md hover:bg-indigo-100 cursor-pointer transition-colors"
                >
                  Kirim Promo Broadcast (Blast)
                </button>
              </div>

              {activeOrders.filter((o) => o.status !== 'Completed').length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center">
                  <Check className="w-6 h-6 text-emerald-500 mb-1" />
                  <p className="text-[11px] font-bold text-slate-500">Antrean Dapur Bersih!</p>
                  <p className="text-[9px] text-slate-400">Tidak ada pesanan yang perlu dimasak.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                  {activeOrders
                    .filter((o) => o.status !== 'Completed')
                    .map((order) => (
                      <motion.div
                        key={order.id}
                        layoutId={`order-${order.id}`}
                        className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-800">{order.customerName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 truncate max-w-[150px]">
                            {order.orderNo} • {order.outlet}
                          </p>
                          <p className="text-[9px] text-indigo-500 font-bold font-mono mt-0.5">
                            Rp {order.amount.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Advance Action */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {order.status === 'Incoming' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Preparing')}
                              className="text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Masak
                            </button>
                          )}
                          {order.status === 'Preparing' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Ready')}
                              className="text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Selesai Masak
                            </button>
                          )}
                          {order.status === 'Ready' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                              className="text-[9px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              Pick Up
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SIMULASI CHAT */}
          {activeTab === 'chat' && (
            <motion.div
              key="tab-chat"
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="space-y-3"
            >
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Percakapan Masuk (Xendit/Supabase Sync)
              </h3>

              {chats.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl">
                  <p className="text-[11px] font-bold text-slate-500">Semua chat terbalas!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        chat.replied
                          ? 'bg-slate-50/40 border-slate-100'
                          : 'bg-white border-rose-100 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={chat.avatar}
                            alt={chat.sender}
                            className="w-5 h-5 rounded-full object-cover shadow-sm shrink-0"
                          />
                          <span className="text-[10px] font-bold text-slate-800">{chat.sender}</span>
                          <span className="text-[8px] font-semibold bg-slate-100 text-slate-500 px-1.5 rounded-md">
                            {chat.channel}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-400">{chat.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed italic bg-slate-50/50 p-1.5 rounded-md">
                        "{chat.message}"
                      </p>

                      {/* AI Agent suggest answer */}
                      {!chat.replied && chat.aiSuggested && (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-indigo-100">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 mb-1">
                            <Sparkles className="w-3 h-3 animate-bounce text-indigo-500" />
                            AI Agent Smart Suggestion:
                          </div>
                          <p className="text-[9px] text-slate-500 leading-relaxed bg-indigo-50/30 p-1.5 border border-indigo-100/30 rounded-lg">
                            {chat.aiSuggested}
                          </p>
                          <div className="mt-2 flex gap-1.5 justify-end">
                            <button
                              onClick={() => onResolveChat(chat.id, true)}
                              className="text-[8px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <Send className="w-2.5 h-2.5" /> Approve & Kirim AI
                            </button>
                            <button
                              onClick={() => onResolveChat(chat.id, false)}
                              className="text-[8px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              Balas Manual
                            </button>
                          </div>
                        </div>
                      )}

                      {chat.replied && (
                        <div className="mt-1.5 flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                          <Check className="w-3.5 h-3.5 shrink-0" /> Terjawab oleh AI Agent
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
