import { useMemo, useState } from "react";
import kalisStorefront from "../../../assets/kalis_storefront.jpg";
import rinaAvatar from "../../../assets/rina_avatar.jpg";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Globe2,
  Info,
  Layers,
  List,
  MapPin,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Store,
  User,
  Users,
  X,
} from "lucide-react";

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  brand: "#F43F70",
  navy: "#11182E",
  violet: "#6956E8",
  green: "#16A34A",
  orange: "#EA7200",
  red: "#DC3545",
  blue: "#2563EB",
  gray50: "#F6F8FB",
  gray100: "#F2F4F8",
  gray200: "#E1E6EF",
  gray500: "#98A2B3",
  gray700: "#667085",
};

/* ─── Dummy data ───────────────────────────────────────────── */
const outlets = [
  {
    id: 1,
    name: "Samarinda Central",
    city: "Samarinda",
    region: "Kalimantan Timur",
    address: "Jl. Jenderal Sudirman No. 45, Samarinda Ulu",
    postalCode: "75123",
    manager: "Rina Pratiwi",
    phone: "0812-3456-7890",
    status: "Active",
    image: kalisStorefront,
    managerAvatar: rinaAvatar,
    channels: ["WhatsApp", "Telegram"],
    orders: 42,
    orderChange: 16,
    revenue: 8920000,
    revenueChange: 14,
    rating: 4.8,
    reviews: 128,
    staff: 12,
    sync: "10:15 AM",
    syncState: "online",
    avgPrep: 18,
    prepChange: -2,
    orderTrend: [22, 43, 29, 54, 28, 21, 55, 30, 25, 38, 20, 40, 30, 50, 30, 50, 42],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Mon - Fri", "08:00 - 22:00"],
      ["Saturday", "08:00 - 23:00"],
      ["Sunday", "08:00 - 22:00"],
    ],
    activity: [
      ["printer", "Printer offline", "2 min ago"],
      ["sync", "Menu sync completed", "15 min ago"],
      ["staff", "New staff invited", "1 hour ago"],
      ["price", "Price updated (12 items)", "3 hours ago"],
      ["promo", "Promotions published", "5 hours ago"],
    ],
  },
  {
    id: 2,
    name: "Tenggarong Riverside",
    city: "Tenggarong",
    region: "Kalimantan Timur",
    address: "Jl. Wolter Monginsidi No. 88",
    postalCode: "75511",
    manager: "Dewi Lestari",
    phone: "0813-2345-6789",
    status: "Needs Attention",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 25,
    orderChange: -8,
    revenue: 4350000,
    revenueChange: -4,
    rating: 4.2,
    reviews: 76,
    staff: 8,
    sync: "Yesterday",
    syncState: "warning",
    avgPrep: 24,
    prepChange: 3,
    orderTrend: [14, 20, 18, 29, 23, 17, 31, 22, 25, 19, 26, 23, 17, 22, 20, 24, 25],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Mon – Fri", "09:00 – 21:00"],
      ["Saturday", "09:00 – 22:00"],
      ["Sunday", "09:00 – 21:00"],
    ],
    activity: [
      ["warning", "POS sync delayed", "4 min ago"],
      ["warning", "Two products unavailable", "24 min ago"],
      ["success", "Staff shift updated", "1 hour ago"],
    ],
  },
  {
    id: 3,
    name: "Balikpapan Plaza",
    city: "Balikpapan",
    region: "Kalimantan Timur",
    address: "Balikpapan Plaza Lt. 2, Jl. Ahmad Yani",
    postalCode: "76114",
    manager: "Budi Santoso",
    phone: "0852-6677-8899",
    status: "Active",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 56,
    orderChange: 22,
    revenue: 11540000,
    revenueChange: 18,
    rating: 4.7,
    reviews: 203,
    staff: 15,
    sync: "9:48 AM",
    syncState: "online",
    avgPrep: 16,
    prepChange: -3,
    orderTrend: [33, 46, 42, 65, 50, 48, 70, 60, 56, 62, 55, 68, 71, 60, 63, 57, 56],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Mon – Fri", "08:00 – 22:00"],
      ["Saturday", "08:00 – 23:00"],
      ["Sunday", "08:00 – 22:00"],
    ],
    activity: [
      ["success", "Daily opening completed", "10 min ago"],
      ["info", "Stock count submitted", "40 min ago"],
    ],
  },
  {
    id: 4,
    name: "Bontang Point",
    city: "Bontang",
    region: "Kalimantan Timur",
    address: "Jl. Ahmad Yani No. 12",
    postalCode: "75313",
    manager: "Andi Wijaya",
    phone: "0811-2233-4455",
    status: "Coming Soon",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 0,
    orderChange: 0,
    revenue: 0,
    revenueChange: 0,
    rating: null,
    reviews: 0,
    staff: 6,
    sync: "2 days ago",
    syncState: "info",
    avgPrep: 0,
    prepChange: 0,
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Opening target", "July 2026"],
      ["Training", "In progress"],
    ],
    activity: [
      ["info", "Staff onboarding started", "1 day ago"],
      ["success", "Outlet profile completed", "2 days ago"],
    ],
  },
  {
    id: 5,
    name: "Sangatta Square",
    city: "Sangatta",
    region: "Kalimantan Timur",
    address: "Sangatta Square, Kutai Timur",
    postalCode: "75611",
    manager: "Nina Marlina",
    phone: "0813-5566-7788",
    status: "Needs Attention",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 18,
    orderChange: -12,
    revenue: 2810000,
    revenueChange: -6,
    rating: 3.9,
    reviews: 54,
    staff: 7,
    sync: "Yesterday",
    syncState: "warning",
    avgPrep: 28,
    prepChange: 6,
    orderTrend: [21, 24, 20, 26, 22, 18, 17, 19, 18, 20, 17, 16, 18, 19, 17, 18, 18],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Mon – Fri", "09:00 – 21:00"],
      ["Saturday", "09:00 – 22:00"],
      ["Sunday", "09:00 – 21:00"],
    ],
    activity: [
      ["warning", "Rating dropped below 4.0", "25 min ago"],
      ["warning", "Inventory needs review", "1 hour ago"],
    ],
  },
  {
    id: 6,
    name: "Berau Town Center",
    city: "Tanjung Redeb",
    region: "Kalimantan Timur",
    address: "Berau Town Center",
    postalCode: "77311",
    manager: "Fajar Rahman",
    phone: "0812-4477-6655",
    status: "Active",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 31,
    orderChange: 10,
    revenue: 5620000,
    revenueChange: 8,
    rating: 4.6,
    reviews: 112,
    staff: 9,
    sync: "10:02 AM",
    syncState: "online",
    avgPrep: 19,
    prepChange: -1,
    orderTrend: [18, 23, 25, 33, 28, 24, 37, 34, 31, 29, 33, 36, 30, 32, 31, 29, 31],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Mon – Fri", "08:00 – 22:00"],
      ["Saturday", "08:00 – 23:00"],
      ["Sunday", "08:00 – 22:00"],
    ],
    activity: [
      ["success", "Menu sync completed", "9 min ago"],
      ["info", "Promotion scheduled", "50 min ago"],
    ],
  },
  {
    id: 7,
    name: "Tarakan Harbor",
    city: "Tarakan",
    region: "Kalimantan Utara",
    address: "Kawasan Pelabuhan Tarakan, Kalimantan Utara",
    postalCode: "77111",
    manager: "Siti Aminah",
    phone: "0812-9988-7766",
    status: "Paused",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 5,
    orderChange: -20,
    revenue: 760000,
    revenueChange: -15,
    rating: 4.0,
    reviews: 21,
    staff: 4,
    sync: "3 days ago",
    syncState: "offline",
    avgPrep: 31,
    prepChange: 8,
    orderTrend: [12, 10, 8, 9, 6, 5, 5, 4, 5, 5, 4, 6, 5, 4, 5, 5, 5],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Status", "Temporarily paused"],
      ["Review date", "20 Jun 2026"],
    ],
    activity: [
      ["warning", "Outlet paused by administrator", "3 days ago"],
      ["info", "Maintenance checklist created", "3 days ago"],
    ],
  },
  {
    id: 8,
    name: "Nunukan Center",
    city: "Nunukan",
    region: "Kalimantan Utara",
    address: "Jl. Tien Soeharto No. 7",
    postalCode: "77481",
    manager: "Rudi Hartono",
    phone: "0813-7711-8899",
    status: "Coming Soon",
    image: kalisStorefront,
    managerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80",
    channels: ["WhatsApp", "Telegram"],
    orders: 0,
    orderChange: 0,
    revenue: 0,
    revenueChange: 0,
    rating: null,
    reviews: 0,
    staff: 5,
    sync: "4 days ago",
    syncState: "info",
    avgPrep: 0,
    prepChange: 0,
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    trendLabels: ["May 9", "May 10", "May 11", "May 12", "May 13", "May 14", "May 15"],
    hours: [
      ["Opening target", "August 2026"],
      ["Recruitment", "In progress"],
    ],
    activity: [
      ["info", "Manager account created", "2 days ago"],
      ["success", "Address verified", "4 days ago"],
    ],
  },
];

