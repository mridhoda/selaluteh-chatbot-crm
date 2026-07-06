export default function HeroBanner({ banner }) {
  return (
    <section className="mx-4 mt-3 overflow-hidden rounded-2xl bg-[var(--store-primary)] px-4 py-3.5 text-white shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">SelaluTeh Pickup</p>
      <h1 className="mt-2 max-w-[19rem] text-lg font-black leading-snug">{banner?.title || 'Pesan online, ambil di outlet.'}</h1>
      <p className="mt-2 text-xs leading-5 text-white/80">{banner?.subtitle || 'Menu favorit siap dipesan tanpa login.'}</p>
    </section>
  )
}
