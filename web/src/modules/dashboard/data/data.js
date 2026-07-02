
import {
  Boxes,
  Building2,
  ClipboardList,
  Cpu,
  CreditCard,
  Flame,
  Gauge,
  Handshake,
  Headphones,
  Inbox,
  KeyRound,
  Layers,
  LifeBuoy,
  LineChart,
  Lock,
  MapPin,
  MessageSquare,
  Network,
  Package,
  Radar,
  Radio,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Workflow,
  Zap,
} from "lucide-react";


export const pillars = [
  {
    key: "commerce",
    eyebrow: "01",
    title: "AI Commerce",
    body: "Percakapan berubah menjadi cart, order, dan pembayaran tanpa berpindah aplikasi.",
    bullets: ["Katalog dari sistem resmi", "Cart & checkout percakapan", "Payment link Xendit"],
    icon: ShoppingBag,
    tone: "forest",
  },
  {
    key: "cx",
    eyebrow: "02",
    title: "Customer Experience",
    body: "AI Customer Service, Human Agent, CRM, complaint, dan escalation dalam satu konteks.",
    bullets: ["Unified inbox", "CRM 360°", "Handoff ke manusia"],
    icon: Headphones,
    tone: "amber",
  },
  {
    key: "ops",
    eyebrow: "03",
    title: "Operations",
    body: "Order, outlet, Kitchen View, katalog, fulfillment, dan status operasional real-time.",
    bullets: ["Kitchen View", "Outlet routing", "Fulfillment tracking"],
    icon: Flame,
    tone: "charcoal",
  },
  {
    key: "biz",
    eyebrow: "04",
    title: "Business Management",
    body: "Account, brand, user, role, payment, analytics, dan reports lintas ekosistem.",
    bullets: ["Role-based access", "Cross-brand reports", "Audit trail"],
    icon: Gauge,
    tone: "sage",
  },
  {
    key: "eco",
    eyebrow: "05",
    title: "Connected Ecosystem",
    body: "WhatsApp, Telegram, Xendit, AI provider, dan sistem internal lain terhubung dalam satu jaringan.",
    bullets: ["WhatsApp & Telegram", "Xendit payment", "AI provider"],
    icon: Network,
    tone: "cream",
  },
];