/* ─── Status styles ────────────────────────────────────────── */
const statusStyles = {
  Active: {
    badge: "bg-[#ECFDF5] text-[#15803D]",
    dot: "bg-[#16A34A]",
  },
  "Needs Attention": {
    badge: "bg-[#FFF1F2] text-[#DC3545]",
    dot: "bg-[#DC3545]",
  },
  "Coming Soon": {
    badge: "bg-[#F5F3FF] text-[#6956E8]",
    dot: "bg-[#6956E8]",
  },
  Paused: {
    badge: "bg-[#FFF7E8] text-[#EA7200]",
    dot: "bg-[#EA7200]",
  },
};

/* ─── Helpers ──────────────────────────────────────────────── */
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(value) {
  if (!value) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}

/* ─── Micro-components ─────────────────────────────────────── */
function Trend({ value, suffix = "%", inverse = false }) {
  if (!value || value === 0)
    return <span className="text-xs font-semibold text-[#98A2B3]">—</span>;
  const pos = value > 0;
  const isGood = inverse ? !pos : pos;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-xs font-bold",
        isGood ? "text-[#16A34A]" : "text-[#DC3545]"
      )}
    >
      {pos ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

function OutletImage({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cx(
          "grid place-items-center overflow-hidden bg-[linear-gradient(135deg,#11182E_0%,#6956E8_55%,#F43F70_100%)] select-none shrink-0",
          className
        )}
      >
        <div className="text-center text-white flex flex-col items-center">
          <Store size={22} className="mx-auto" />
          <span className="mt-1 line-clamp-2 text-[9px] font-semibold leading-tight max-w-[80px] text-center">
            {name}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={cx("object-cover shrink-0", className)}
      onError={() => setFailed(true)}
    />
  );
}

function StatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.Active;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold",
        style.badge
      )}
    >
      {status}
    </span>
  );
}

function ChannelIcon({ channel, withLabel = false }) {
  const map = {
    WhatsApp: { icon: MessageCircle, bgLight: "bg-emerald-50 text-emerald-600", bgSolid: "bg-[#16A34A] text-white", label: "WhatsApp" },
    Telegram: { icon: Send, bgLight: "bg-sky-50 text-sky-600", bgSolid: "bg-[#2563EB] text-white", label: "Telegram" },
    Website: { icon: Globe2, bgLight: "bg-violet-50 text-violet-600", bgSolid: "bg-[#6956E8] text-white", label: "Website" },
    POS: { icon: ShoppingBag, bgLight: "bg-slate-100 text-slate-600", bgSolid: "bg-[#667085] text-white", label: "POS System" },
  };

  if (channel === "POS" && !withLabel) {
    return (
      <span className="inline-flex h-5 items-center justify-center rounded-md bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600 shrink-0 select-none">
        POS
      </span>
    );
  }

  const current = map[channel] ?? map.Website;
  const Icon = current.icon;

  if (withLabel) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={cx(
            "inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0",
            current.bgSolid
          )}
        >
          <Icon size={11} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold text-[#11182E] leading-tight">{current.label}</p>
          <p className="m-0 text-[10px] text-[#16A34A] font-semibold mt-0.5">Connected</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={cx(
        "inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0",
        current.bgLight
      )}
      title={channel}
    >
      <Icon size={12} strokeWidth={2.5} />
    </span>
  );
}

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
  return (
    <div className="relative min-w-0">
      <span className="sr-only">{label}</span>
      {Icon && (
        <Icon
          size={14}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]"
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "h-10 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white pr-9 text-sm font-bold text-[#11182E] outline-none transition focus:border-[#F43F70] focus:ring-2 focus:ring-[#F43F70]/10",
          Icon ? "pl-9" : "pl-3.5"
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, change, tone }) {
  const tones = {
    green: { icon: "bg-[#ECFDF5] text-[#15803D]" },
    brand: { icon: "bg-[#FFF1F2] text-[#DC3545]" },
    violet: { icon: "bg-[#F5F3FF] text-[#6956E8]" },
    orange: { icon: "bg-[#FFF7E8] text-[#EA7200]" },
  };
  return (
    <article className="rounded-2xl border border-[#E1E6EF] bg-white p-3.5 shadow-[0_2px_12px_rgba(17,24,46,0.04)] flex items-center gap-3.5">
      <span
        className={cx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-full",
          tones[tone].icon
        )}
      >
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[11px] font-bold text-[#667085] leading-tight">{label}</p>
        <p className="m-0 mt-0.5 text-2xl font-bold tracking-tight text-[#11182E] leading-none">{value}</p>
        <div className="mt-1 flex items-center gap-1">
          <Trend value={change} />
          <span className="text-[10px] font-semibold text-[#98A2B3] leading-none">vs last month</span>
        </div>
      </div>
    </article>
  );
}

