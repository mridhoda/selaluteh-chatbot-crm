import dailyWhitePromotionBanner from '../../../assets/banner/daily-white-promotion.png'

export default function HeroBanner({ banner }) {
  return (
    <section className="mx-4 mt-3 aspect-[47/19] overflow-hidden rounded-2xl bg-[var(--store-primary)] shadow-sm">
      <img
        src={banner?.imageUrl || dailyWhitePromotionBanner}
        alt={banner?.title || 'Daily White promotion'}
        className="h-full w-full object-cover"
      />
    </section>
  )
}
