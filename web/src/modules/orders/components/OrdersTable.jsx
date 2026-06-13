import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faGlobe, faUser, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import BrandIcon from '../../../shared/components/brand/BrandIcon';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrdersTable({
  orders = [],
  selectedOrder,
  onSelectOrder,
  onDeleteOrder,
  onViewImage
}) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const getOutletColor = (outlet) => {
    const map = {
      Samarinda: 'bg-emerald-100 text-emerald-800',
      Tenggarong: 'bg-indigo-100 text-indigo-800',
      Bontang: 'bg-amber-100 text-amber-800',
      Balikpapan: 'bg-rose-100 text-rose-800'
    };
    return map[outlet] || 'bg-gray-100 text-gray-800';
  };

  const getChannelIcon = (channel) => {
    const chan = channel ? channel.toLowerCase() : '';
    if (chan === 'whatsapp' || chan === 'telegram' || chan === 'instagram' || chan === 'facebook') {
      return <BrandIcon type={chan} size={14} />;
    }
    if (chan === 'website') {
      return <FontAwesomeIcon icon={faGlobe} className="text-blue-500 text-[14px]" />;
    }
    return <FontAwesomeIcon icon={faUser} className="text-gray-500 text-[14px]" />;
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white border-x border-b border-gray-200">
      <table className="w-full min-w-[1080px] text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outlet</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Status</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const isSelected = selectedOrder?._id === order._id;
            const createdDate = new Date(order.createdAt);
            const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = createdDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <tr
                key={order._id}
                onClick={() => onSelectOrder(order)}
                className={`hover:bg-slate-50/60 cursor-pointer transition-colors duration-150 ${
                  isSelected ? 'bg-orange-50/40 border-l-2 border-brand-500' : ''
                }`}
              >
                {/* Order ID */}
                <td className="px-6 py-4.5 text-sm font-semibold text-gray-800">
                  <div className="flex flex-col">
                    <span>{order.orderIdDisplay}</span>
                    {order.status === 'new' && (
                      <span className="inline-flex items-center w-max mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </div>
                </td>

                {/* Customer */}
                <td className="px-6 py-4.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{order.contactId?.name || 'Unknown'}</span>
                    <span className="text-gray-400 text-xs mt-0.5">{order.contactId?.phone || '-'}</span>
                  </div>
                </td>

                {/* Outlet */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getOutletColor(order.outlet)}`}>
                      {order.outlet ? order.outlet[0] : 'S'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{order.outlet || 'Samarinda'}</span>
                  </div>
                </td>

                {/* Channel */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-2">
                    {getChannelIcon(order.channel)}
                    <span className="text-sm text-gray-700 capitalize">{order.channel || 'WhatsApp'}</span>
                  </div>
                </td>

                {/* Items */}
                <td className="px-6 py-4.5 text-sm text-gray-600 font-medium">
                  {order.itemsCount || '0 items'}
                </td>

                {/* Total */}
                <td className="px-6 py-4.5 text-sm font-bold text-gray-800">
                  {formatRupiah(order.total)}
                </td>

                {/* Payment Status */}
                <td className="px-6 py-4.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {order.paymentStatus || 'Unpaid'}
                    </span>
                    {order.paymentProofUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewImage(order.paymentProofUrl);
                        }}
                        className="p-1 text-gray-400 hover:text-brand-500 hover:bg-gray-100 rounded transition duration-150"
                        title="View payment proof"
                      >
                        <FontAwesomeIcon icon={faImage} className="text-xs" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Order Status */}
                <td className="px-6 py-4.5">
                  <OrderStatusBadge status={order.status} />
                </td>

                {/* Created At */}
                <td className="px-6 py-4.5">
                  <div className="flex flex-col text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{timeStr}</span>
                    <span className="mt-0.5">{dateStr}</span>
                  </div>
                </td>

                {/* Action */}
                <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="bg-white hover:bg-gray-50 border border-gray-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-gray-700 shadow-sm transition duration-150"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onDeleteOrder(order._id, order.contactId?.name || 'Unknown')}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-gray-50 transition duration-150"
                      title="Delete order"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan="10" className="text-center py-12 text-gray-400 text-sm font-medium">
                No orders found matching the filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
