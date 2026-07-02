import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  LogIn,
  Menu,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { DashboardPreview } from "../components/DashboardPreview";
import foodinesiaLogo from "../../../assets/foodinesia-logo.png";
import foodinesiaLogoGreen from "../../../assets/foodinesia-logo-green.png";
import {
  benefits,
  moduleGroups,
  pillars,
  roles,
  securityPrinciples,
  workflowSteps,
} from "../data/data";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Cara Kerja", href: "#workflow" },
  { label: "Multi-Brand", href: "#multi-brand" },
  { label: "Keamanan", href: "#security" },
];

export default function LandingPage() {
  return (
    <div className="bg-warm-white text-charcoal antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Overview />
        <Pillars />
        <MultiBrand />
        <AIMarketplace />
        <AIHumanCollab />
        <UnifiedOperations />
        <WorkflowSection />
        <MultiAccount />
        <RoleAccess />
        <AnalyticsPreview />
        <Security />
        <Benefits />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ============================= NAVBAR ============================= */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black border-b border-white/10"
          : "bg-black border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3.5">
        <a href="#top" className="flex items-center gap-2 shrink-0 text-warm-white">
          <img src={foodinesiaLogo} alt="Foodinesia One" className="h-14 object-contain" />
        </a>
        <nav className="ml-4 hidden lg:flex items-center gap-1 text-sm">
          {navItems.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 rounded-full text-warm-white/80 hover:text-amber-accent hover:bg-white/5 transition-all"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-warm-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-sage transition-colors"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-full border border-white/15 text-warm-white hover:bg-white/5"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-black">
          <div className="mx-auto max-w-7xl px-5 py-3 flex flex-col gap-1">
            {navItems.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-warm-white/80 hover:text-amber-accent hover:bg-white/5"
              >
                {n.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-warm-white px-4 py-2.5 text-sm font-semibold text-charcoal"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Masuk
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ============================== HERO ============================== */
function Hero() {
  return (
    <section
      id="top"
      className="relative pt-32 sm:pt-36 pb-16 sm:pb-24 overflow-hidden"
    >
      {/* Ambient background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(220,232,223,0.7),transparent_60%),radial-gradient(circle_at_85%_20%,rgba(215,149,59,0.15),transparent_55%)]" />
        <div
          className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-hairline to-transparent"
        />
      </div>

      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-10 items-center">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            PT Foodiholic Group Indonesia
          </span>
          <h1 className="mt-5 text-[38px] sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.05]">
            Satu Platform untuk Menghubungkan Seluruh{" "}
            <span className="italic font-normal text-forest">
              Brand, Outlet, Channel
            </span>
            , dan Operasional Foodinesia.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-ink">
            Foodinesia One menyatukan AI Marketplace, AI Customer Service, CRM,
            order, pembayaran, outlet, komplain, agent, dan aktivitas berbagai
            brand Foodinesia dalam satu platform internal yang terintegrasi.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-medium text-warm-white hover:bg-forest transition-colors"
            >
              Masuk ke Foodinesia One
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href="#platform"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-warm-white px-5 py-3 text-sm font-medium text-charcoal hover:border-forest transition-colors"
            >
              Jelajahi Platform
              <ChevronRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <p className="mt-6 text-xs text-muted-ink">
            Belum memiliki akses? Hubungi administrator Foodinesia.
          </p>
          <div className="mt-8 border-t border-hairline pt-5 max-w-lg text-xs text-muted-ink">
            Dibangun untuk operasional multi-brand, multi-account, multi-outlet,
            dan multi-channel Foodinesia.
          </div>
        </div>

        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

/* ============================ OVERVIEW ============================ */
function Overview() {
  return (
    <Section id="platform" eyebrow="Overview" className="bg-gradient-to-b from-cream/50 to-sage/25">
      <SectionHeader
        title="Satu Ekosistem untuk Seluruh Operasional Foodinesia"
        lead="Percakapan, order, payment, customer service, outlet, dan laporan tidak lagi tersebar di banyak sistem. Foodinesia One menyatukannya di satu tempat, dengan pemisahan data yang tetap dijaga per account, brand, dan outlet."
      />

      <div className="mt-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <HierarchyDiagram />
        <div className="space-y-5 lg:pl-6">
          {[
            {
              title: "Terpusat, tapi tetap terpisah",
              body: "Setiap account, brand, dan outlet memiliki data dan konfigurasi masing-masing. Manajemen tetap dapat melihat gambaran lintas ekosistem.",
            },
            {
              title: "Dari conversation hingga fulfillment",
              body: "Chat customer, cart, order, payment, dan komplain hidup dalam satu konteks — tidak berpindah aplikasi.",
            },
            {
              title: "Terhubung ke sistem yang sudah dipakai",
              body: "WhatsApp, Telegram, Xendit, dan AI provider menyatu dalam satu platform operasional yang siap dikembangkan.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-hairline bg-warm-white p-5">
              <div className="text-sm font-semibold">{c.title}</div>
              <p className="mt-1.5 text-sm text-muted-ink">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function HierarchyDiagram() {
  const layers = [
    { l: "Foodinesia", s: "Group" },
    { l: "Business Account", s: "Workspace" },
    { l: "Brand", s: "SelaluTeh · SelaluKopi · Brand lainnya" },
    { l: "Outlet", s: "Samarinda · Tenggarong · …" },
    { l: "Channel", s: "WhatsApp · Telegram · …" },
    { l: "Customer & Operations", s: "Conversation · Order · Payment · Complaint" },
  ];
  return (
    <div className="rounded-3xl border border-hairline bg-warm-white p-6 sm:p-8">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-ink">
        Struktur Ekosistem
      </div>
      <div className="mt-5 space-y-2.5">
        {layers.map((r, i) => (
          <div
            key={r.l}
            className="relative flex items-center gap-3 rounded-xl border border-hairline bg-cream/60 px-4 py-3"
            style={{ marginLeft: `${i * 12}px` }}
          >
            <span className="h-2 w-2 rounded-full bg-forest" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">{r.l}</div>
              <div className="text-[11px] text-muted-ink">{r.s}</div>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-ink" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================= PILLARS ============================ */
function Pillars() {
  const toneMap = {
    forest: "bg-forest text-warm-white",
    charcoal: "bg-charcoal text-warm-white",
    amber: "bg-amber-accent/15 text-charcoal",
    sage: "bg-sage text-charcoal",
    cream: "bg-cream text-charcoal",
  };

  return (
    <Section id="capabilities" eyebrow="Core Pillars">
      <SectionHeader
        title="Lebih dari Sekadar Chatbot atau CRM"
        lead="Lima pilar utama yang membuat Foodinesia One menjadi platform operasional, bukan sekadar alat komunikasi."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2 auto-rows-fr">
        {pillars.map((p, i) => {
          const spans = [
            "lg:col-span-3 lg:row-span-2",
            "lg:col-span-3",
            "lg:col-span-2",
            "lg:col-span-2",
            "lg:col-span-2",
          ];
          const Icon = p.icon;
          return (
            <article
              key={p.key}
              className={`group relative rounded-3xl p-6 sm:p-7 border border-hairline overflow-hidden ${toneMap[p.tone]} ${spans[i]}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-mono opacity-70">
                  {p.eyebrow}
                </span>
                <Icon className="h-5 w-5 opacity-80" aria-hidden />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="mt-2 text-sm opacity-80 max-w-md">{p.body}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {p.bullets.map((b) => (
                  <li
                    key={b}
                    className="text-[11px] rounded-full bg-white/15 backdrop-blur border border-white/10 px-2.5 py-1"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

/* ============================ MULTI-BRAND ========================= */
function MultiBrand() {
  const brands = [
    { name: "SelaluTeh", outlets: ["Outlet Samarinda", "Outlet Tenggarong"] },
    { name: "SelaluKopi", outlets: ["Outlet A", "Outlet B"] },
    { name: "Brand Lainnya", outlets: ["Banyak Outlet"] },
  ];
  return (
    <Section id="multi-brand" eyebrow="Multi-Brand Architecture" className="bg-charcoal text-warm-white overflow-hidden">
      {/* Ambient glowing effect */}
      <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-forest/30 blur-[100px]" />
      </div>
      <SectionHeader
        dark
        title="Dibangun untuk Banyak Brand, Bukan Hanya Satu Bisnis"
        lead="Setiap brand memiliki identitas, produk, outlet, customer, channel, dan agent sendiri. Manajemen Foodinesia tetap dapat memantau seluruh ekosistem dalam satu view."
      />

      <div className="mt-14 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.2em] text-sage/70">
            Foodinesia One
          </div>
          <div className="mt-5 space-y-4">
            {brands.map((b) => (
              <div key={b.name}>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-accent" />
                  <span className="text-sm font-semibold">{b.name}</span>
                </div>
                <div className="mt-2 ml-4 border-l border-white/10 pl-4 space-y-1.5">
                  {b.outlets.map((o) => (
                    <div
                      key={o}
                      className="flex items-center gap-2 text-[13px] text-sage/80"
                    >
                      <span className="h-px w-4 bg-white/20" />
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 text-sm text-sage/80">
          {[
            "Data antar-account terisolasi secara ketat.",
            "User dapat memperoleh akses lintas brand jika diperlukan.",
            "Brand baru dapat ditambahkan tanpa membangun sistem baru.",
            "Konfigurasi AI Agent, produk, dan outlet dapat berbeda per brand.",
          ].map((t) => (
            <div
              key={t}
              className="flex gap-3 rounded-2xl border border-white/10 p-4"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-accent" />
              <p>{t}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ========================== AI MARKETPLACE ======================== */
function AIMarketplace() {
  const flow = [
    "Conversation",
    "Product Catalog",
    "Cart",
    "Order",
    "Payment",
    "Outlet Fulfillment",
  ];
  return (
    <Section eyebrow="AI Marketplace">
      <SectionHeader
        title="Marketplace yang Hadir di Dalam Percakapan"
        lead="Customer tidak perlu membuka marketplace terpisah. Semua terjadi di dalam chat — dari mencari produk hingga membayar."
      />
      <div className="mt-14 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
        <div className="rounded-3xl border border-hairline bg-warm-white shadow-[0_20px_60px_-40px_rgba(23,33,28,0.25)] p-5">
          <div className="text-[11px] font-medium text-muted-ink mb-3">
            WhatsApp · SelaluTeh
          </div>
          <ChatBubble side="in">
            Halo, ada rekomendasi menu segar untuk sore ini?
          </ChatBubble>
          <ChatBubble side="out" agent="AI">
            Tentu! Untuk sore ini rekomendasi kami: Lychee Tea, Matcha Latte,
            dan Chizu Milk Tea. Kirim ke outlet mana ya?
          </ChatBubble>
          <ChatBubble side="in">Outlet Samarinda, 2 chizu ya.</ChatBubble>
          <ChatBubble side="out" agent="AI">
            Cart Anda: 2× Chizu Milk Tea · Outlet Samarinda. Konfirmasi untuk
            saya buatkan order & payment link?
          </ChatBubble>
          <div className="mt-3 rounded-xl border border-hairline p-3 flex items-center gap-3">
            <ShoppingBag className="h-4 w-4 text-forest" aria-hidden />
            <div className="text-xs">
              <div className="font-semibold">Cart · Order #FDN-1024</div>
              <div className="text-muted-ink">2 item · siap checkout</div>
            </div>
            <span className="ml-auto text-[10px] rounded-full bg-sage px-2 py-0.5 text-forest">
              via percakapan
            </span>
          </div>
        </div>

        <div>
          <ol className="space-y-2.5">
            {flow.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-xs font-semibold text-forest">
                  {i + 1}
                </span>
                <div className="flex-1 rounded-xl border border-hairline bg-warm-white px-4 py-3 text-sm font-medium">
                  {step}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-muted-ink max-w-md">
            Harga, produk, outlet, dan ketersediaan diambil dari sistem resmi —
            bukan hasil asumsi AI.
          </p>
        </div>
      </div>
    </Section>
  );
}

function ChatBubble({
  side,
  agent,
  children,
}) {
  const isOut = side === "out";
  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
          isOut
            ? "bg-forest text-warm-white rounded-br-sm"
            : "bg-cream text-charcoal rounded-bl-sm"
        }`}
      >
        {agent && (
          <div className="mb-1 flex items-center gap-1 text-[10px] opacity-80">
            <Sparkles className="h-3 w-3" aria-hidden />
            {agent}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ======================== AI + HUMAN COLLAB ======================= */
function AIHumanCollab() {
  const aiPoints = [
    "Menjawab pertanyaan umum",
    "Menampilkan produk & rekomendasi",
    "Membantu order & cek status via tools",
    "Mengumpulkan informasi komplain",
    "Handoff ketika dibutuhkan",
  ];
  const humanPoints = [
    "Mengambil alih percakapan",
    "Membaca conversation context",
    "Menangani kasus kompleks",
    "Memeriksa payment & order",
    "Eskalasi & keputusan manusia",
  ];
  return (
    <Section eyebrow="AI × Human" className="bg-gradient-to-b from-sage/25 to-cream/45">
      <SectionHeader
        title="AI Membantu, Manusia Tetap Memegang Kendali"
        lead="AI Agent bekerja dalam scope yang jelas. Human Agent tetap memegang keputusan penting."
      />

      <div className="mt-14 grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
        <SideCard
          icon={Sparkles}
          title="AI Agent"
          tone="sage"
          items={aiPoints}
        />
        <div className="hidden lg:flex flex-col items-center justify-center gap-3">
          <div className="rounded-full bg-charcoal text-warm-white px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
            Shared Context
          </div>
          <div className="rounded-2xl border border-hairline bg-warm-white p-4 w-52 text-xs space-y-1.5">
            <ContextRow label="Customer" v="Rani P." />
            <ContextRow label="Brand" v="SelaluTeh" />
            <ContextRow label="Cart" v="2× Chizu" />
            <ContextRow label="Order" v="#FDN-1024" />
            <ContextRow label="Payment" v="Verified" />
            <ContextRow label="Complaint" v="—" />
          </div>
        </div>
        <SideCard
          icon={UserRound}
          title="Human Agent"
          tone="amber"
          items={humanPoints}
        />
      </div>
    </Section>
  );
}

function SideCard({
  icon: Icon,
  title,
  tone,
  items,
}) {
  const map = {
    sage: "border-forest/20 bg-warm-white",
    amber: "border-amber-accent/30 bg-warm-white",
  };
  return (
    <div className={`rounded-3xl border ${map[tone]} p-6 sm:p-7`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-forest" aria-hidden />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="mt-5 space-y-2.5 text-sm text-charcoal">
        {items.map((i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextRow({ label, v }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-ink">{label}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

/* ========================== UNIFIED OPS =========================== */
function UnifiedOperations() {
  return (
    <Section eyebrow="Modules">
      <SectionHeader
        title="Dari Customer Conversation hingga Outlet Operations"
        lead="Semua modul saling terhubung. Setiap tim melihat modul yang relevan dengan perannya."
      />
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {moduleGroups.map((g) => (
          <div
            key={g.title}
            className="rounded-2xl border border-hairline bg-warm-white p-5 hover:border-forest transition-colors"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-ink">
              {g.hint}
            </div>
            <h3 className="mt-1.5 text-base font-semibold">{g.title}</h3>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {g.items.map((m) => {
                const Icon = m.icon;
                return (
                  <span
                    key={m.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-cream/60 px-2.5 py-1 text-[12px]"
                  >
                    <Icon className="h-3.5 w-3.5 text-forest" aria-hidden />
                    {m.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================ WORKFLOW ============================ */
function WorkflowSection() {
  return (
    <Section id="workflow" eyebrow="Workflow" className="bg-charcoal text-warm-white overflow-hidden">
      {/* Ambient glowing effect */}
      <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-amber-accent/15 blur-[100px]" />
      </div>
      <SectionHeader
        dark
        title="Satu Alur dari Percakapan hingga Order Selesai"
        lead="Empat tahap besar dengan cabang human takeover dan complaint escalation di setiap titik."
      />

      <div className="mt-14 relative">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 hidden lg:block h-px bg-gradient-to-r from-white/0 via-white/15 to-white/0"
        />
        <div className="grid gap-6 lg:grid-cols-4">
          {workflowSteps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.stage}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-warm-white text-charcoal">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.stage}</h3>
                <ul className="mt-3 space-y-1.5 text-[13px] text-sage/80">
                  {s.lines.map((l) => (
                    <li key={l} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-accent" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <BranchTag
            label="Human Agent takeover"
            body="Di setiap tahap, saat customer meminta, AI ragu, atau kasus butuh keputusan manusia."
          />
          <BranchTag
            label="Complaint escalation"
            body="Complaint terhubung ke order & outlet, diteruskan ke supervisor bila diperlukan."
          />
        </div>
      </div>
    </Section>
  );
}

function BranchTag({ label, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex gap-3">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-accent" />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[13px] text-sage/70">{body}</div>
      </div>
    </div>
  );
}

/* ======================== MULTI-ACCOUNT ========================== */
function MultiAccount() {
  const filters = ["Account", "Brand", "Outlet", "Channel", "Date range", "Agent"];
  return (
    <Section eyebrow="Multi-Account · Multi-Outlet">
      <SectionHeader
        title="Kontrol Terpusat dengan Data yang Tetap Terpisah"
        lead="Manajemen melihat gambaran ekosistem. Tim operasional hanya melihat scope-nya."
      />
      <div className="mt-14 grid lg:grid-cols-[1fr_1fr] gap-8">
        <div className="rounded-3xl border border-hairline bg-warm-white p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-ink">
            Filter & Selector
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-cream/60 px-3 py-1.5 text-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                {f}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-cream/50 border border-hairline p-4 text-sm text-charcoal">
            <div className="text-xs text-muted-ink">Scope aktif</div>
            <div className="mt-1 font-semibold">
              Foodinesia · SelaluTeh · Outlet Samarinda · WhatsApp
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["Group Owner", "Seluruh ekosistem"],
            ["Account Owner", "Account terkait"],
            ["Brand Manager", "Brand yang ditugaskan"],
            ["Outlet Manager", "Outletnya sendiri"],
            ["Outlet Staff", "Pekerjaan operasional"],
            ["Human Agent", "Percakapan yang ditugaskan"],
          ].map(([r, s]) => (
            <div
              key={r}
              className="flex items-center justify-between rounded-xl border border-hairline bg-warm-white px-4 py-3"
            >
              <span className="text-sm font-medium">{r}</span>
              <span className="text-xs text-muted-ink">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* =========================== ROLE ACCESS ========================== */
function RoleAccess() {
  const [active, setActive] = useState(roles[0].key);
  const current = roles.find((r) => r.key === active) ?? roles[0];
  return (
    <Section eyebrow="Role-Based Access" className="bg-gradient-to-b from-cream/50 to-sage/25">
      <SectionHeader
        title="Setiap Tim Melihat Apa yang Mereka Perlukan"
        lead="Pilih peran untuk melihat scope dan tugas yang relevan di dalam Foodinesia One."
      />

      <div className="mt-12 grid lg:grid-cols-[minmax(0,260px)_1fr] gap-6">
        <div
          className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0"
          role="tablist"
        >
          {roles.map((r) => {
            const isActive = r.key === active;
            return (
              <button
                key={r.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(r.key)}
                className={`shrink-0 lg:w-full text-left rounded-xl px-4 py-3 text-sm transition-colors border ${
                  isActive
                    ? "border-charcoal bg-charcoal text-warm-white"
                    : "border-hairline bg-warm-white hover:border-forest"
                }`}
              >
                <div className="font-medium">{r.name}</div>
                <div
                  className={`text-[11px] ${
                    isActive ? "text-sage/80" : "text-muted-ink"
                  }`}
                >
                  {r.scope}
                </div>
              </button>
            );
          })}
        </div>
        <div className="rounded-3xl border border-hairline bg-warm-white p-6 sm:p-8">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-ink">
            Scope
          </div>
          <h3 className="mt-1 text-2xl font-semibold">{current.name}</h3>
          <p className="mt-1 text-sm text-muted-ink">{current.scope}</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {current.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2.5 rounded-xl border border-hairline bg-cream/50 px-3.5 py-2.5 text-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ========================= ANALYTICS PREVIEW ====================== */
function AnalyticsPreview() {
  return (
    <Section eyebrow="Analytics">
      <SectionHeader
        title="Visibilitas dari Group hingga Outlet"
        lead="Ringkasan performa lintas brand, channel, dan outlet dalam satu dashboard analytics."
      />
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard title="Cross-Brand Overview" hint="AI vs Human handling">
          <div className="flex items-end gap-2 h-28">
            {[70, 55, 82, 44, 90, 66, 75].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5">
                <div
                  className="rounded-t bg-forest"
                  style={{ height: `${h * 0.6}%` }}
                />
                <div
                  className="rounded-b bg-amber-accent"
                  style={{ height: `${h * 0.35}%` }}
                />
              </div>
            ))}
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Order Trend" hint="7 hari terakhir">
          <svg viewBox="0 0 200 100" className="w-full h-28">
            <polyline
              fill="none"
              stroke="var(--forest)"
              strokeWidth="2"
              points="0,70 30,55 60,60 90,35 120,45 150,20 180,30 200,15"
            />
            <polyline
              fill="none"
              stroke="var(--amber-accent)"
              strokeWidth="2"
              strokeDasharray="3 3"
              points="0,80 30,72 60,66 90,55 120,50 150,42 180,38 200,32"
            />
          </svg>
        </AnalyticsCard>
        <AnalyticsCard title="Channel Distribution" hint="WhatsApp · Telegram">
          <div className="flex items-center gap-4 h-28">
            <Donut />
            <ul className="text-xs space-y-1.5">
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-forest" /> WhatsApp
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-info" /> Telegram
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-accent" /> Lainnya
              </li>
            </ul>
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Complaint Status" hint="Escalated / Resolved">
          <StackedBar />
        </AnalyticsCard>
        <AnalyticsCard title="Outlet Performance" hint="Order per outlet">
          <ul className="space-y-2 text-xs">
            {[
              ["Outlet Samarinda", 92],
              ["Outlet Tenggarong", 74],
              ["Outlet A · SelaluKopi", 66],
              ["Outlet B · SelaluKopi", 48],
            ].map(([n, v]) => (
              <li key={n}>
                <div className="flex justify-between">
                  <span>{n}</span>
                  <span className="text-muted-ink">{v}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-cream overflow-hidden">
                  <div
                    className="h-full bg-forest"
                    style={{ width: `${v}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </AnalyticsCard>
        <AnalyticsCard title="AI vs Human Handling" hint="Resolution split">
          <div className="flex items-center justify-center h-28">
            <div className="text-center">
              <div className="text-4xl font-semibold text-forest">63<span className="text-xl">%</span></div>
              <div className="text-[11px] text-muted-ink mt-1">
                diselesaikan oleh AI · sisanya oleh Human Agent
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </Section>
  );
}

function AnalyticsCard({
  title,
  hint,
  children,
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-warm-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-ink">
          {hint}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Donut() {
  return (
    <svg viewBox="0 0 42 42" className="h-24 w-24 -rotate-90">
      <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="var(--cream)" strokeWidth="6" />
      <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="var(--forest)" strokeWidth="6" strokeDasharray="55 100" />
      <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="var(--info)" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-55" />
      <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="var(--amber-accent)" strokeWidth="6" strokeDasharray="15 100" strokeDashoffset="-85" />
    </svg>
  );
}

function StackedBar() {
  const data = [
    { l: "Sen", r: 60, e: 20 },
    { l: "Sel", r: 70, e: 15 },
    { l: "Rab", r: 50, e: 25 },
    { l: "Kam", r: 80, e: 10 },
    { l: "Jum", r: 65, e: 18 },
    { l: "Sab", r: 75, e: 12 },
  ];
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.l} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end h-24 gap-0.5">
            <div
              className="rounded bg-error/70"
              style={{ height: `${d.e}%` }}
            />
            <div
              className="rounded bg-success"
              style={{ height: `${d.r}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-ink">{d.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================ SECURITY ============================ */
function Security() {
  return (
    <Section id="security" eyebrow="Security" className="bg-gradient-to-b from-sage/25 to-cream/45">
      <SectionHeader
        title="Aman untuk Operasional Internal Perusahaan"
        lead="Prinsip keamanan tingkat enterprise diterapkan sejak akses, konfigurasi AI, hingga verifikasi pembayaran."
      />

      <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {securityPrinciples.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-warm-white px-4 py-3"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-sage text-forest">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-forest/20 bg-warm-white p-5 flex gap-4 items-start">
        <ShieldCheck className="h-5 w-5 text-forest mt-0.5" aria-hidden />
        <p className="text-sm text-charcoal">
          Foodinesia One tidak memberikan akses bebas kepada AI untuk mengubah
          harga, stok, pembayaran, permission, refund, atau data sensitif
          lainnya. Keputusan penting selalu berada di sisi manusia dan sistem
          resmi.
        </p>
      </div>
    </Section>
  );
}

/* ============================ BENEFITS ============================ */
function Benefits() {
  return (
    <Section eyebrow="Benefits">
      <SectionHeader
        title="Membantu Seluruh Tim Bekerja dalam Satu Sistem"
        lead="Alih-alih berpindah aplikasi, setiap tim menjalankan tugasnya di scope yang benar — dalam satu platform."
      />
      <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.label}
              className="rounded-xl border border-hairline bg-warm-white p-4 flex items-center gap-3 hover:border-forest transition-colors"
            >
              <Icon className="h-4 w-4 text-forest" aria-hidden />
              <span className="text-sm font-medium">{b.label}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* =========================== FINAL CTA ============================ */
function FinalCTA() {
  return (
    <section className="px-5 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-charcoal text-warm-white p-10 sm:p-16">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-forest/50 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-accent/25 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-sage/70">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Portal Internal Foodinesia
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Hubungkan Seluruh Operasional Foodinesia dalam Satu Platform.
            </h2>
            <p className="mt-5 text-sage/80 max-w-xl">
              Masuk untuk mengelola brand, outlet, customer conversation,
              marketplace, order, pembayaran, agent, dan aktivitas operasional
              sesuai dengan akses Anda.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-warm-white px-5 py-3 text-sm font-medium text-charcoal hover:bg-sage transition-colors"
              >
                Masuk ke Foodinesia One
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <span className="text-xs text-sage/70">
                Mengalami kendala akses? Hubungi administrator atau IT Support
                Foodinesia.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== FOOTER ============================ */
function Footer() {
  return (
    <footer className="border-t border-hairline bg-warm-white text-charcoal">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <img src={foodinesiaLogo} alt="Foodinesia One" className="h-8 object-contain" />
          </div>
          <p className="mt-3 text-sm text-charcoal/80 max-w-sm">
            Multi-Brand AI Commerce & Operations Platform untuk operasional
            internal Foodinesia.
          </p>
          <p className="mt-6 text-xs text-charcoal/60 max-w-sm">
            Foodinesia One hanya digunakan untuk kebutuhan operasional internal
            Foodinesia and business account yang memiliki akses resmi.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-charcoal/60 font-semibold">
            Platform
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#capabilities" className="text-charcoal/80 hover:text-forest transition-colors">
                Capabilities
              </a>
            </li>
            <li>
              <a href="#workflow" className="text-charcoal/80 hover:text-forest transition-colors">
                Cara Kerja
              </a>
            </li>
            <li>
              <a href="#security" className="text-charcoal/80 hover:text-forest transition-colors">
                Keamanan
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-charcoal/60 font-semibold">
            Akses
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="text-charcoal/60">Bantuan Akses · hubungi admin</li>
            <li>
              <Link to="/login" className="text-charcoal/80 hover:text-forest transition-colors">
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-charcoal/60 flex flex-wrap gap-2 justify-between">
          <span>© 2026 PT Foodiholic Group Indonesia. Seluruh hak dilindungi.</span>
          <span>Internal use only · noindex</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================ HELPERS ============================= */
function Section({
  id,
  eyebrow,
  children,
  className = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`relative px-5 py-20 sm:py-28 ${className}`}
    >
      <div className={`mx-auto max-w-7xl ${visible ? "fade-up" : "opacity-0"}`}>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-6 bg-current" />
            {eyebrow}
          </span>
        </div>
        {children}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  lead,
  dark,
}) {
  return (
    <div className="mt-4 grid lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-14 items-end">
      <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold tracking-tight leading-[1.1] max-w-2xl">
        {title}
      </h2>
      <p className={`text-[15px] leading-relaxed max-w-lg ${dark ? "text-sage/80" : "text-muted-ink"}`}>
        {lead}
      </p>
    </div>
  );
}
