import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGlobe,
  faUser,
  faTrash,
  faImage,
  faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons'
import BrandIcon from '../../../shared/components/brand/BrandIcon'
import OrderStatusBadge from './OrderStatusBadge'

export default function OrdersTable({
  orders = [],
  selectedOrder,
  onSelectOrder,
  onDeleteOrder,
  onViewImage,
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null)

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  const toggleDropdown = (orderId, event) => {
    event.stopPropagation()
    setOpenDropdownId((prev) => (prev === orderId ? null : orderId))
  }
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number)
  }

  const getOutletColor = (outlet) => {
    const map = {
      Samarinda: 'bg-emerald-100 text-emerald-800',
      Tenggarong: 'bg-indigo-100 text-indigo-800',
      Bontang: 'bg-amber-100 text-amber-800',
      Balikpapan: 'bg-rose-100 text-rose-800',
    }
    return map[outlet] || 'bg-gray-100 text-gray-800'
  }

  const getChannelIcon = (channel) => {
    const chan = channel ? channel.toLowerCase() : ''
    if (
      chan === 'whatsapp' ||
      chan === 'telegram' ||
      chan === 'instagram' ||
      chan === 'facebook'
    ) {
      return <BrandIcon type={chan} size={14} />
    }
    if (chan === 'website') {
      return (
        <FontAwesomeIcon icon={faGlobe} className='text-blue-500 text-[14px]' />
      )
    }
    return (
      <FontAwesomeIcon icon={faUser} className='text-gray-500 text-[14px]' />
    )
  }

  return (
    <div className='min-h-0 flex-1 overflow-auto bg-white border-x border-b border-gray-200'>
      <table className='w-full min-w-[1080px] text-left border-collapse'>
        <thead className='bg-gray-50 border-b border-gray-200 sticky top-0 z-10'>
          <tr>
            <th className='w-[140px] min-w-[140px] px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Order ID
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Customer
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Outlet
            </th>
            <th className='w-[80px] min-w-[80px] px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center'>
              Channel
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Items
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Total
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Payment Status
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Order Status
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>
              Created At
            </th>
            <th className='px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right'>
              Action
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100'>
          {orders.map((order) => {
            const isSelected = selectedOrder?._id === order._id
            const createdDate = new Date(order.createdAt)
            const timeStr = createdDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const dateStr = createdDate.toLocaleDateString([], {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })

            return (
              <tr
                key={order._id}
                onClick={() => onSelectOrder(order)}
                className={`hover:bg-slate-50/60 cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-[var(--brand-50)] hover:bg-[var(--brand-50)]'
                    : ''
                }`}
              >
                {/* Order ID */}
                <td
                  className={`py-4.5 pr-6 text-[12px] font-mono text-gray-800 transition-all duration-150 w-[140px] min-w-[140px] ${
                    isSelected
                      ? 'border-l-4 border-l-brand-500 pl-5'
                      : 'border-l-4 border-l-transparent pl-5'
                  }`}
                >
                  <div className='flex flex-col min-w-0'>
                    <span className='font-mono text-[12px] font-semibold tracking-tight truncate' title={order.orderIdDisplay}>
                      {order.orderIdDisplay}
                    </span>
                    {order.status === 'new' && (
                      <span className='inline-flex items-center w-max mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-sans'>
                        New
                      </span>
                    )}
                  </div>
                </td>

                {/* Customer */}
                <td className='px-6 py-4.5'>
                  <div className='flex flex-col'>
                    <span className='text-sm font-bold text-gray-800'>
                      {order.contactId?.name || 'Unknown'}
                    </span>
                    <span className='text-gray-400 text-xs mt-0.5'>
                      {order.contactId?.phone || order.contactId?.id || '-'}
                    </span>
                  </div>
                </td>

                {/* Outlet */}
                <td className='px-6 py-4.5'>
                  <div className='flex items-center gap-2'>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getOutletColor(order.outlet)}`}
                    >
                      {order.outlet ? order.outlet[0] : 'S'}
                    </div>
                    <span className='text-sm font-medium text-gray-700'>
                      {order.outlet || 'Samarinda'}
                    </span>
                  </div>
                </td>

                {/* Channel */}
                <td className='w-[80px] min-w-[80px] px-4 py-4.5 text-center'>
                  <div className='inline-flex items-center justify-center' title={order.channel || 'WhatsApp'}>
                    {getChannelIcon(order.channel)}
                  </div>
                </td>

                {/* Items */}
                <td className='px-6 py-4.5 text-sm text-gray-600 font-medium'>
                  {order.itemsCount || '0 items'}
                </td>

                {/* Total */}
                <td className='px-6 py-4.5 text-sm font-bold text-gray-800'>
                  {formatRupiah(order.total)}
                </td>

                {/* Payment Status */}
                <td className='px-6 py-4.5'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {order.paymentStatus || 'Unpaid'}
                    </span>
                    {order.paymentProofUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewImage(order.paymentProofUrl)
                        }}
                        className='p-1 text-gray-400 hover:text-brand-500 hover:bg-gray-100 rounded transition duration-150'
                        title='View payment proof'
                      >
                        <FontAwesomeIcon icon={faImage} className='text-xs' />
                      </button>
                    )}
                  </div>
                </td>

                {/* Order Status */}
                <td className='px-6 py-4.5'>
                  <OrderStatusBadge status={order.status} />
                </td>

                {/* Created At */}
                <td className='px-6 py-4.5'>
                  <div className='flex flex-col text-xs text-gray-500'>
                    <span className='font-semibold text-gray-700'>
                      {timeStr}
                    </span>
                    <span className='mt-0.5'>{dateStr}</span>
                  </div>
                </td>

                {/* Action */}
                <td
                  className='px-6 py-4.5 text-right relative'
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className='flex items-center justify-end gap-2'>
                    <button
                      onClick={() => onSelectOrder(order)}
                      className='bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] shadow-[var(--orders-card-shadow)] transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]'
                    >
                      View
                    </button>
                    <div className='relative inline-block text-left'>
                      <button
                        onClick={(e) => toggleDropdown(order._id, e)}
                        className={`border-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] w-8 h-8 rounded-lg flex items-center justify-center transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
                          openDropdownId === order._id
                            ? 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                            : ''
                        }`}
                        title='More actions'
                      >
                        <FontAwesomeIcon
                          icon={faEllipsisVertical}
                          className='text-sm'
                        />
                      </button>

                      {openDropdownId === order._id && (
                        <div className='absolute right-0 mt-1 w-44 bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-xl shadow-lg py-1.5 z-50 text-left animate-in fade-in duration-100'>
                          <button
                            onClick={() => {
                              setOpenDropdownId(null)
                              onDeleteOrder(
                                order._id,
                                order.contactId?.name || 'Unknown'
                              )
                            }}
                            className='w-full border-0 px-4 py-2 text-xs font-bold text-[var(--danger-600)] hover:bg-[var(--danger-50)] flex items-center gap-2 transition duration-150 cursor-pointer text-left'
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className='text-[10px]'
                            />
                            Delete Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
          {orders.length === 0 && (
            <tr>
              <td
                colSpan='10'
                className='text-center py-12 text-gray-400 text-sm font-medium'
              >
                No orders found matching the filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
