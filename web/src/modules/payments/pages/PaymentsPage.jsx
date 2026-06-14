import React, { useState, useMemo, useEffect, useCallback } from 'react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import ActiveFilterChips from '../../../shared/components/ui/ActiveFilterChips'
import EmptyState from '../../../shared/components/ui/EmptyState'
import { useToast } from '../../../shared/components/feedback/Toast'
import PaymentsSummaryCards from '../components/PaymentsSummaryCards'
import PaymentsToolbar from '../components/PaymentsToolbar'
import PaymentsTable from '../components/PaymentsTable'
import PaymentDetailDrawer from '../components/PaymentDetailDrawer'
import { paymentsApi } from '../api/paymentsApi'

function usePayments(filters) {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [gatewayNotConfigured, setGatewayNotConfigured] = useState(false)

  // Stringify filters for stable dep
  const filtersKey = JSON.stringify(filters)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await paymentsApi.list(filters)
      setData(res.data?.data || res.data || [])
      setGatewayNotConfigured(false)
    } catch (e) {
      if (e?.response?.status === 404 || e?.response?.status === 503) {
        setGatewayNotConfigured(true)
      } else {
        setError(e?.response?.data?.message || 'Failed to load payments')
      }
    } finally {
      setIsLoading(false)
    }
  }, [filtersKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  return { data, isLoading, error, gatewayNotConfigured, refetch: fetchData }
}

export default function PaymentsPage() {
  const [filters, setFilters] = useState({
    outlet: 'all',
    status: '',
    provider: '',
    channel: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { data: payments, isLoading, error, gatewayNotConfigured, refetch } = usePayments(filters)
  const toast = useToast()

  const activeFilters = useMemo(() => {
    const chips = []
    if (filters.outlet && filters.outlet !== 'all') chips.push({ key: 'outlet', label: `Outlet: ${filters.outlet}` })
    if (filters.status) chips.push({ key: 'status', label: `Status: ${filters.status}` })
    if (filters.provider) chips.push({ key: 'provider', label: `Provider: ${filters.provider}` })
    if (filters.channel) chips.push({ key: 'channel', label: `Channel: ${filters.channel}` })
    if (filters.search) chips.push({ key: 'search', label: `Search: "${filters.search}"` })
    if (filters.dateFrom) chips.push({ key: 'dateFrom', label: `From: ${filters.dateFrom}` })
    if (filters.dateTo) chips.push({ key: 'dateTo', label: `To: ${filters.dateTo}` })
    return chips
  }, [filters])

  const handleRefresh = () => {
    refetch()
    setLastUpdated(new Date().toLocaleTimeString())
  }

  const handleResendLink = async (payment) => {
    try {
      await paymentsApi.resendLink(payment._id)
      toast.success('Payment link resent')
    } catch {
      toast.error('Failed to resend link')
    }
  }

  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: key === 'outlet' ? 'all' : '' }))
  const clearAllFilters = () => setFilters({ outlet: 'all', status: '', provider: '', channel: '', search: '', dateFrom: '', dateTo: '' })

  if (gatewayNotConfigured) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <PageHeader title="Payments" description="Monitor payment links and transactions across all outlets" />
        <EmptyState
          icon="💳"
          title="Payment gateway is not configured"
          description="Configure a sandbox provider in Settings before enabling checkout payments."
          action={{ label: 'Open Payment Settings', onClick: () => { window.location.href = '/app/settings' } }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Payments"
        description="Monitor payment links and transactions across all outlets"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />
      <PaymentsToolbar filters={filters} onChange={setFilters} />
      <ActiveFilterChips
        filters={activeFilters}
        onRemove={clearFilter}
        onClearAll={clearAllFilters}
      />
      <PaymentsSummaryCards payments={payments} isLoading={isLoading} />
      {error && (
        <div style={{
          color: 'var(--danger-500)',
          padding: 16,
          background: 'var(--danger-50)',
          borderRadius: 8,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          {error}
          <button className="btn ghost" onClick={refetch} style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}
      <PaymentsTable payments={payments} isLoading={isLoading} onSelect={setSelectedPayment} />
      <PaymentDetailDrawer
        payment={selectedPayment}
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onResendLink={handleResendLink}
        onOpenOrder={(orderId) => window.open(`/app/orders?id=${orderId}`, '_blank')}
      />
    </div>
  )
}