/* ─── CardMetric: stats row inside outlet card ─────────────── */
function CardMetric({ label, value, trend, detail, dot, star }) {
  const dotClass = {
    online: "bg-[#16A34A]",
    warning: "bg-[#EA7200]",
    offline: "bg-[#DC3545]",
    info: "bg-[#6956E8]",
  };
  return (
    <div className="min-w-0 px-2.5 first:pl-0 last:pr-0">
      <p className="m-0 truncate text-[11px] font-semibold text-[#98A2B3]">{label}</p>
      <div className="mt-0.5 flex min-w-0 items-center gap-1 flex-wrap">
        <span className="truncate text-xs font-extrabold text-[#11182E]">{value}</span>
        {star && (
          <span className="text-amber-500 font-bold text-xs select-none">★</span>
        )}
        {typeof trend === "number" && trend !== 0 && <Trend value={trend} />}
        {detail && <span className="text-[11px] font-semibold text-[#98A2B3]">{detail}</span>}
        {dot && (
          <span
            className={cx("h-1.5 w-1.5 shrink-0 rounded-full ml-0.5", dotClass[dot])}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Outlet card (grid item) ──────────────────────────────── */
function OutletCard({ outlet, selected, onSelect }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(outlet)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(outlet);
        }
      }}
      className={cx(
        "w-full min-w-0 box-border rounded-2xl border p-3 text-left transition-all duration-150 outline-none cursor-pointer",
        "hover:border-[#F43F70]/40 hover:shadow-[0_8px_28px_rgba(17,24,46,0.07)]",
        selected
          ? "border-[#F43F70] bg-[#FFF5F7]/30 shadow-[0_0_0_1px_#F43F70,0_4px_20px_rgba(244,63,112,0.06)]"
          : "border-[#E1E6EF] bg-white shadow-[0_2px_8px_rgba(17,24,46,0.03)]"
      )}
    >
      {/* Top: image + info + actions */}
      <div className="flex gap-3">
        <OutletImage
          src={outlet.image}
          name={outlet.name}
          className="h-[60px] w-[72px] rounded-xl border border-[#E1E6EF]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="m-0 truncate text-sm font-bold text-[#11182E] tracking-tight">{outlet.name}</h3>
              <p className="m-0 mt-0.5 truncate text-xs text-[#667085] font-semibold">
                {outlet.city}, {outlet.region}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusBadge status={outlet.status} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#F2F4F8] hover:text-[#667085] transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Channel icons + manager */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {outlet.channels.map((ch) => (
                <ChannelIcon key={ch} channel={ch} />
              ))}
            </div>
            <span className="h-3 w-px bg-[#E1E6EF]" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085]">
              <img
                src={outlet.managerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(outlet.manager)}&background=11182e&color=ffffff&size=32`}
                alt={outlet.manager}
                className="h-4.5 w-4.5 rounded-full object-cover shrink-0 border border-[#E1E6EF]"
              />
              {outlet.manager}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="mt-2.5 grid grid-cols-5 divide-x divide-[#E1E6EF] border-t border-[#E1E6EF] pt-2.5">
        <CardMetric label="Today's Orders" value={outlet.orders} trend={outlet.orderChange} />
        <CardMetric label="Revenue" value={money(outlet.revenue)} trend={outlet.revenueChange} />
        <CardMetric
          label="Rating"
          value={outlet.rating ? `${outlet.rating}` : "—"}
          detail={outlet.reviews ? `(${outlet.reviews})` : ""}
          star={!!outlet.rating}
        />
        <CardMetric label="Staff" value={outlet.staff} />
        <CardMetric label="Last Sync" value={outlet.sync} dot={outlet.syncState} />
      </div>
    </div>
  );
}

/* ─── Mini SVG line chart ──────────────────────────────────── */
function MiniLineChart({ values, labels }) {
  const data = values.slice(-7);
  const W = 380;
  const H = 145;
  const PAD_T = 20;
  const PAD_B = 25;
  const PAD_L = 32; // Fit Y-axis text
  const PAD_R = 20;

  const max = 80;
  const min = 0;
  const range = max - min;

  const pts = data.map((v, i) => {
    const x = PAD_L + (i / 6) * (W - PAD_L - PAD_R);
    const y = H - PAD_B - ((v - min) / range) * (H - PAD_T - PAD_B);
    return { x, y, val: v };
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaD = pts.length > 0
    ? `${pathD} L ${pts[pts.length - 1].x} ${H - PAD_B} L ${pts[0].x} ${H - PAD_B} Z`
    : "";
  const lastPt = pts[pts.length - 1];

  const yTicks = [80, 60, 40, 20, 0];

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-white py-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Order trend">
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6956E8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6956E8" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {yTicks.map((val) => {
          const ratio = (val - min) / range;
          const y = H - PAD_B - ratio * (H - PAD_T - PAD_B);
          return (
            <g key={val}>
              <text
                x={PAD_L - 8}
                y={y + 3.5}
                fill="#98A2B3"
                fontSize="9.5"
                fontWeight="600"
                textAnchor="end"
              >
                {val}
              </text>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke="#E1E6EF"
                strokeWidth="0.8"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}

        {areaD && (
          <path
            d={areaD}
            fill="url(#chartAreaGradient)"
          />
        )}

        <path
          d={pathD}
          fill="none"
          stroke={C.violet}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="white"
            stroke={C.violet}
            strokeWidth="2.5"
          />
        ))}

        {lastPt && (
          <g>
            <rect
              x={lastPt.x - 12}
              y={lastPt.y - 25}
              width="24"
              height="16"
              rx="8"
              fill={C.violet}
            />
            <text
              x={lastPt.x}
              y={lastPt.y - 14}
              fill="white"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
            >
              {lastPt.val}
            </text>
            <path
              d={`M ${lastPt.x - 3} ${lastPt.y - 9} L ${lastPt.x + 3} ${lastPt.y - 9} L ${lastPt.x} ${lastPt.y - 5} Z`}
              fill={C.violet}
            />
          </g>
        )}

        {labels.map((lbl, i) => {
          const x = PAD_L + (i / 6) * (W - PAD_L - PAD_R);
          return (
            <text
              key={lbl}
              x={x}
              y={H - 6}
              fill="#98A2B3"
              fontSize="9.5"
              fontWeight="600"
              textAnchor="middle"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Activity icon ────────────────────────────────────────── */
function ActivityIcon({ type }) {
  const map = {
    printer: { icon: AlertTriangle, className: "bg-red-50 text-[#DC3545]" },
    sync: { icon: CheckCircle2, className: "bg-emerald-50 text-[#16A34A]" },
    staff: { icon: User, className: "bg-purple-50 text-[#6956E8]" },
    price: { icon: Info, className: "bg-blue-50 text-[#2563EB]" },
    promo: { icon: Megaphone, className: "bg-amber-50 text-[#EA7200]" },
  };
  const cur = map[type] ?? map.price;
  const Icon = cur.icon;
  return (
    <span
      className={cx(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full",
        cur.className
      )}
    >
      <Icon size={13} />
    </span>
  );
}

function DetailMetric({ label, value, trend, suffix = "%", inverse = false }) {
  return (
    <article className="rounded-2xl border border-[#E1E6EF] bg-white px-2 py-3 shadow-[0_1px_3px_rgba(17,24,46,0.02)]">
      <p className="m-0 text-xs font-bold text-[#667085] leading-none">{label}</p>
      <p className="m-0 mt-2 text-sm font-extrabold text-[#11182E] tracking-tight leading-none whitespace-nowrap" title={value}>
        {value}
      </p>
      <div className="mt-2.5 flex items-center leading-none">
        <Trend value={trend} suffix={suffix} inverse={inverse} />
      </div>
    </article>
  );
}

/* ─── Right Detail Panel ───────────────────────────────────── */
function DetailPanel({ outlet, onClose, mobile = false }) {
  if (!outlet) return null;

  return (
    <aside
      className={cx(
        "bg-white flex flex-col",
        mobile
          ? "fixed inset-y-0 right-0 z-50 w-full max-w-[420px] shadow-2xl"
          : "h-full overflow-hidden"
      )}
    >
      {/* Sticky Header */}
      <header className="shrink-0 bg-white z-10">
        {/* Name + status + close */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="truncate text-lg font-bold text-[#11182E] tracking-tight">{outlet.name}</h2>
            <StatusBadge status={outlet.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="grid h-8 w-8 shrink-0 place-items-center text-[#98A2B3] transition hover:text-[#11182E]"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-6 space-y-4">
        {/* Image + manager + address block */}
        <div className="grid grid-cols-[105px_1fr] gap-5">
          <OutletImage
            src={outlet.image}
            name={outlet.name}
            className="h-[105px] w-[105px] rounded-2xl border border-[#E1E6EF] shadow-[0_1px_3px_rgba(17,24,46,0.04)]"
          />
          <div className="min-w-0 space-y-2.5">
            <div>
              <p className="m-0 mb-1.5 text-xs font-bold text-[#667085]">Outlet Manager</p>
              <div className="flex items-center gap-3">
                <img
                  src={outlet.managerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(outlet.manager)}&background=11182e&color=ffffff&size=48`}
                  alt={outlet.manager}
                  className="h-8 w-8 rounded-full object-cover shrink-0 border border-[#E1E6EF]"
                />
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-bold text-[#11182E] leading-tight">{outlet.manager}</p>
                  <p className="m-0 text-xs text-[#667085] mt-0.5 font-semibold flex items-center gap-1">
                    <Phone size={11} className="text-[#98A2B3]" />
                    {outlet.phone}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="m-0 mb-1.5 text-xs font-bold text-[#667085]">Address</p>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0 text-[#98A2B3]" />
                <p className="m-0 text-xs leading-relaxed text-[#667085] font-semibold flex-1 min-w-0">
                  {outlet.address}, {outlet.city}, {outlet.region} {outlet.postalCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected channels */}
        <section className="border-t border-b border-[#F2F4F8] py-4">
          <h3 className="text-sm font-bold text-[#11182E]">Connected Channels</h3>
          <div className="mt-3 flex items-center gap-6">
            {outlet.channels.map((ch) => (
              <ChannelIcon key={ch} channel={ch} withLabel />
            ))}
          </div>
        </section>

        {/* 3-metric grid */}
        <div className="grid grid-cols-3 gap-3">
          <DetailMetric
            label="Today's Orders"
            value={outlet.orders}
            trend={outlet.orderChange}
          />
          <DetailMetric
            label="Revenue (Today)"
            value={money(outlet.revenue)}
            trend={outlet.revenueChange}
          />
          <DetailMetric
            label="Avg. Prep Time"
            value={outlet.avgPrep ? `${outlet.avgPrep} min` : "—"}
            trend={outlet.prepChange}
            suffix=" min"
            inverse={true}
          />
        </div>

        {/* Chart */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#11182E] tracking-tight">Orders (Last 7 Days)</h3>
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-[#E1E6EF] px-3 text-xs font-semibold text-[#11182E] hover:bg-[#F6F8FB] transition-colors"
            >
              Orders <ChevronDown size={13} />
            </button>
          </div>
          <MiniLineChart values={outlet.orderTrend} labels={outlet.trendLabels} />
        </section>

        {/* Operating hours + Activity side-by-side */}
        <div className="grid grid-cols-[43%_57%] gap-3">
          <section className="rounded-2xl border border-[#E1E6EF] p-2 bg-white shadow-[0_1px_3px_rgba(17,24,46,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#11182E] tracking-tight">Operating Hours</h3>
                <button
                  type="button"
                  className="text-xs font-bold text-[#6956E8] hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="mt-3.5 space-y-2">
                {outlet.hours.map(([day, time]) => (
                  <div key={day} className="flex items-center justify-between gap-1 text-xs tracking-tight">
                    <span className="text-[#667085] font-semibold">{day}</span>
                    <span className="font-bold text-[#11182E] whitespace-nowrap">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E1E6EF] p-2 bg-white shadow-[0_1px_3px_rgba(17,24,46,0.02)]">
            <h3 className="text-sm font-extrabold text-[#11182E] tracking-tight">Recent Activity</h3>
            <div className="mt-3.5 space-y-2.5">
              {outlet.activity.slice(0, 5).map(([type, label, time]) => (
                <div key={`${label}-${time}`} className="flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    <ActivityIcon type={type} />
                    <span className="font-bold text-[#11182E] text-xs tracking-tight truncate">{label}</span>
                  </div>
                  <span className="text-[#98A2B3] shrink-0 font-semibold text-[10px] whitespace-nowrap">{time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2.5 border-t border-[#E1E6EF] pt-4">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F43F70] px-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(244,63,112,0.22)] transition hover:bg-[#e62e63] active:scale-[0.98]"
          >
            View Details <ExternalLink size={14} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#D6DCE8] bg-white px-2 text-sm font-bold text-[#11182E] transition hover:bg-[#F2F4F8] active:scale-[0.98]"
          >
            <Edit3 size={14} /> Edit Outlet
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#6956E8] px-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(105,86,232,0.22)] transition hover:bg-[#5e49da] active:scale-[0.98]"
          >
            <List size={14} /> Open Orders
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function OutletsPage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [status, setStatus] = useState("All Statuses");
  const [channel, setChannel] = useState("All Channels");
  const [activeTab, setActiveTab] = useState("All");
  const [sort, setSort] = useState("Default");
  const [selectedOutlet, setSelectedOutlet] = useState(outlets[0]);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const counts = useMemo(
    () => ({
      All: outlets.length,
      Active: outlets.filter((o) => o.status === "Active").length,
      "Needs Attention": outlets.filter((o) => o.status === "Needs Attention").length,
      "Coming Soon": outlets.filter((o) => o.status === "Coming Soon").length,
      Paused: outlets.filter((o) => o.status === "Paused").length,
    }),
    []
  );

  const filteredOutlets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = outlets.filter((o) => {
      if (q && !o.name.toLowerCase().includes(q) && !o.city.toLowerCase().includes(q) && !o.manager.toLowerCase().includes(q)) return false;
      if (region !== "All Regions" && o.region !== region) return false;
      if (status !== "All Statuses" && o.status !== status) return false;
      if (channel !== "All Channels" && !o.channels.includes(channel)) return false;
      if (activeTab !== "All" && o.status !== activeTab) return false;
      return true;
    });
    if (sort === "Default") return result;
    return [...result].sort((a, b) => {
      if (sort === "A–Z") return a.name.localeCompare(b.name);
      if (sort === "Z–A") return b.name.localeCompare(a.name);
      if (sort === "Orders") return b.orders - a.orders;
      if (sort === "Revenue") return b.revenue - a.revenue;
      return 0;
    });
  }, [search, region, status, channel, activeTab, sort]);

  const chooseOutlet = (outlet) => {
    setSelectedOutlet(outlet);
    setMobileDetailOpen(true);
  };

  const exportCsv = () => {
    const header = ["Outlet", "City", "Region", "Status", "Manager", "Orders", "Revenue", "Rating", "Staff", "Last Sync"];
    const rows = filteredOutlets.map((o) => [o.name, o.city, o.region, o.status, o.manager, o.orders, o.revenue, o.rating ?? "", o.staff, o.sync]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kalis-outlets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F6F8FB] text-[#11182E] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)]">
      {/* Desktop main content list layout */}
      <div
        className={cx(
          "flex-1 min-w-0 h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 transition-[margin] duration-200",
          selectedOutlet ? "xl:mr-[440px]" : ""
        )}
      >
        <div className="mx-auto max-w-[1300px] pb-12">

          {/* ── Page Header ── */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col">
              <h1 className="m-0 text-3xl font-extrabold tracking-tight text-[#11182E] leading-none">Outlets</h1>
              <p className="m-0 mt-1 text-sm text-[#667085] font-semibold leading-none">
                Manage all connected outlets across your marketplace
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#D6DCE8] bg-white px-4 text-sm font-bold text-[#11182E] transition hover:bg-[#F2F4F8] active:scale-[0.98]"
              >
                <Download size={16} /> Export
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#F43F70] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,63,112,0.24)] transition hover:bg-[#e62e63] active:scale-[0.98]"
              >
                <Plus size={18} /> Add Outlet
              </button>
            </div>
          </header>

          {/* ── Filter bar ── */}
          <section className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2.5 flex-1 min-w-0">
              <div className="w-[160px] shrink-0">
                <FilterSelect
                  label="Region"
                  value={region}
                  onChange={setRegion}
                  options={["All Regions", "Kalimantan Timur", "Kalimantan Utara"]}
                  icon={Globe2}
                />
              </div>
              <div className="w-[160px] shrink-0">
                <FilterSelect
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={["All Statuses", "Active", "Needs Attention", "Coming Soon", "Paused"]}
                  icon={MessageCircle}
                />
              </div>
              <div className="w-[160px] shrink-0">
                <FilterSelect
                  label="Channel"
                  value={channel}
                  onChange={setChannel}
                  options={["All Channels", "WhatsApp", "Telegram"]}
                  icon={Layers}
                />
              </div>
              <label className="relative flex-1 min-w-[240px]">
                <span className="sr-only">Search outlet</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search outlet name, city, manager..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="h-10 w-full rounded-xl border border-[#E1E6EF] bg-white pl-10 pr-4 text-sm text-[#11182E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#F43F70] focus:ring-2 focus:ring-[#F43F70]/10"
                />
              </label>
            </div>
          </section>

          {/* ── Info bar ── */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-[#E1E6EF] bg-[#F6F8FB]/50 px-4 py-2 text-xs text-[#667085]">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span>Showing: <strong className="text-[#11182E]">{activeTab === "All" ? "All Outlets" : activeTab}</strong></span>
              <span className="text-[#D6DCE8]">•</span>
              <span>Region: <strong className="text-[#11182E]">{region === "All Regions" ? "All" : region}</strong></span>
              <span className="text-[#D6DCE8]">•</span>
              <span>Last updated: 10:25 AM</span>
            </div>
            <button
              type="button"
              className="grid h-6 w-6 place-items-center rounded-lg text-[#98A2B3] hover:bg-[#E1E6EF] hover:text-[#667085] transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* ── Summary cards ── */}
          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={Store} label="Total Outlets" value={counts.All} change={12} tone="green" />
            <SummaryCard icon={CheckCircle2} label="Active" value={counts.Active} change={15} tone="green" />
            <SummaryCard icon={AlertTriangle} label="Needs Attention" value={counts["Needs Attention"]} change={20} tone="brand" />
            <SummaryCard icon={Clock3} label="Coming Soon" value={counts["Coming Soon"]} change={33} tone="violet" />
          </section>

          {/* ── Tabs + Sort ── */}
          <div className="mt-5 flex items-center justify-between border-b border-[#E1E6EF]">
            <div className="flex min-w-0 gap-6 overflow-x-auto pb-px">
              {Object.entries(counts).map(([tab, count]) => {
                const isActive = activeTab === tab;
                const badgeStyles = {
                  All: "bg-[#FFF1F5] text-[#F43F70]",
                  Active: "bg-[#ECFDF5] text-[#15803D]",
                  "Needs Attention": "bg-[#FFF1F2] text-[#DC3545]",
                  "Coming Soon": "bg-[#F5F3FF] text-[#6956E8]",
                  Paused: "bg-[#FFF7E8] text-[#EA7200]",
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cx(
                      "inline-flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-bold transition-all duration-150 outline-none",
                      isActive
                        ? "border-[#F43F70] text-[#F43F70]"
                        : "border-transparent text-[#667085] hover:border-[#E1E6EF] hover:text-[#11182E]"
                    )}
                  >
                    {tab}
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        badgeStyles[tab] || "bg-[#F2F4F8] text-[#667085]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-2 flex items-center gap-1 text-sm text-[#667085] font-semibold">
              <span className="text-xs font-semibold text-[#98A2B3]">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-sm font-bold text-[#11182E] outline-none cursor-pointer hover:text-[#F43F70] transition-colors pr-2"
              >
                <option value="Default">Default</option>
                <option value="A–Z">A–Z</option>
                <option value="Z–A">Z–A</option>
                <option value="Orders">Orders</option>
                <option value="Revenue">Revenue</option>
              </select>
            </div>
          </div>

          {/* ── Outlet grid ── */}
          <section className="mt-3">
            {filteredOutlets.length > 0 ? (
              <div className="grid gap-3 2xl:grid-cols-2">
                {filteredOutlets.map((o) => (
                  <OutletCard
                    key={o.id}
                    outlet={o}
                    selected={selectedOutlet?.id === o.id}
                    onSelect={chooseOutlet}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[#D6DCE8] bg-white p-8 text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F43F70]/10 text-[#F43F70]">
                    <Search size={24} />
                  </span>
                  <h2 className="mt-4 text-lg font-bold text-[#11182E]">No outlets found</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Try changing the filters or search keyword.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Bottom info ── */}
          <div className="mt-4 flex items-center justify-between text-xs text-[#667085]">
            <span>
              Showing <strong className="text-[#11182E]">{filteredOutlets.length}</strong> of{" "}
              <strong className="text-[#11182E]">{outlets.length}</strong> outlets
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-semibold hover:text-[#11182E] transition-colors"
            >
              Last updated: 10:25 AM <RefreshCw size={12} />
            </button>
          </div>

        </div>
      </div>

      {/* ── Desktop fixed sidebar ── */}
      {selectedOutlet && (
        <div className="fixed inset-y-0 right-0 z-[80] hidden xl:flex flex-col w-[440px] h-[100dvh] bg-white border-l border-[#E1E6EF] overflow-hidden shadow-[-4px_0_18px_rgba(17,24,46,0.04)]">
          <DetailPanel outlet={selectedOutlet} onClose={() => setSelectedOutlet(null)} />
        </div>
      )}

      {/* ── Mobile slide-over ── */}
      {mobileDetailOpen && (
        <div className="xl:hidden">
          <button
            type="button"
            aria-label="Close overlay"
            className="fixed inset-0 z-40 bg-[#11182E]/40 backdrop-blur-[2px]"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] h-[100dvh] bg-white flex flex-col shadow-2xl">
            <DetailPanel outlet={selectedOutlet} mobile onClose={() => setMobileDetailOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
