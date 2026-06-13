import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faTableColumns
} from '@fortawesome/free-solid-svg-icons';

const filterOptions = {
  outlet: [
    { value: 'all', label: 'All Outlets' },
    { value: 'Samarinda', label: 'Samarinda' },
    { value: 'Tenggarong', label: 'Tenggarong' },
    { value: 'Bontang', label: 'Bontang' },
    { value: 'Balikpapan', label: 'Balikpapan' }
  ],
  date: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 Days' },
    { value: 'all', label: 'All Time' }
  ],
  channel: [
    { value: 'all', label: 'All Channels' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'website', label: 'Website' },
    { value: 'manual', label: 'Manual' }
  ],
  paymentStatus: [
    { value: 'all', label: 'All Payments' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' }
  ],
  orderStatus: [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]
};

function OrdersFilterSelect({ label, icon, value, options, onChange, className = '' }) {
  const selectedLabel = options.find((option) => option.value === value)?.label || options[0]?.label;

  return (
    <label className={`relative flex h-[54px] min-w-0 flex-col justify-center rounded-xl border border-gray-200 bg-white px-3 text-left transition hover:bg-gray-50 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 ${className}`}>
      <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">
        {label}
      </span>
      <span className="pointer-events-none flex min-w-0 items-center gap-2 pr-5 text-xs font-bold text-gray-700">
        <FontAwesomeIcon icon={icon} className="shrink-0 text-[11px] text-gray-400" />
        <span className="truncate whitespace-nowrap">{selectedLabel}</span>
      </span>
      <FontAwesomeIcon
        icon={faChevronDown}
        className="pointer-events-none absolute bottom-3.5 right-3 text-[10px] text-gray-400"
      />
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function OrdersToolbar({
  filters = {},
  setFilters,
  onRefresh,
  onExport,
  lastUpdated = 'Just now',
  selectedOrder,
  isOrderDetailOpen = true,
  onShowOrderDetail
}) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      outlet: 'all',
      date: 'today',
      channel: 'all',
      paymentStatus: 'all',
      orderStatus: 'all',
      search: ''
    });
  };

  const hasActiveFilters =
    filters.outlet !== 'all' ||
    filters.date !== 'today' ||
    filters.channel !== 'all' ||
    filters.paymentStatus !== 'all' ||
    filters.orderStatus !== 'all' ||
    filters.search !== '';

  return (
    <div className="mb-2.5 flex shrink-0 flex-col">
      <div className="orders-page-header mb-3 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="flex flex-col">
          <div className="text-2xl font-bold leading-tight text-gray-800">Orders</div>
          <div className="mt-1 text-xs leading-tight text-gray-500">
            Manage orders across all outlets in your workspace
          </div>
        </div>
        <div className="orders-toolbar-actions flex flex-wrap items-center justify-end gap-2.5 xl:flex-nowrap">
          <button
            onClick={onExport}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition duration-200 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faDownload} className="text-xs text-gray-500" />
            <span>Export</span>
          </button>
          <div className="last-updated flex shrink-0 items-center text-xs font-medium text-gray-400 xl:border-l xl:border-gray-200 xl.pl-3">
            <span>Last updated: {lastUpdated}</span>
          </div>
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition duration-150 hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            title="Refresh"
            aria-label="Refresh orders"
          >
            <FontAwesomeIcon icon={faSyncAlt} />
          </button>
          {!isOrderDetailOpen && selectedOrder && (
            <button
              type="button"
              onClick={onShowOrderDetail}
              className="order-detail-restore-button flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-slate-700 transition duration-150 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              title="Show order details"
              aria-label={`Show order details for ${selectedOrder.orderIdDisplay}`}
            >
              <FontAwesomeIcon icon={faTableColumns} className="text-sm text-slate-400" />
              <span className="truncate">{selectedOrder.orderIdDisplay}</span>
            </button>
          )}
        </div>
      </div>

      <div className="mb-2.5 flex flex-wrap gap-2.5 items-stretch">
        <OrdersFilterSelect
          label="Outlet"
          icon={faStore}
          value={filters.outlet}
          options={filterOptions.outlet}
          onChange={(e) => handleFilterChange('outlet', e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <OrdersFilterSelect
          label="Date"
          icon={faCalendarAlt}
          value={filters.date}
          options={filterOptions.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <OrdersFilterSelect
          label="Channel"
          icon={faComment}
          value={filters.channel}
          options={filterOptions.channel}
          onChange={(e) => handleFilterChange('channel', e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <OrdersFilterSelect
          label="Payment"
          icon={faWallet}
          value={filters.paymentStatus}
          options={filterOptions.paymentStatus}
          onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <OrdersFilterSelect
          label="Order Status"
          icon={faCheckCircle}
          value={filters.orderStatus}
          options={filterOptions.orderStatus}
          onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
          className="flex-1 min-w-[120px]"
        />

        <div className="relative flex h-[54px] min-w-[200px] flex-1 items-center">
          <input
            type="text"
            placeholder="Search by order ID, customer, phone..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="h-full w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-xs font-medium text-gray-700 transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <FontAwesomeIcon icon={faSearch} className="text-xs" />
          </div>
        </div>
      </div>

      {/* Showing Active Filters Status Bar */}
      <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 shrink-0 font-medium gap-3">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span>Showing:</span>
          <span className="text-emerald-900 font-bold">
            {filters.outlet === 'all' ? 'All Outlets' : filters.outlet}
          </span>
          <span className="text-gray-300">·</span>
          <span>Date:</span>
          <span className="text-emerald-900 font-bold">
            {filters.date === 'today' ? '16 May 2025 (Today)' :
             filters.date === 'yesterday' ? '15 May 2025 (Yesterday)' :
             filters.date === '7days' ? 'Last 7 Days' : 'All Time'}
          </span>
          {filters.channel !== 'all' && (
            <>
              <span className="text-gray-300">·</span>
              <span>Channel:</span>
              <span className="text-emerald-900 font-bold capitalize">{filters.channel}</span>
            </>
          )}
          {filters.paymentStatus !== 'all' && (
            <>
              <span className="text-gray-300">·</span>
              <span>Payment:</span>
              <span className="text-emerald-900 font-bold">{filters.paymentStatus}</span>
            </>
          )}
          {filters.orderStatus !== 'all' && (
            <>
              <span className="text-gray-300">·</span>
              <span>Status:</span>
              <span className="text-emerald-900 font-bold capitalize">{filters.orderStatus}</span>
            </>
          )}
          {filters.search && (
            <>
              <span className="text-gray-300">·</span>
              <span>Keyword:</span>
              <span className="text-emerald-900 font-bold">&ldquo;{filters.search}&rdquo;</span>
            </>
          )}
        </div>
        {(hasActiveFilters) && (
          <button
            onClick={clearAllFilters}
            className="shrink-0 text-emerald-600 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 transition duration-150"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
            <span>Clear all</span>
          </button>
        )}
      </div>
    </div>
  );
}
