export default function PickupOutletCard({ outlet }) {
  if (!outlet) return null
  return (
    <section className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
      <h2 className="m-0 text-sm font-black leading-tight text-gray-900">{outlet.name}</h2>
      <p className="m-0 mt-0.5 text-xs leading-normal text-gray-500">{outlet.address}</p>
      {outlet.distanceLabel && <p className="m-0 mt-0.5 text-[11px] font-bold leading-none text-[var(--brand-600)]">{outlet.distanceLabel}</p>}
    </section>
  )
}
