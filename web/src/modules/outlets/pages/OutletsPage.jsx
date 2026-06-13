import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";

const COLORS = {
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
const outlets = [
  {
    id: 1,
    name: "Samarinda Central",
    city: "Samarinda",
    region: "Kalimantan Timur",
    address: "Jl. Jenderal Sudirman No. 45, Samarinda Ulu, Samarinda",
    manager: "Rina Pratiwi",
    phone: "0812-3456-7890",
    status: "Active",
    image: "/images/outlets/samarinda-central.jpg",
    channels: ["WhatsApp", "Telegram", "Website", "POS"],
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
    orderTrend: [22, 43, 29, 54, 28, 21, 55, 30, 25],
    hours: [
      ["Mon – Fri", "08:00 – 22:00"],
      ["Saturday", "08:00 – 23:00"],
      ["Sunday", "08:00 – 22:00"],
    ],
    activity: [
      ["warning", "Printer offline", "2 min ago"],
      ["success", "Menu sync completed", "15 min ago"],
      ["info", "New staff invited", "1 hour ago"],
      ["info", "Price updated (12 items)", "3 hours ago"],
      ["warning", "Promotions published", "5 hours go"],
    ],
  },
  {
    id: 2,
    name: "Tenggarong Riverside",
    city: "Tenggarong",
    region: "Kalimantan Timur",
    address: "Jl. Wolter Monginsidi No. 88, Tenggarong",
    manager: "Dewi Lestari",
    phone: "0813-2345-6789",
    status: "Needs Attention",
    image: "/images/outlets/tenggarong-riverside.jpg",
    channels: ["WhatsApp", "Telegram", "Website", "POS"],
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
    orderTrend: [14, 20, 18, 29, 23, 17, 31, 22, 25],
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
    address: "Balikpapan Plaza, Balikpapan",
    manager: "Budi Santoso",
    phone: "0852-6677-8899",
    status: "Active",
    image: "/images/outlets/balikpapan-plaza.jpg",
    channels: ["WhatsApp", "Telegram", "Website", "POS"],
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
    orderTrend: [33, 46, 42, 65, 50, 48, 70, 60, 56],
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
    address: "Jl. Ahmad Yani, Bontang",
    manager: "Andi Wijaya",
    phone: "0811-2233-4455",
    status: "Coming Soon",
    image: "/images/outlets/bontang-point.jpg",
    channels: ["WhatsApp", "Telegram", "Website"],
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
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
    manager: "Nina Marlina",
    phone: "0813-5566-7788",
    status: "Needs Attention",
    image: "/images/outlets/sangatta-square.jpg",
    channels: ["WhatsApp", "Telegram", "Website", "POS"],
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
    orderTrend: [21, 24, 20, 26, 22, 18, 17, 19, 18],
    hours: [
      ["Mon – Fri", "09:00 – 21:00"],
      ["Saturday", "09:00 – 22:00"],
      ["Sunday", "09:00 – 21:00"],
    ],
    activity: [
      ["warning", "Rating dropped below 4.0", "25 min ago"],
      ["warning", "Inventory needs review", "1 hour go"],
    ],
  },
  {
    id: 6,
    name: "Berau Town Center",
    city: "Tanjung Redeb",
    region: "Kalimantan Timur",
    address: "Berau Town Center, Tanjung Redeb",
    manager: "Fajar Rahman",
    phone: "0812-4477-6655",
    status: "Active",
    image: "/images/outlets/berau-town-center.jpg",
    channels: ["WhatsApp", "Telegram", "Website"],
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
    orderTrend: [18, 23, 25, 33, 28, 24, 37, 34, 31],
    hours: [
      ["Mon – Fri", "08:00 – 22:00"],
      ["Saturday", "08:00 – 23:00"],
      ["Sunday", "08:00 – 22:00"],
    ],
    activity: [
      ["success", "Menu sync completed", "9 min go"],
      ["info", "Promotion scheduled", "50 min ago"],
    ],
  },
  {
    id: 7,
    name: "Tarakan Harbor",
    city: "Tarakan",
    region: "Kalimantan Utara",
    address: "Kawasan Pelabuhan Tarakan",
    manager: "Siti Aminah",
    phone: "0812-9988-7766",
    status: "Paused",
    image: "/images/outlets/tarakan-harbor.jpg",
    channels: ["WhatsApp", "Telegram", "POS"],
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
    orderTrend: [12, 10, 8, 9, 6, 5, 5, 4, 5],
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
    address: "Jl. Tien Soeharto, Nunukan",
    manager: "Rudi Hartono",
    phone: "0813-7711-8899",
    status: "Coming Soon",
    image: "/images/outlets/nunukan-center.jpg",
    channels: ["WhatsApp", "Website"],
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
    orderTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
const statusStyles = {
  Active: {
    badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-[#16A34A]",
  },
  "Needs Attention": {
    badge: "border border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-[#D548DE",
  },
  "Coming Soon": {
    badge: "border border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-[#6956E8]",
  },
  Paused: {
    badge: "border border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-[#EA7200]",
  },
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function merge(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatRevenue(value) {
  if (!value) return "Rp0";
  return currency.format(value).replace(/\s/g, "");
}
function Trend({ value, suffix = "%" }) {
  if (value === 0) {
    return <span className="text-xs font-medium text-[#98A2B3]">—</span>;
  }

  const positive = value > 0;
  return (
    <span
      className={merge(
        "inline-flex items-center gap-1 text-xs font-semibold",
        positive ? "text-[#16A34A]" : "text-[#DC3545]",
      )}
    >
      {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
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
        className={merge(
          "grid place-items-center overflow-hidden bg-[linear-gradient(135deg,#11182E_0%,#6956E8_58%,#F43F70_100%)]",
          className,
        )}
      >
        <div className="text-center text-white">
          <Store className="mx-auto mb-1" size={26} />
          <span className="text-[10px] font-semibold tracking-wide">
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
      className={merge("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

function StatusBadge({ status }) {
  const style = statusStyles[status] ?? statusStyles.Active;

  return (
    <span
      className={merge(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
        style.badge,
      )}
    >
      <span className={merge("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}

function ChannelIcon({ channel, withLabel = false }) {
  const map = {
    WhatsApp: {
      icon: MessageCircle,
      className: "bg-emerald-50 text-emerald-600",
    },
    Telegram: { icon: Send, className: "bg-sky-50 text-sky-600" },
    Website: { icon: Globe2, className: "bg-violet-50 text-violet-600" },
    POS: { icon: ShoppingBag, className: "bg-slate-100 text-slate-600" },
  };

  const current = map[channel] ?? map.Website;
  const Icon = current.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={merge(
          "inline-flex h-6 w-6 items-center justify-center rounded-full",
          current.className,
        )}
        title={channel}
      >
        <Icon size={13} strokeWidth={2.2} />
      </span>
      {withLabel && (
        <span className="text-xs font-medium text-[#667085]">{channel}</span>
      )}
    </span>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-[#E1E6EF] bg-white px-4 pr-10 text-sm font-semibold text-[#11182E] outline-none transition focus:border-[#F43F70] focus:ring-4 focus:ring-[#F43F70]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
      />
    </label>
  );
}
function SummaryCard({ icon: Icon, label, value, change, tone }) {
  const toneClasses = {
    green: "bg-emerald-50 text-emerald-600",
    brand: "bg-rose-50 text-[#F43F70]",
    violet: "bg-violet-50 text-[#6956E8]",
    orange: "bg-orange-50 text-[#EA7200]",
  };

  return (
    <article className="rounded-2xl border border-[#E1E6EF] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,46,0.04)]">
      <div className="flex items-center gap-3">
        <span
          className={merge(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            toneClasses[tone],
          )}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#667085]">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#11182E]">
            {value}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-[#F2F4F8] pt-3">
        <Trend value={change} />
        <span className="text-xs text-[#98A2B3]">vs last month</span>
      </div>
    </article>
  );
}

function OutletCard({ outlet, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(outlet)}
      className={merge(
        "w-full rounded-2xl border bg-white p-4 text-left shadow-[0_8px_30px_rgba(17,24,46,0.035)] transition",
        "hover:-translate-y-0.5 hover:border-[#F43F70]/40 hover:shadow-[0_16px_36px_rgba(17,24,46,0.08)]",
        selected
          ? "border-[#F43F70] ring-4 ring-[#F43F70]/8"
          : "border-[#E1E6EF]",
      )}
    >
      <div className="flex gap-3">
        <OutletImage
          src={outlet.image}
          name={outlet.name}
          className="h-[72px] w-[92px] shrink-0 rounded-xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-[#11182E]">
                {outlet.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-[#667085]">
                {outlet.city}, {outlet.region}
              </p>
            </div>

            <div className="flex shrink-0 items-start gap-2">
              <StatusBadge status={outlet.status} />
              <MoreVertical size={18} className="mt-1 text-[#667085]" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {outlet.channels.map((channel) => (
              <ChannelIcon key={channel} channel={channel} />
            ))}
            <span className="mx-1 h-4 w-px bg-[#E1E6EF]" />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#667085]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#11182E] text-[9px] font-bold text-white">
                {outlet.manager
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              {outlet.manager}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 divide-x divide-[#E1E6EF] border-t border-[#E1E6EF] pt-3">
        <CardMetric
          label="Today's Orders"
          value={outlet.orders}
          trend={outlet.orderChange}
        />
        <CardMetric
          label="Revenue"
          value={formatRevenue(outlet.revenue)}
          trend={outlet.revenueChange}
        />
        <CardMetric
          label="Rating"
          value={outlet.rating ? `${outlet.rating} ★` : "—"}
          detail={outlet.reviews ? `(${outlet.reviews})` : ""}
        />
        <CardMetric label="Staff" value={outlet.staff} />
        <CardMetric
          label="Last Sync"
          value={outlet.sync}
          dot={outlet.syncState}
        />
      </div>
    </button>
  );
}

function CardMetric({ label, value, trend, detail, dot }) {
  const dotClass = {
    online: "bg-[#16A34A]",
    warning: "bg-[#EA7200]",
    offline: "bg-[#DC3545]",
    info: "bg-[#6956E8]",
  };

  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <p className="truncate text-[10px] font-medium text-[#98A2B3]">
        {label}
      </p>
      <div className="mt-1 flex min-w-0 items-center gap-1.5">
        <span className="truncate text-xs font-bold text-[#11182E]">
          {value}
        </span>
        {typeof trend === "number" && trend !== 0 && <Trend value={trend} />}
        {detail && (
          <span className="truncate text-[10px] text-[#98A2B3]">
            {detail}
          </span>
        )}
        {dot && (
          <span
            className={merge(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              dotClass[dot],
            )}
          />
        )}
      </div>
    </div>
  );
}
function MiniLineChart({ values }) {
  const width = 420;
  const height = 128;
  const padding = 14;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const points = values
    .map((value, index) => {
      const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-3 overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(105,86,232,0.08),rgba(105,86,232,0))]">
      <svg
        viewBox={0 0 ${width} ${height}}
        className="h-32 w-full"
        role="img"
        aria-label="Orders during the last seven days"
      >
        {[28, 60, 92].map((y) => (
          <line
            key={y}
            x1="0"
            x2={width}
            y1={y}
            y2={y}
            stroke="#E1E6EF"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke={COLORS.violet}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((value, index) => {
          const [x, y] = points.split(" ")[index].split(",");
          return (
            <circle
              key={`${value}-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill="white"
              stroke={COLORS.violet}
              strokeWidth="3"
            />
          );
        })}
      </svg>
    </div>
  );
}

function ActivityIcon({ type }) {
  const map = {
    warning: {
      icon: AlertTriangle,
      className: "bg-rose-50 text-[#D548DE",
    },
    success: {
      icon: CheckCircle2,
      className: "bg-emerald-50 text-[#16A34A]",
    },
    info: {
      icon: Users,
      className: "bg-violet-50 text-[#6956E8]",
    },
  };

  const current = map[type] ?? map.info;
  const Icon = current.icon;

  return (
    <span
      className={merge(
        "grid h-7 w-7 shrink-0 place-items-center rounded-full",
        current.className,
      )}
    >
      <Icon size={14} />
    </span>
  );
}

function DetailPanel({ outlet, onClose, mobile = false }) {
  if (!outlet) return null;

  return (
    <aside
      className={merge(
        "bg-white",
        mobile
          ? "fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto shadow-2xl"
          : "sticky top-0 h-screen overflow-y-auto border-l border-[#E1E6EF]",
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-[#11182E]">
                {outlet.name}
              </h2>
              <StatusBadge status={outlet.status} />
            </div>
            <p className="mt-1 text-sm text-[#667085]">
              Outlet details and live operations
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close outlet detail"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E1E6EF] text-[#667085] transition hover:bg-[#F6F4F8] hover:text-[#11182E]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-[132px_1fr] gap-4">
          <OutletImage
            src={outlet.image}
            name={outlet.name}
            className="h-[136px] w-[132px] rounded-2xl"
          />

          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-xs font-medium text-[#667085]">
                Outlet Manager
              </p>
              <p className="mt-1 text-sm font-bold text-[#11182E]">
                {outlet.manager}
              </p>
              <p className="mt-1 text-xs text-[#667085]">{outlet.phone}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#667085]">Address</p>
              <div className="mt-1.5 flex gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#6956E8]" />
                <p className="text-xs leadine-5 text-[#667085]">
                  {outlet.address}, {outlet.region}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SectionDivider />

        <section>
          <h3 className="text-sm font-bold text-[#11182E]">
            Connected Channels
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {outlet.channels.map((channel) => (
              <ChannelIcon key={channel} channel={channel} withLabel />
            ))}
          </div>
        </section>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <DetailMetric
            label="Today's Orders"
            value={outlet.orders}
            trend={outlet.orderChange}
          />
          <DetailMetric
            label="Revenue (Today)"
            value={formatRevenue(outlet.revenue)}
            trend={outlet.revenueChange}
          />
          <DetailMetric
            label="Avg. Prep Time"
            value={outlet.avgPrep ? `${outlet.avgPrep} min ` : "—"}
            trend={outlet.prepChange ? -outlet.prepChange : 0}
          />
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#11182E]">
                Orders (Last 7 Days)
              </h3>
              <p className="mt-0.5 text-xs text-[#98A2B3]">
                Daily order activity
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#E1E6EF] px-3 text-xs font-semibold text-[#11182E]"
            >
              Orders <ChevronDown size={14} />
            </button>
          </div>
          <MiniLineChart values={outlet.orderTrend} />
        </section>

        <div className="mt-6 grid gap-4 2xl:grid-cols-2">
          <section className="rounded-2xl border border-[#E1E6EF] p-4">
            <div className="flx items-center justify-between">
              <h3 className="text-sm font-bold text-[#11182E]">
                Operating Hours
              </h3>
              <button
                type="button"
                className="text-xs font-bold text-[#6956E8] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {outlet.hours.map(([day, time]) => (
                <div
                  key={day}
                  className="flx items-center justify-between gap-4 text-xs"
                >
                  <span className="text-[#667085]">{day}</span>
                  <span className="font-semibold text-[#11182E]">{time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E1E6EF] p-4">
            <h3 className="text-sm font-bold text-[#11182E]">
              Recent Activity
            </h3>
            <div className="mt-4 space-y-3">
              {outlet.activity.map(([type, label, time]) => (
                <div key={`${label}-${time}`} className="flex items-center gap-3">
                  <ActivityIcon type={type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#11182E]">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#98A2B3]">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#E1E6EF] pt-5">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F43F70] px-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(244,63,112,0.22)] transition hover:bg-[#e62e63]"
          >
            View Details <ExternalLink size={15} />
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DCE8] bg-white px-3 text-sm font-bold text-[#11182E] transition hover:bg-[#F2F4F8]"
          >
            <Edit3 size={15} /> Edit Outlet
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#6956E8] px-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(105,86,232,0.22)] transition hover:bg-[#5e49da]"
          >
            <ShoppingBag size={15} /> Open Orders
          </button>
        </div>
      </div>
    </aside>
  );
}

function DetailMetric({ label, value, trend }) {
  return (
    <article className="rounded-2xl border border-[#E1E6EF] bg-white p-3.5">
      <p className="text-[11px] font-medium leading-4 text-[#667085]">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-bold text-[#11182E]">
        {value}
      </p>
      <div className="mt-2">
        <Trend value={trend} />
      </div>
    </article>
  );
}

function SectionDivider() {
  return <div className="my-5 h-px bg-[#E1E6EF]" />;
}
