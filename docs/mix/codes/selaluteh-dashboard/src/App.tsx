import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ShoppingCart,
  Tag,
  Users,
  MessageCircle,
  Target,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Bell,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Types and Initial Data
import { Order, OrderStatus, Activity, ChannelType } from './types';
import {
  INITIAL_ORDERS,
  INITIAL_OUTLET_STATS,
  INITIAL_CHANNEL_STATS,
  INITIAL_ACTIVITIES,
  SEVEN_DAYS_SALES,
  MOCK_CHATS,
} from './data';

// Components
import MetricCard from './components/MetricCard';
import SalesChart from './components/SalesChart';
import StatusChart from './components/StatusChart';
import TopOutlets from './components/TopOutlets';
import ChannelPerformance from './components/ChannelPerformance';
import RecentActivities from './components/RecentActivities';
import SimulatorPanel from './components/SimulatorPanel';
import DetailModal from './components/DetailModal';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function App() {
  // --- CORE STATE ---
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [outletStats, setOutletStats] = useState(INITIAL_OUTLET_STATS);
  const [channelStats, setChannelStats] = useState(INITIAL_CHANNEL_STATS);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [sevenDaysSales, setSevenDaysSales] = useState(SEVEN_DAYS_SALES);

  // --- INTERACTION & UI STATES ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'Hari Ini' | 'Bulan Ini' | '7 Hari Terakhir'>('Hari Ini');
  const [activeTabSlot, setActiveTabSlot] = useState<'simulator' | 'stats'>('simulator');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // --- DETAIL MODAL STATE ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'outlet' | 'order' | 'activity' | 'system' | null>(null);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);

  // --- AI PERFORMA BASELINES ---
  const [aiResolvedBase, setAiResolvedBase] = useState(64);
  const [aiEscalatedBase, setAiEscalatedBase] = useState(23);

  // --- TOAST TRIGGER ---
  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Play subtle synthesized audio beep if sound is enabled
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'success') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.35);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.35);
        } else {
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.25);
        }
      } catch (e) {
        // ignore audio block
      }
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // --- SIMULATE NEW ORDER CALLBACK ---
  const handleSimulateNewOrder = (
    newOrderData: Omit<Order, 'id' | 'orderNo' | 'timestamp'>
  ) => {
    const id = (orders.length + 1).toString();
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const orderNo = `#ST-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${1000 + orders.length + 1}`;

    const newOrder: Order = {
      ...newOrderData,
      id,
      orderNo,
      timestamp: nowTime,
    };

    // Update orders list
    setOrders((prev) => [newOrder, ...prev]);

    // Update outlets statistics sales & orderCount
    setOutletStats((prev) =>
      prev.map((o) =>
        o.name === newOrder.outlet
          ? { ...o, sales: o.sales + newOrder.amount, orderCount: o.orderCount + 1 }
          : o
      )
    );

    // Update channels statistics
    setChannelStats((prev) =>
      prev.map((c) =>
        c.name === newOrder.channel
          ? { ...c, orders: c.orders + 1, sales: c.sales + newOrder.amount }
          : c
      )
    );

    // Update 7 days sales data (add to the latest day, i.e. 21 May)
    setSevenDaysSales((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          amount: updated[updated.length - 1].amount + newOrder.amount,
        };
      }
      return updated;
    });

    // Create New Activities Logs
    const orderActivity: Activity = {
      id: `act-new-order-${id}`,
      title: `Order ${orderNo}`,
      subtitle: `${newOrder.outlet} • Oleh ${newOrder.customerName}`,
      timestamp: nowTime,
      type: 'order',
      statusLabel: newOrder.status === 'Completed' ? 'Paid' : newOrder.status,
      statusType: newOrder.status === 'Completed' ? 'success' : 'warning',
    };

    let paymentActivity: Activity | null = null;
    if (newOrder.paymentStatus === 'Paid') {
      paymentActivity = {
        id: `act-new-pay-${id}`,
        title: 'Pembayaran Xendit berhasil',
        subtitle: `Order ${orderNo}`,
        timestamp: nowTime,
        type: 'payment',
        statusLabel: 'Success',
        statusType: 'success',
      };
    }

    setActivities((prev) => {
      const base = [orderActivity, ...prev];
      if (paymentActivity) {
        return [paymentActivity, ...base];
      }
      return base;
    });

    triggerToast(`Order ${orderNo} berhasil masuk dari ${newOrder.channel}!`, 'success');
  };

  // --- UPDATE ORDER STATUS IN KITCHEN ---
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    let orderNoStr = '';
    let clientName = '';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          orderNoStr = o.orderNo;
          clientName = o.customerName;
          return {
            ...o,
            status: nextStatus,
            paymentStatus: nextStatus === 'Completed' ? 'Paid' : o.paymentStatus,
          };
        }
        return o;
      })
    );

    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Add activity based on status step
    const stepLabelMap = {
      Preparing: 'Memasak',
      Ready: 'Siap Diambil',
      Completed: 'Selesai / Saji',
    };

    const statusStyleMap: Record<string, 'success' | 'warning' | 'info'> = {
      Preparing: 'warning',
      Ready: 'success',
      Completed: 'success',
    };

    const isPaid = nextStatus === 'Completed';

    const kitchenActivity: Activity = {
      id: `act-kitchen-${orderId}-${nextStatus}`,
      title: `Order ${orderNoStr} ${stepLabelMap[nextStatus]}`,
      subtitle: `${clientName} bersiap menerima teh segarnya`,
      timestamp: nowTime,
      type: 'order',
      statusLabel: isPaid ? 'Paid' : nextStatus,
      statusType: statusStyleMap[nextStatus],
    };

    let paymentActivity: Activity | null = null;
    if (isPaid) {
      paymentActivity = {
        id: `act-pay-com-${orderId}`,
        title: 'Pembayaran Xendit diselesaikan',
        subtitle: `Order ${orderNoStr} lunas otomatis`,
        timestamp: nowTime,
        type: 'payment',
        statusLabel: 'Success',
        statusType: 'success',
      };
    }

    setActivities((prev) => {
      const base = [kitchenActivity, ...prev];
      if (paymentActivity) {
        return [paymentActivity, ...base];
      }
      return base;
    });

    triggerToast(`Order ${orderNoStr} bergeser ke status ${nextStatus}!`, 'info');
  };

  // --- RESOLVE CUSTOMER CHAT CALLBACK ---
  const handleResolveChat = (chatId: string, isAi: boolean) => {
    let senderName = '';
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          senderName = c.sender;
          return { ...c, replied: true };
        }
        return c;
      })
    );

    if (isAi) {
      setAiResolvedBase((prev) => prev + 1);
    } else {
      setAiEscalatedBase((prev) => prev + 1);
    }

    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Add Log Activity
    const chatResolveActivity: Activity = {
      id: `act-chat-res-${chatId}`,
      title: `Chat ${senderName} terjawab`,
      subtitle: isAi ? 'Dibalas otomatis oleh AI Agent' : 'Dihubungkan ke staf outlet',
      timestamp: nowTime,
      type: 'chat',
      statusLabel: isAi ? 'AI Resolved' : 'Escalated',
      statusType: isAi ? 'success' : 'info',
    };

    setActivities((prev) => [chatResolveActivity, ...prev]);
    triggerToast(`Pesan Kak ${senderName} berhasil dijawab!`, 'success');
  };

  // --- TRIGGER MARKETING BROADCAST (BLAST) ---
  const handleTriggerBroadcast = () => {
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const blastActivity: Activity = {
      id: `act-broadcast-${Date.now()}`,
      title: 'Broadcast "Promo Hari Gajian" terkirim',
      subtitle: 'WhatsApp • 1.480 target pelanggan terdaftar',
      timestamp: nowTime,
      type: 'broadcast',
      statusLabel: 'Delivered',
      statusType: 'info',
    };

    setActivities((prev) => [blastActivity, ...prev]);
    triggerToast('Broadcast promo berhasil dikirim ke 1.480 database pelanggan!', 'info');
  };

  // --- RESET SIMULATION DATA ---
  const handleResetData = () => {
    setOrders(INITIAL_ORDERS);
    setActivities(INITIAL_ACTIVITIES);
    setOutletStats(INITIAL_OUTLET_STATS);
    setChannelStats(INITIAL_CHANNEL_STATS);
    setChats(MOCK_CHATS);
    setSevenDaysSales(SEVEN_DAYS_SALES);
    setAiResolvedBase(64);
    setAiEscalatedBase(23);
    triggerToast('Semua data dashboard dikembalikan ke kondisi demo awal!', 'warning');
  };

  // --- REFRESH MANUALLY ---
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerToast('Seluruh widget diperbarui & sinkronisasi Supabase/Xendit aktif!', 'success');
    }, 1000);
  };

  // --- OPEN MODAL TRIGGER ---
  const openModalHandler = (type: 'outlet' | 'order' | 'activity' | 'system', id: string) => {
    setModalType(type);
    setModalTargetId(id);
    setModalOpen(true);
  };

  // --- RECALCULATED DYNAMIC AGGREGATED METRICS ---
  const derivedMetrics = useMemo(() => {
    // Initial core numbers to align with screenshot baselines
    const baseGrossSales = 24680000;
    const baseOrdersCount = 256;
    const baseCustomersCount = 1285;
    const baseConversationsCount = 87;

    // Calculate simulated increments
    const simulatedOrders = orders.filter((o) => o.id !== '1' && o.id !== '2' && o.id !== '3' && o.id !== '4' && o.id !== '5');
    const simulatedSalesAdded = simulatedOrders.reduce((acc, curr) => acc + curr.amount, 0);
    const simulatedOrdersAdded = simulatedOrders.length;

    const totalSales = baseGrossSales + simulatedSalesAdded;
    const totalOrders = baseOrdersCount + simulatedOrdersAdded;
    const averageOrderValue = Math.round(totalSales / totalOrders);

    const activeUnrepliedCount = chats.filter((c) => !c.replied).length;
    const activeConversations = baseConversationsCount + activeUnrepliedCount;

    const totalCustomers = baseCustomersCount + simulatedOrdersAdded;

    // Conversion rate base + fluctuation
    const conversionRate = 18.7 + simulatedOrdersAdded * 0.05;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalCustomers,
      activeConversations,
      conversionRate,
    };
  }, [orders, chats]);

  // Sparkline data baselines
  const salesSparkline = [65, 59, 80, 81, 56, 75, 90 + (orders.length - INITIAL_ORDERS.length) * 5];
  const ordersSparkline = [28, 48, 40, 19, 86, 27, 90 + (orders.length - INITIAL_ORDERS.length) * 5];
  const aovSparkline = [45, 25, 60, 31, 46, 55, 60];
  const customersSparkline = [15, 39, 20, 51, 36, 45, 60 + (orders.length - INITIAL_ORDERS.length) * 2];
  const convSparkline = [65, 49, 80, 51, 66, 75, 80 + chats.filter((c) => !c.replied).length * 5];
  const crSparkline = [35, 59, 40, 61, 56, 45, 70];

  // Donut chart status aggregations
  const statusCounts = useMemo(() => {
    // screenshot base: Incoming: 38, Preparing: 102, Ready: 84, Completed: 32 (Total 256)
    let incoming = 38;
    let preparing = 102;
    let ready = 84;
    let completed = 32;

    // Adjust for mutations/simulated orders
    orders.forEach((o) => {
      // Find if it was part of initial list (to prevent double counting)
      const isInitial = ['1', '2', '3', '4', '5'].includes(o.id);

      if (isInitial) {
        // Find standard starting status for initial orders and subtract them
        const initialStatusMap: Record<string, OrderStatus> = {
          '1': 'Completed',
          '2': 'Preparing',
          '3': 'Ready',
          '4': 'Incoming',
          '5': 'Completed',
        };
        const defaultStat = initialStatusMap[o.id];

        // Deduct baseline count
        if (defaultStat === 'Incoming') incoming--;
        if (defaultStat === 'Preparing') preparing--;
        if (defaultStat === 'Ready') ready--;
        if (defaultStat === 'Completed') completed--;
      }

      // Add to current status count
      if (o.status === 'Incoming') incoming++;
      if (o.status === 'Preparing') preparing++;
      if (o.status === 'Ready') ready++;
      if (o.status === 'Completed') completed++;
    });

    return { incoming, preparing, ready, completed };
  }, [orders]);

  // Recalculate AI resolved stats
  const aiStats = useMemo(() => {
    const total = aiResolvedBase + aiEscalatedBase;
    const resolvedPercent = total > 0 ? parseFloat(((aiResolvedBase / total) * 100).toFixed(1)) : 0;
    const escalatedPercent = total > 0 ? parseFloat(((aiEscalatedBase / total) * 100).toFixed(1)) : 0;
    return {
      resolved: aiResolvedBase,
      escalated: aiEscalatedBase,
      resolvedPercent,
      escalatedPercent,
    };
  }, [aiResolvedBase, aiEscalatedBase]);

  // Recalculate Payment totals
  const paymentStats = useMemo(() => {
    const paidAmount = orders
      .filter((o) => o.paymentStatus === 'Paid')
      .reduce((acc, curr) => acc + curr.amount, 0) + 23530000; // base offset to match Rp 23.650.000

    const pendingAmount = orders
      .filter((o) => o.paymentStatus === 'Pending')
      .reduce((acc, curr) => acc + curr.amount, 0) + 965000; // base offset to match Rp 1.030.000

    const total = paidAmount + pendingAmount;
    const paidPercent = total > 0 ? parseFloat(((paidAmount / total) * 100).toFixed(1)) : 0;
    const pendingPercent = total > 0 ? parseFloat(((pendingAmount / total) * 100).toFixed(1)) : 0;

    return {
      paid: paidAmount,
      pending: pendingAmount,
      paidPercent,
      pendingPercent,
    };
  }, [orders]);

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col justify-between">
      {/* --- FLOATING TOASTS NOTIFICATIONS --- */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 border border-slate-800"
            >
              <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                toast.type === 'success' ? 'text-emerald-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
              }`} />
              <div className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- APP HEADER --- */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              SelaluTeh Dashboard
            </h1>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" /> LIVE DEMO
            </span>
          </div>
          <p className="text-slate-400 font-medium mt-1 text-sm">
            Ringkasan performa bisnis, penjualan kotor, antrean dapur, dan operasional SelaluTeh.
          </p>
        </div>

        {/* Header Actions Profile */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2 px-1">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Profile"
              className="w-8 h-8 rounded-xl object-cover shadow-sm border border-slate-100 shrink-0"
            />
            <div className="text-left shrink-0">
              <h4 className="text-xs font-bold text-slate-800 leading-none">mridhoda@gmail.com</h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Owner / Admin</p>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-100 shrink-0 mx-1" />
          <div className="flex gap-1.5 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick alert indicator */}
            <button
              onClick={() => triggerToast('Koneksi WhatsApp API stabil & responsif.', 'info')}
              className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100/70 text-slate-500 rounded-xl transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN DASHBOARD INTERFACE GRID --- */}
      <main className="space-y-6 flex-1">
        
        {/* ROW 1: 6 STATISTIC METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total Sales (Gross)"
            value={formatRupiah(derivedMetrics.totalSales)}
            change={15.6}
            iconName="Wallet"
            sparklineData={salesSparkline}
            themeColor="purple"
            onClick={() => openModalHandler('outlet', 'Danau Murung')}
          />
          <MetricCard
            title="Total Orders"
            value={derivedMetrics.totalOrders.toString()}
            change={12.3}
            iconName="ShoppingCart"
            sparklineData={ordersSparkline}
            themeColor="blue"
            onClick={() => openModalHandler('order', orders[0]?.id || '1')}
          />
          <MetricCard
            title="Average Order Value"
            value={formatRupiah(derivedMetrics.averageOrderValue)}
            change={5.2}
            iconName="Tag"
            sparklineData={aovSparkline}
            themeColor="emerald"
          />
          <MetricCard
            title="Total Customers"
            value={derivedMetrics.totalCustomers.toLocaleString('id-ID')}
            change={9.8}
            iconName="Users"
            sparklineData={customersSparkline}
            themeColor="orange"
          />
          <MetricCard
            title="Active Conversations"
            value={derivedMetrics.activeConversations.toString()}
            change={21.4}
            iconName="MessageCircle"
            sparklineData={convSparkline}
            themeColor="fuchsia"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${derivedMetrics.conversionRate.toFixed(1)}%`}
            change={2.1}
            iconName="Target"
            sparklineData={crSparkline}
            themeColor="pink"
          />
        </div>

        {/* ROW 2: BAR CHART, DONUT CHART, TOP OUTLETS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 xl:col-span-1 w-full">
            <SalesChart
              data={sevenDaysSales}
              totalSalesText={formatRupiah(sevenDaysSales.reduce((acc, curr) => acc + curr.amount, 0))}
              trendText="14.2% vs 7 hari sebelumnya"
            />
          </div>

          <StatusChart
            incoming={statusCounts.incoming}
            preparing={statusCounts.preparing}
            ready={statusCounts.ready}
            completed={statusCounts.completed}
          />

          <TopOutlets
            outlets={outletStats}
            onSelectOutlet={(name) => openModalHandler('outlet', name)}
          />
        </div>

        {/* ROW 3: CHANNEL PERFORMANCE, RECENT ACTIVITIES, INTERACTIVE PLAYGROUND (BENTO BOX) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChannelPerformance
            channels={channelStats}
            onSelectChannel={(chanName) => openModalHandler('outlet', 'Danau Murung')}
          />

          <RecentActivities
            activities={activities}
            onSelectActivity={(act) => {
              if (act.type === 'order') {
                const matchId = act.title.split(' ').pop() || '';
                openModalHandler('order', matchId);
              } else {
                openModalHandler('activity', act.id);
              }
            }}
          />

          {/* Right Bento Box Slot: Switchable original Metrics Stack vs Simulator Playground */}
          <div className="flex flex-col gap-6">
            {/* Header Switch Controls */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setActiveTabSlot('simulator')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTabSlot === 'simulator'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Playground Simulator
              </button>
              <button
                onClick={() => setActiveTabSlot('stats')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTabSlot === 'stats'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Asisten & Payment
              </button>
            </div>

            {/* Container for Slot items */}
            <div className="flex-1 min-h-[360px]">
              <AnimatePresence mode="wait">
                {activeTabSlot === 'simulator' ? (
                  <motion.div
                    key="simulator-playground"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <SimulatorPanel
                      onSimulateOrder={handleSimulateNewOrder}
                      activeOrders={orders}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onResolveChat={handleResolveChat}
                      chats={chats}
                      onTriggerBroadcast={handleTriggerBroadcast}
                      onResetData={handleResetData}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="original-metrics-stack"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6 h-full flex flex-col"
                  >
                    {/* AI Agent Performance */}
                    <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-800">AI Agent Performance</h2>
                        <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
                          Hari Ini
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved by AI</p>
                          <div className="flex justify-between items-end mt-1">
                            <span className="text-2xl font-mono font-extrabold text-slate-800">{aiStats.resolved}</span>
                            <span className="text-xs font-bold text-emerald-500">{aiStats.resolvedPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                            <motion.div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: '0%' }}
                              animate={{ width: `${aiStats.resolvedPercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalated to Staff</p>
                          <div className="flex justify-between items-end mt-1">
                            <span className="text-2xl font-mono font-extrabold text-slate-800">{aiStats.escalated}</span>
                            <span className="text-xs font-bold text-rose-500">{aiStats.escalatedPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                            <motion.div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: '0%' }}
                              animate={{ width: `${aiStats.escalatedPercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-50 text-center">
                        <button
                          onClick={() => triggerToast('Seluruh percakapan WhatsApp & Telegram disinkronkan oleh AI.', 'info')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          Lihat detail interaksi AI Agent
                        </button>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="card p-6 bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between flex-1">
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-slate-800">Payment Summary</h2>
                      </div>

                      <div className="space-y-4">
                        {/* Paid */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-end text-xs font-medium">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">Lunas (Paid)</span>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-800 mr-2">{formatRupiah(paymentStats.paid)}</span>
                              <span className="font-bold text-emerald-500 text-[10px] bg-emerald-50 px-1 py-0.5 rounded-md">
                                {paymentStats.paidPercent}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: '0%' }}
                              animate={{ width: `${paymentStats.paidPercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Pending */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-end text-xs font-medium">
                            <span className="text-slate-400 font-bold uppercase text-[9px]">Menunggu (Pending)</span>
                            <div className="text-right">
                              <span className="font-mono font-bold text-slate-800 mr-2">{formatRupiah(paymentStats.pending)}</span>
                              <span className="font-bold text-amber-500 text-[10px] bg-amber-50 px-1 py-0.5 rounded-md">
                                {paymentStats.pendingPercent}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="bg-amber-400 h-full rounded-full"
                              style={{ width: '0%' }}
                              animate={{ width: `${paymentStats.pendingPercent}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-50 text-center">
                        <button
                          onClick={() => triggerToast('Laporan pembukuan diintegrasikan dengan modul keuangan Xendit.', 'info')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                        >
                          Lihat laporan pembayaran penuh
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* --- BOTTOM FOOTER SYSTEM STATUS ROW --- */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex flex-wrap gap-4 items-center justify-between text-xs shadow-sm shadow-slate-100">
          <div className="flex flex-wrap gap-6 items-center">
            {/* Main status indicator */}
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 mr-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="font-extrabold text-slate-800">System Status</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">All Systems Operational</p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-100 hidden md:block" />

            {/* Individual API statuses */}
            <div className="flex flex-wrap items-center gap-5 md:gap-7">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-500 font-semibold">
                  WhatsApp <span className="text-emerald-500 font-bold text-[10px] ml-1 block md:inline uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">Connected</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-500 font-semibold">
                  Xendit <span className="text-emerald-500 font-bold text-[10px] ml-1 block md:inline uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">Connected</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-500 font-semibold">
                  AI Agent <span className="text-emerald-500 font-bold text-[10px] ml-1 block md:inline uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">Operational</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-500 font-semibold">
                  Supabase <span className="text-emerald-500 font-bold text-[10px] ml-1 block md:inline uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">Connected</span>
                </span>
              </div>
            </div>
          </div>

          {/* Refresh controls */}
          <div className="flex items-center text-slate-400 text-right gap-3 self-stretch md:self-auto justify-between border-t border-slate-50 pt-3.5 md:pt-0 md:border-0">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terakhir Sinkron</p>
              <p className="font-mono font-bold text-slate-600 mt-0.5">Today, 9:41 AM</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-all cursor-pointer shadow-sm active:scale-90 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </main>

      {/* --- REUSABLE DETAIL MODAL --- */}
      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        targetId={modalTargetId}
        orders={orders}
      />
    </div>
  );
}
