import { useEffect, useRef, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { filterRecommendations } from '../utils/recommendationModel'
import { formatCurrency } from '../utils/formatCurrency'

function track(payload) {
  if (typeof phase5ApiClient.public.recordRecommendationEvent !== 'function') return Promise.resolve()
  return phase5ApiClient.public
    .recordRecommendationEvent(payload)
    .catch(() => {})
}

export default function CartRecommendations({
  storefrontSlug,
  outlet,
  cartProductIds,
  cartItems,
  onSelect,
  sessionId,
}) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(0)
  const impressionKeysRef = useRef(new Set())
  const productKey = cartProductIds.join(',')
  const hasCartProducts = productKey.length > 0
  const sourcePriceByProductId = new Map((cartItems || []).map((item) => [String(item.productId), Number(item.unitPriceMinor || 0)]))

  useEffect(() => {
    const requestId = ++requestRef.current
    const productIds = productKey.split(',').filter(Boolean)
    if (!storefrontSlug || !outlet?.id || !hasCartProducts) {
      setRecommendations([])
      setLoading(false)
      return undefined
    }
    if (typeof phase5ApiClient.public.getRecommendations !== 'function') {
      // Keep the cart usable while an older cached bundle is being replaced.
      setRecommendations([])
      setLoading(false)
      return undefined
    }

    setRecommendations([])
    setLoading(true)
    phase5ApiClient.public
      .getRecommendations(storefrontSlug, {
        outletId: outlet.id,
        cartProductIds: productIds,
        placement: 'cart',
      })
      .then((response) => {
        if (requestId !== requestRef.current) return
        setRecommendations(
          filterRecommendations(response?.data || response, productIds)
        )
      })
      .catch(() => requestId === requestRef.current && setRecommendations([]))
      .finally(() => requestId === requestRef.current && setLoading(false))

    return () => {
      requestRef.current += 1
    }
  }, [hasCartProducts, outlet?.id, productKey, storefrontSlug])

  useEffect(() => {
    if (!recommendations.length || !storefrontSlug || !outlet?.id) return
    const contextKey = `${storefrontSlug}:${outlet.id}:${productKey}`
    recommendations.forEach((recommendation) => {
      const key = `${contextKey}:${recommendation.recommendationId || recommendation.productId}`
      if (impressionKeysRef.current.has(key)) return
      impressionKeysRef.current.add(key)
      void track({
        storefront_slug: storefrontSlug,
        outlet_id: outlet.id,
        event_type: 'impression',
        placement: 'cart',
        recommendation_id: recommendation.recommendationId,
        target_product_id: recommendation.targetProductId,
        session_id: sessionId,
      })
    })
  }, [outlet?.id, productKey, recommendations, sessionId, storefrontSlug])

  if (!recommendations.length) return null

  return (
    <section
      className='border-y border-gray-100 bg-gray-50/70 px-4 py-4'
      aria-label='Rekomendasi untukmu'
    >
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='min-w-0 text-sm font-black text-gray-900'>
          Mungkin kamu suka
        </h3>
        {loading && (
          <span className='shrink-0 text-[10px] font-bold text-gray-400'>
            Memuat...
          </span>
        )}
      </div>
      <div className='grid gap-2'>
        {recommendations.map((recommendation) => (
          <article
            key={recommendation.productId}
            className='flex min-w-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm'
          >
            <div className='h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-50)]'>
              {recommendation.imageUrl ? (
                <img
                  src={recommendation.imageUrl}
                  alt=''
                  width='56'
                  height='56'
                  decoding='async'
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-lg font-black text-[var(--brand-500)]'>
                  {recommendation.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-black text-gray-900'>
                {recommendation.name}
              </p>
              {recommendation.headline && (
                <p className='truncate text-[11px] text-gray-500'>
                  {recommendation.headline}
                </p>
              )}
              <p className='text-xs font-bold text-[var(--brand-600)]'>
                {recommendation.actionType === 'replace_source' && sourcePriceByProductId.has(String(recommendation.sourceProductId))
                  ? `+${formatCurrency(recommendation.unitPriceMinor - sourcePriceByProductId.get(String(recommendation.sourceProductId)))}`
                  : formatCurrency(recommendation.unitPriceMinor)}
              </p>
              <p className='text-[10px] font-medium text-gray-400'>{recommendation.actionType === 'replace_source' ? 'Mengganti ukuran item di keranjang' : 'Harga menu ditambahkan ke keranjang'}</p>
            </div>
            <button
              type='button'
              className='shrink-0 rounded-full bg-[var(--brand-500)] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-[var(--brand-600)]'
              aria-label={`Tambah ${recommendation.name}`}
              onClick={() => {
                void track({
                  storefront_slug: storefrontSlug,
                  outlet_id: outlet.id,
                  event_type: 'clicked',
                  placement: 'cart',
                  recommendation_id: recommendation.recommendationId,
                  target_product_id: recommendation.targetProductId,
                  session_id: sessionId,
                })
                onSelect(recommendation)
              }}
            >
              {recommendation.actionType === 'replace_source' ? 'Upgrade' : 'Pilih'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
