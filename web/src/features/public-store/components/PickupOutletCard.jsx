export default function PickupOutletCard({ outlet }) {
  if (!outlet) return null
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Outlet Pickup</p>
      <h2 className="mt-1 text-sm font-black text-gray-900">{outlet.name}</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500">{outlet.address}</p>
      {outlet.distanceLabel && <p className="mt-1 text-[11px] font-bold text-amber-600">{outlet.distanceLabel}</p>}
    </section>
  )
}
