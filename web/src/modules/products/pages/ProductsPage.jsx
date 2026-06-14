import React, { useState, useMemo } from 'react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import ActiveFilterChips from '../../../shared/components/ui/ActiveFilterChips'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../../shared/components/feedback/Toast'
import ProductsSummaryCards from '../components/ProductsSummaryCards'
import ProductsToolbar from '../components/ProductsToolbar'
import ProductsTable from '../components/ProductsTable'
import ProductDetailDrawer from '../components/ProductDetailDrawer'
import ProductFormDrawer from '../components/ProductFormDrawer'
import { useProducts, useMutateProduct } from '../hooks/useProducts'
import { productsApi } from '../api/productsApi'

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    outlet: 'all',
    status: '',
    availability: '',
    search: '',
  })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)

  const { data: products, isLoading, error, refetch } = useProducts(filters)
  const { mutate, isPending } = useMutateProduct()
  const toast = useToast()

  const activeFilters = useMemo(() => {
    const chips = []
    if (filters.outlet && filters.outlet !== 'all')
      chips.push({ key: 'outlet', label: `Outlet: ${filters.outlet}` })
    if (filters.status)
      chips.push({ key: 'status', label: `Status: ${filters.status}` })
    if (filters.availability)
      chips.push({ key: 'availability', label: `Availability: ${filters.availability}` })
    if (filters.search)
      chips.push({ key: 'search', label: `Search: "${filters.search}"` })
    return chips
  }, [filters])

  const handleRemoveFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: key === 'outlet' ? 'all' : '' }))

  const handleClearFilters = () =>
    setFilters({ outlet: 'all', status: '', availability: '', search: '' })

  const handleSave = async (formData) => {
    await mutate(() =>
      editingProduct
        ? productsApi.update(editingProduct._id, formData)
        : productsApi.create(formData)
    )
    toast.success(editingProduct ? 'Product updated' : 'Product created')
    setShowForm(false)
    setEditingProduct(null)
    refetch()
  }

  const handleArchive = async () => {
    const target = archiveTarget
    await mutate(() => productsApi.archive(target._id))
    toast.success('Product archived')
    setArchiveTarget(null)
    if (selectedProduct?._id === target._id) setSelectedProduct(null)
    refetch()
  }

  const handleRestore = async (product) => {
    await mutate(() => productsApi.restore(product._id))
    toast.success('Product restored')
    refetch()
  }

  const openEdit = (p) => {
    setEditingProduct(p)
    setShowForm(true)
    setSelectedProduct(null)
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Products"
        description="Manage the catalog and availability across your outlets"
        primaryAction={{
          label: '+ Add Product',
          onClick: () => {
            setEditingProduct(null)
            setShowForm(true)
          },
        }}
      />

      <ProductsToolbar filters={filters} onChange={setFilters} />

      <ActiveFilterChips
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearFilters}
      />

      <ProductsSummaryCards products={products} isLoading={isLoading} />

      {error && (
        <div
          style={{
            color: 'var(--danger-500)',
            padding: '12px 16px',
            background: 'var(--danger-50)',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{error}</span>
          <button
            className="btn ghost"
            onClick={refetch}
            style={{ marginLeft: 'auto', fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      <ProductsTable
        products={products}
        isLoading={isLoading}
        selectedOutletId={filters.outlet}
        onSelect={setSelectedProduct}
        onEdit={openEdit}
        onArchive={setArchiveTarget}
        onRestore={handleRestore}
      />

      <ProductDetailDrawer
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={openEdit}
      />

      <ProductFormDrawer
        open={showForm}
        product={editingProduct}
        onClose={() => {
          setShowForm(false)
          setEditingProduct(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive product?"
        description={`"${archiveTarget?.name}" will be hidden from the catalog. Historical orders keep their snapshot.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
        isLoading={isPending}
      />
    </div>
  )
}
