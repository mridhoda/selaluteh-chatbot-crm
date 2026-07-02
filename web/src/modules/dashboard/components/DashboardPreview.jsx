import React from "react";
import {
  Building2,
  ChevronDown,
  CreditCard,
  Flame,
  MessageSquare,
  Send,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 bg-gradient-to-br from-sage/40 via-transparent to-amber-accent/20 rounded-[2rem] blur-2xl"
      />
      <div className="relative float-soft rounded-2xl border border-hairline bg-warm-white shadow-[0_30px_80px_-40px_rgba(23,33,28,0.35)] overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-hairline bg-cream/60">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E56F3D]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#D7953B]/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-forest/50" />
          </div>
          <div className="ml-3 flex items-center gap-1 text-[11px] font-medium text-muted-ink">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Foodinesia Group
            <ChevronDown className="h-3 w-3" aria-hidden />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[10px] text-muted-ink">Live</span>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-b border-hairline text-[10px]">
          {[
            { l: "Account · HQ", tone: "bg-charcoal text-warm-white" },
            { l: "Brand · SelaluTeh", tone: "bg-sage text-charcoal" },
            { l: "Brand · SelaluKopi", tone: "bg-cream text-charcoal" },
            { l: "Outlet · Samarinda", tone: "bg-warm-white border border-hairline text-charcoal" },
            { l: "WhatsApp", tone: "bg-warm-white border border-hairline text-forest" },
            { l: "Telegram", tone: "bg-warm-white border border-hairline text-info" },
          ].map((c) => (
            <span
              key={c.l}
              className={`px-2 py-0.5 rounded-full font-medium ${c.tone}`}
            >
              {c.l}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-3 p-4">
          {/* Inbox */}
          <div className="col-span-12 md:col-span-5 rounded-xl border border-hairline bg-warm-white">
            <div className="px-3 py-2 border-b border-hairline flex items-center justify-between">
              <div className="text-[11px] font-semibold">Unified Inbox</div>
              <span className="text-[9px] text-muted-ink">4 aktif</span>
            </div>
            <ul className="divide-y divide-hairline">
              {[
                {
                  n: "Rani P.",
                  b: "SelaluTeh",
                  m: "Mau pesan chizu 2, ada di Samarinda?",
                  t: "AI",
                  ch: "WA",
                },
                {
                  n: "Dedi S.",
                  b: "SelaluKopi",
                  m: "Payment sudah saya bayar, order #FDN-1024",
                  t: "Human",
                  ch: "TG",
                },
                {
                  n: "Nadia",
                  b: "SelaluTeh",
                  m: "Kok pesanan saya belum datang?",
                  t: "Escalated",
                  ch: "WA",
                },
                {
                  n: "Brand Baru",
                  b: "Brand Baru",
                  m: "Rekomendasi menu untuk 3 orang",
                  t: "AI",
                  ch: "WA",
                },
              ].map((r, i) => (
                <li key={i} className="px-3 py-2 flex items-start gap-2">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-sage grid place-items-center text-[9px] font-semibold text-forest">
                    {r.n[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-semibold truncate">{r.n}</span>
                      <span className="text-muted-ink">· {r.b}</span>
                      <span className="ml-auto text-[9px] rounded px-1 bg-cream">
                        {r.ch}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-ink truncate">
                      {r.m}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 ${
                      r.t === "AI"
                        ? "bg-sage text-forest"
                        : r.t === "Human"
                          ? "bg-amber-accent/20 text-warning"
                          : "bg-error/10 text-error"
                    }`}
                  >
                    {r.t}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Middle column */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
            <div className="rounded-xl border border-hairline p-3">
              <div className="flex items-center justify-between text-[10px] text-muted-ink">
                <span className="font-semibold text-charcoal">
                  Order #FDN-1024
                </span>
                <span className="rounded-full bg-success/10 text-success px-1.5 py-0.5 text-[9px] font-medium">
                  Payment Verified
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <Store className="h-3 w-3 text-forest" aria-hidden />
                <span>Outlet Samarinda</span>
                <span className="text-muted-ink">· SelaluTeh</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                <Flame className="h-3 w-3 text-orange-accent" aria-hidden />
                <span>Processing</span>
                <span className="ml-auto rounded bg-cream px-1.5 py-0.5">
                  Kitchen
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 text-[9px] text-muted-ink">
                {["Order", "Paid", "Accept", "Done"].map((s, i) => (
                  <div key={s} className="text-center">
                    <div
                      className={`h-1.5 rounded-full ${
                        i < 3 ? "bg-forest" : "bg-hairline"
                      }`}
                    />
                    <span className="mt-1 block">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-hairline p-3">
              <div className="text-[10px] font-semibold mb-2">
                Cross-Brand Overview
              </div>
              <div className="flex items-end gap-1 h-16">
                {[40, 65, 50, 80, 55, 90, 72, 60, 88, 76, 95, 68].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-sage to-forest"
                      style={{ height: `${h}%` }}
                    />
                  ),
                )}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-muted-ink">
                <span>SelaluTeh</span>
                <span>SelaluKopi</span>
                <span>Brand Baru</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-3">
            <StatusCard
              icon={Sparkles}
              tone="sage"
              title="AI Handling"
              value="63%"
              hint="12 percakapan"
            />
            <StatusCard
              icon={UserRound}
              tone="amber"
              title="Human Agent"
              value="7"
              hint="aktif · siap"
            />
            <StatusCard
              icon={MessageSquare}
              tone="charcoal"
              title="Waiting"
              value="3"
              hint="menunggu outlet"
            />
            <StatusCard
              icon={CreditCard}
              tone="cream"
              title="Payments"
              value="Rp —"
              hint="verified today"
            />
          </div>
        </div>

        {/* Bottom composer */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-hairline bg-cream/40">
          <div className="flex-1 rounded-full bg-warm-white border border-hairline px-3 py-1.5 text-[10px] text-muted-ink">
            Ketik balasan untuk Rani P. atau serahkan ke AI…
          </div>
          <button
            type="button"
            aria-label="Kirim"
            className="h-7 w-7 rounded-full bg-charcoal text-warm-white grid place-items-center"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  hint,
  tone,
}) {
  const map = {
    sage: "bg-sage/60 text-forest",
    amber: "bg-amber-accent/15 text-warning",
    charcoal: "bg-charcoal text-warm-white",
    cream: "bg-cream text-charcoal",
  };
  return (
    <div className={`rounded-xl p-3 ${map[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] opacity-80">
        <Icon className="h-3 w-3" aria-hidden />
        {title}
      </div>
      <div className="mt-1 text-lg font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[9px] opacity-70">{hint}</div>
    </div>
  );
}
