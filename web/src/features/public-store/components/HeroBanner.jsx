import { useEffect, useRef, useState } from 'react'

export default function HeroBanner({ banner }) {
  const banners = Array.isArray(banner?.items) && banner.items.length ? banner.items : banner?.imageUrl ? [banner] : []
  const slides = banners.length ? banners : [{ title: 'Promo spesial hari ini' }]
  const [active, setActive] = useState(0)
  const swipeStart = useRef(null)

  useEffect(() => {
    setActive(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return undefined
    const intervalMs = Math.min(60, Math.max(2, Number(banner?.intervalSeconds || 5))) * 1000
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), intervalMs)
    return () => window.clearInterval(timer)
  }, [slides.length, banner?.intervalSeconds])

  const current = slides[active] || slides[0]
  const image = current.imageUrl ? (
    <img src={current.imageUrl} alt={current.title || 'Store promotion'} width="47" height="19" fetchPriority="high" decoding="async" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center bg-gradient-to-br from-[var(--store-primary)] to-[var(--brand-600)] px-6 text-lg font-black text-white">
      {current.title}
    </div>
  )
  const moveBySwipe = (endX) => {
    if (swipeStart.current === null || slides.length < 2) return
    const distance = endX - swipeStart.current
    if (Math.abs(distance) >= 40) setActive((value) => (value + (distance < 0 ? 1 : -1) + slides.length) % slides.length)
    swipeStart.current = null
  }
  return (
    <section className="mx-4 mt-3">
      <div className="aspect-[47/19] select-none overflow-hidden rounded-2xl bg-[var(--store-primary)] shadow-sm" onTouchStart={(event) => { swipeStart.current = event.touches[0].clientX }} onTouchEnd={(event) => moveBySwipe(event.changedTouches[0].clientX)} onPointerDown={(event) => { swipeStart.current = event.clientX }} onPointerUp={(event) => moveBySwipe(event.clientX)}>
        {current.linkUrl ? <a href={current.linkUrl} target="_blank" rel="noreferrer" className="block h-full w-full">{image}</a> : image}
      </div>
      {slides.length > 1 && <div className="mt-2 flex justify-center gap-1.5" aria-label="Banner pages">
        {slides.map((slide, index) => <button key={`${slide.imageUrl}-${index}`} type="button" onClick={() => setActive(index)} aria-label={`Buka banner ${index + 1}`} className={`h-2 w-2 rounded-full transition ${index === active ? 'w-5 bg-[var(--store-primary)]' : 'bg-slate-300'}`} />)}
      </div>}
    </section>
  )
}
