# Shared Page Components

## Recommended shared components

```txt
web/src/shared/components/ui/PageHeader.jsx
web/src/shared/components/ui/FilterBar.jsx
web/src/shared/components/ui/ActiveFilterChips.jsx
web/src/shared/components/ui/DataTable.jsx
web/src/shared/components/ui/DetailDrawer.jsx
web/src/shared/components/ui/StatusBadge.jsx
web/src/shared/components/ui/SearchInput.jsx
web/src/shared/components/ui/ConfirmDialog.jsx
web/src/shared/components/ui/EmptyState.jsx
web/src/shared/components/ui/ErrorState.jsx
web/src/shared/components/ui/Skeleton.jsx
web/src/shared/components/feedback/Toast.jsx
```

Tidak harus membuat semua component dalam satu task. Extract hanya ketika minimal dua module benar-benar memakai pola yang sama.

## Page header props

```js
{
  title,
  description,
  primaryAction,
  secondaryActions,
  lastUpdated,
  isRefreshing,
  onRefresh
}
```

## Filter bar contract

```js
{
  outletId,
  dateRange,
  status,
  channel,
  search,
  extraFilters,
  onChange,
  onClearAll
}
```

Default filter tidak dihitung sebagai active filter.

## Status badge

Badge harus menerima semantic status, bukan warna mentah:

```js
<StatusBadge domain="payment" status="paid" />
<StatusBadge domain="order" status="preparing" />
<StatusBadge domain="platform" status="connected" />
```

Mapping warna ditempatkan terpusat.

## Detail drawer

Drawer dipakai untuk quick operational inspection tanpa kehilangan table context.

Drawer harus memiliki:

- title + identifier;
- status badge;
- metadata utama;
- grouped sections;
- sticky footer untuk action utama jika perlu;
- close button;
- loading, error, and not-found state;
- URL/deep-link optional, tetapi jangan wajib untuk MVP.

## Confirmation rule

Gunakan confirmation dialog untuk:

- archive product;
- disconnect/delete platform;
- cancel payment link bila didukung;
- delete conversation;
- reset destructive settings;
- actions yang memengaruhi outlet/workspace lain.

Tidak perlu confirmation untuk:

- filter change;
- opening drawer;
- copying ID/link;
- non-destructive refresh;
- simple tab switch.
