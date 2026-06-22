import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faDownload,
  faSyncAlt,
  faStore,
  faCalendarAlt,
  faComment,
  faWallet,
  faCheckCircle,
  faTimes,
  faChevronDown,
  faTableColumns,
  faToggleOn,
  faToggleOff,
} from '@fortawesome/free-solid-svg-icons'
import {
  isDemoMode,
  setDemoMode,
  clearDemoMode,
  getDemoToken,
  getDemoUser,
} from '../../../mocks/demoState'

const filterOptions = {
  outlet: [
    { value: 'all', label: 'All Outlets' },
    { value: 'Samarinda', label: 'Samarinda' },
    { value: 'Tenggarong', label: 'Tenggarong' },
    { value: 'Bontang', label: 'Bontang' },
    { value: 'Balikpapan', label: 'Balikpapan' },
  ],
  date: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 Days' },
    { value: 'all', label: 'All Time' },
  ],
  channel: [
    { value: 'all', label: 'All Channels' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'website', label: 'Website' },
    { value: 'manual', label: 'Manual' },
  ],
  paymentStatus: [
    { value: 'all', label: 'All Payments' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
  ],
  orderStatus: [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
}

function OrdersFilterSelect({
  label,
  icon,
  value,
  options,
  onChange,
  defaultValue = 'all',
  className = '',
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label || options[0]?.label
  const isApplied = value !== defaultValue

  return (
    <label
      className={`relative flex h-[54px] min-w-0 flex-col justify-center rounded-xl border px-3 text-left transition focus-within:border-[var(--brand-500)] focus-within:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
        isApplied
          ? 'border-[var(--brand-400)] bg-[var(--brand-50)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-primary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)]'
      } ${className}`}
    >
      <span
        className={`mb-1 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${isApplied ? 'text-[var(--brand-600)]' : 'text-[var(--text-muted)]'}`}
      >
        {label}
      </span>
      <span className='pointer-events-none flex min-w-0 items-center gap-2 pr-5 text-xs font-bold text-[var(--text-primary)]'>
        <FontAwesomeIcon
          icon={icon}
          className={`shrink-0 text-[11px] ${isApplied ? 'text-[var(--brand-500)]' : 'text-[var(--text-subtle)]'}`}
        />
        <span className='truncate whitespace-nowrap'>{selectedLabel}</span>
      </span>
      <FontAwesomeIcon
        icon={faChevronDown}
        className='pointer-events-none absolute bottom-3.5 right-3 text-[10px] text-[var(--text-subtle)]'
      />
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className='absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function OrdersToolbar({
  filters = {},
  setFilters,
  onRefresh,
  onExport,
  lastUpdated = 'Just now',
  selectedOrder,
  isOrderDetailOpen = true,
  onShowOrderDetail,
}) {
  const isDemoActive = isDemoMode()

  const handleToggleDemo = () => {
    if (isDemoActive) {
      clearDemoMode()
    } else {
      setDemoMode(true)
      sessionStorage.setItem('token', getDemoToken())
      localStorage.setItem('token', getDemoToken())
      sessionStorage.setItem('user', JSON.stringify(getDemoUser()))
    }
    window.location.reload()
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      date: 'all',
      channel: 'all',
      paymentStatus: 'all',
      orderStatus: 'all',
      search: '',
    })
  }

  const hasActiveFilters =
    filters.outlet !== 'all' ||
    filters.date !== 'all' ||
    filters.channel !== 'all' ||
    filters.paymentStatus !== 'all' ||
    filters.orderStatus !== 'all' ||
    filters.search !== ''

  return (
    <div className='mb-2.5 flex shrink-0 flex-col'>
      <div className='orders-page-header mb-3 flex flex-col justify-between gap-4 xl:flex-row xl:items-start'>
        <div className='flex flex-col'>
          <div className='text-2xl font-bold leading-tight text-[var(--text-primary)]'>
            Orders
          </div>
          <div className='mt-1 text-xs leading-tight text-[var(--text-muted)]'>
            Manage orders across all outlets in your workspace
          </div>
        </div>
        <div className='orders-toolbar-actions flex flex-wrap items-center justify-end gap-2.5 xl:flex-nowrap'>
          <button
            onClick={onExport}
            className='flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition duration-200 hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          >
            <FontAwesomeIcon
              icon={faDownload}
              className='text-xs text-[var(--text-muted)]'
            />
            <span>Export</span>
          </button>
          <button
            type='button'
            onClick={handleToggleDemo}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
              isDemoActive
                ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300'
                : 'border-[var(--border-subtle)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <FontAwesomeIcon
              icon={isDemoActive ? faToggleOn : faToggleOff}
              className={`text-sm ${isDemoActive ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}
            />
            <span>Demo Mode: {isDemoActive ? 'ON' : 'OFF'}</span>
          </button>
          <div className='last-updated flex shrink-0 items-center text-xs font-medium text-[var(--text-muted)] xl:border-l xl:border-[var(--border-subtle)] xl:pl-3'>
            <span>Last updated: {lastUpdated}</span>
          </div>
          <button
            onClick={onRefresh}
            className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-[var(--text-muted)] transition duration-150 hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-secondary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
            title='Refresh'
            aria-label='Refresh orders'
          >
            <FontAwesomeIcon icon={faSyncAlt} />
          </button>
          {!isOrderDetailOpen && selectedOrder && (
            <button
              type='button'
              onClick={onShowOrderDetail}
              className='order-detail-restore-button flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 text-xs font-bold text-[var(--text-secondary)] transition duration-150 hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
              title='Show order details'
              aria-label={`Show order details for ${selectedOrder.orderIdDisplay}`}
            >
              <FontAwesomeIcon
                icon={faTableColumns}
                className='text-sm text-[var(--text-muted)]'
              />
              <span className='truncate'>{selectedOrder.orderIdDisplay}</span>
            </button>
          )}
        </div>
      </div>

      <div className='mb-2.5 flex flex-wrap gap-2.5 items-stretch'>
        <OrdersFilterSelect
          label='Outlet'
          icon={faStore}
          value={filters.outlet}
          options={filterOptions.outlet}
          onChange={(e) => handleFilterChange('outlet', e.target.value)}
          className='flex-1 min-w-[120px]'
        />
        <OrdersFilterSelect
          label='Date'
          icon={faCalendarAlt}
          value={filters.date}
          options={filterOptions.date}
          defaultValue='today'
          onChange={(e) => handleFilterChange('date', e.target.value)}
          className='flex-1 min-w-[120px]'
        />
        <OrdersFilterSelect
          label='Channel'
          icon={faComment}
          value={filters.channel}
          options={filterOptions.channel}
          onChange={(e) => handleFilterChange('channel', e.target.value)}
          className='flex-1 min-w-[120px]'
        />
        <OrdersFilterSelect
          label='Payment'
          icon={faWallet}
          value={filters.paymentStatus}
          options={filterOptions.paymentStatus}
          onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
          className='flex-1 min-w-[120px]'
        />
        <OrdersFilterSelect
          label='Order Status'
          icon={faCheckCircle}
          value={filters.orderStatus}
          options={filterOptions.orderStatus}
          onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
          className='flex-1 min-w-[120px]'
        />

        <div className='relative flex h-[54px] min-w-[200px] flex-1 items-center'>
          <input
            type='text'
            placeholder='Search by order ID, customer, phone...'
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className='h-full w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] pl-10 pr-3 text-xs font-medium text-[var(--text-primary)] transition placeholder:text-[var(--text-subtle)] hover:border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none focus:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          />
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-subtle)]'>
            <FontAwesomeIcon icon={faSearch} className='text-xs' />
          </div>
        </div>
      </div>

      {/* Showing Active Filters Status Bar */}
      <div className='rounded-lg border border-[var(--brand-100)] bg-[var(--brand-50)] px-4 py-2.5 flex items-center justify-between text-xs text-[var(--text-secondary)] shrink-0 font-medium gap-3'>
        <div className='flex items-center gap-1.5 flex-wrap min-w-0'>
          <span>Showing:</span>
          <span className='text-[var(--text-primary)] font-bold'>
            {filters.outlet === 'all' ? 'All Outlets' : filters.outlet}
          </span>
          <span className='text-[var(--brand-400)]'>·</span>
          <span>Date:</span>
          <span className='text-[var(--text-primary)] font-bold'>
            {filters.date === 'today'
              ? isDemoActive
                ? '16 May 2025 (Today)'
                : `${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (Today)`
              : filters.date === 'yesterday'
                ? isDemoActive
                  ? '15 May 2025 (Yesterday)'
                  : `${new Date(Date.now() - 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (Yesterday)`
                : filters.date === '7days'
                  ? 'Last 7 Days'
                  : 'All Time'}
          </span>
          {filters.channel !== 'all' && (
            <>
              <span className='text-[var(--brand-400)]'>·</span>
              <span>Channel:</span>
              <span className='text-[var(--text-primary)] font-bold capitalize'>
                {filters.channel}
              </span>
            </>
          )}
          {filters.paymentStatus !== 'all' && (
            <>
              <span className='text-[var(--brand-400)]'>·</span>
              <span>Payment:</span>
              <span className='text-[var(--text-primary)] font-bold'>
                {filters.paymentStatus}
              </span>
            </>
          )}
          {filters.orderStatus !== 'all' && (
            <>
              <span className='text-[var(--brand-400)]'>·</span>
              <span>Status:</span>
              <span className='text-[var(--text-primary)] font-bold capitalize'>
                {filters.orderStatus}
              </span>
            </>
          )}
          {filters.search && (
            <>
              <span className='text-[var(--brand-400)]'>·</span>
              <span>Keyword:</span>
              <span className='text-[var(--text-primary)] font-bold'>
                &ldquo;{filters.search}&rdquo;
              </span>
            </>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className='shrink-0 text-[var(--brand-600)] hover:text-[var(--brand-700)] font-bold hover:underline flex items-center gap-1 transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
          >
            <FontAwesomeIcon icon={faTimes} className='text-[10px]' />
            <span>Clear all</span>
          </button>
        )}
      </div>
    </div>
  )
}
