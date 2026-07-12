import { useState } from 'react'

export default function OrderProductThumbnail({ imageUrl, name = 'Menu', className = 'h-14 w-14' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !imageFailed

  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-[var(--brand-50)] to-amber-50`}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-black text-[var(--store-primary)]">
          {String(name).slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )
}