export const moduleGroups = [
  {
    title: "Customer & Conversation",
    hint: "Semua channel dalam satu inbox",
    items: [
      { name: "Unified Inbox", icon: Inbox },
      { name: "CRM", icon: Users },
      { name: "Channels", icon: Radio },
    ],
  },
  {
    title: "Commerce & Orders",
    hint: "Dari cart hingga pembayaran",
    items: [
      { name: "Orders", icon: ClipboardList },
      { name: "Products", icon: Package },
      { name: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "Outlet Operations",
    hint: "Fulfillment lintas outlet",
    items: [
      { name: "Kitchen View", icon: Flame },
      { name: "Outlets", icon: Store },
      { name: "Availability", icon: MapPin },
    ],
  },
  {
    title: "Support & Escalation",
    hint: "Complaint terstruktur",
    items: [
      { name: "Complaints", icon: LifeBuoy },
      { name: "Escalation Inbox", icon: Radar },
      { name: "Supervisor Review", icon: Handshake },
    ],
  },
  {
    title: "AI & Automation",
    hint: "Agent dengan guardrails",
    items: [
      { name: "AI Agents", icon: Sparkles },
      { name: "Workflows", icon: Workflow },
      { name: "Human Agents", icon: Users },
    ],
  },
  {
    title: "Management & Analytics",
    hint: "Visibilitas lintas brand",
    items: [
      { name: "Analytics", icon: LineChart },
      { name: "Reports", icon: Layers },
      { name: "Connected Platforms", icon: Boxes },
    ],
  },
  {
    title: "Security & Administration",
    hint: "Kontrol akses berbasis peran",
    items: [
      { name: "Access Control", icon: KeyRound },
      { name: "Settings", icon: Settings },
      { name: "Audit Trail", icon: ShieldCheck },
    ],
  },
];

export const roles = [
  {
    key: "group-owner",
    name: "Group Owner",
    scope: "Seluruh organization",
    bullets: [
      "Akses seluruh account dan brand",
      "Laporan lintas brand dan outlet",
      "Mengelola access control dan billing",
    ],
  },
  {
    key: "account-owner",
    name: "Account Owner",
    scope: "Satu business account",
    bullets: [
      "Mengelola brand dan outlet di account",
      "Mengatur user account",
      "Melihat performa account",
    ],
  },
  {
    key: "brand-manager",
    name: "Brand Manager",
    scope: "Brand yang ditugaskan",
    bullets: [
      "Melihat performa brand",
      "Mengelola produk, outlet, order",
      "Mengelola AI dan Human Agent brand",
    ],
  },
  {
    key: "outlet-manager",
    name: "Outlet Manager",
    scope: "Satu atau beberapa outlet",
    bullets: [
      "Melihat order outlet",
      "Mengelola proses order",
      "Memantau status outlet",
    ],
  },
  {
    key: "human-agent",
    name: "Human Agent",
    scope: "Percakapan yang ditugaskan",
    bullets: [
      "Mengambil alih dari AI",
      "Melihat customer context lengkap",
      "Menangani complaint",
    ],
  },
  {
    key: "finance",
    name: "Finance",
    scope: "Payment & rekonsiliasi",
    bullets: [
      "Memantau payment",
      "Laporan transaksi",
      "Rekonsiliasi Xendit",
    ],
  },
  {
    key: "ai-admin",
    name: "AI Administrator",
    scope: "Konfigurasi AI",
    bullets: [
      "Mengelola persona & tools",
      "Mengelola knowledge & policy",
      "Evaluasi kualitas agent",
    ],
  },
];

export const workflowSteps = [
  {
    stage: "Conversation",
    icon: MessageSquare,
    lines: [
      "Customer menghubungi brand",
      "Pesan masuk WhatsApp / Telegram",
      "AI mengenali account & brand",
    ],
  },
  {
    stage: "Commerce",
    icon: ShoppingBag,
    lines: [
      "Rekomendasi produk & outlet",
      "Cart dibuat & dikonfirmasi",
      "Order diterbitkan",
    ],
  },
  {
    stage: "Payment",
    icon: CreditCard,
    lines: [
      "Payment link Xendit dikirim",
      "Backend memverifikasi",
      "Status tersimpan aman",
    ],
  },
  {
    stage: "Fulfillment",
    icon: Flame,
    lines: [
      "Order diteruskan ke outlet",
      "Kitchen memproses",
      "Customer diperbarui hingga selesai",
    ],
  },
];

export const benefits = [
  { label: "Multi-Brand Ready", icon: Building2 },
  { label: "Multi-Outlet Operations", icon: Store },
  { label: "WhatsApp & Telegram", icon: MessageSquare },
  { label: "AI + Human Collaboration", icon: Sparkles },
  { label: "Role-Based Access", icon: Lock },
  { label: "Centralized Visibility", icon: Gauge },
  { label: "Payment Verified", icon: ShieldCheck },
  { label: "Escalation Structured", icon: LifeBuoy },
  { label: "Cross-Brand Analytics", icon: LineChart },
  { label: "Kitchen View Ready", icon: Flame },
  { label: "Idempotent Orders", icon: RouteIcon },
  { label: "Audit Trail", icon: ClipboardList },
];

export const securityPrinciples = [
  { label: "Role-based access control", icon: KeyRound },
  { label: "Account isolation", icon: Lock },
  { label: "Brand isolation", icon: Layers },
  { label: "Outlet-based access", icon: Store },
  { label: "Secure authentication", icon: ShieldCheck },
  { label: "Audit trail", icon: ClipboardList },
  { label: "Server-side validation", icon: Cpu },
  { label: "Payment verification", icon: CreditCard },
  { label: "Human approval", icon: Handshake },
  { label: "AI tool allowlist", icon: Sparkles },
  { label: "Idempotency", icon: RouteIcon },
  { label: "Session management", icon: Zap },
];
