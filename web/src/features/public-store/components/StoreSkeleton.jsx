export default function StoreSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-label="Memuat toko">
      <div className="h-24 animate-pulse rounded-3xl bg-gray-100" />
      <div className="h-12 animate-pulse rounded-2xl bg-gray-100" />
      <div className="flex gap-2">
        <div className="h-11 w-24 animate-pulse rounded-full bg-gray-100" />
        <div className="h-11 w-24 animate-pulse rounded-full bg-gray-100" />
      </div>
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-3xl bg-gray-100" />
      ))}
    </div>
  )
}
