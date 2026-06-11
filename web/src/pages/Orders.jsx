import React, { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faImage, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [agents, setAgents] = useState({});
    const [cancelModal, setCancelModal] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== 'all') params.status = filter;
            const res = await api.get('/orders', { params });
            setOrders(res.data);

            // Load agents for price lookup
            const agentIds = [...new Set(res.data.map(o => o.agentId).filter(Boolean))];
            const agentMap = {};
            for (const agentId of agentIds) {
                try {
                    const agentRes = await api.get(`/agents/${agentId}`);
                    agentMap[agentId] = agentRes.data;
                } catch (err) {
                    console.error('Failed to load agent:', agentId);
                }
            }
            setAgents(agentMap);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/orders/${id}`, { status: newStatus });
            setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const openCancelModal = (order) => {
        setCancelModal(order);
        setCancelReason('');
    };

    const closeCancelModal = () => {
        setCancelModal(null);
        setCancelReason('');
    };

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            alert('Mohon masukkan alasan pembatalan');
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/orders/${cancelModal._id}/cancel`, { reason: cancelReason });
            setOrders(orders.map(o => o._id === cancelModal._id ? { ...o, status: 'cancelled', notes: cancelReason } : o));
            closeCancelModal();
        } catch (err) {
            alert('Gagal membatalkan order: ' + (err.response?.data?.error || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const calculateOrderPrice = (order, agent) => {
        if (!agent || !agent.salesForms) return null;

        const salesForm = agent.salesForms.find(f => f.name === order.formName);
        if (!salesForm || !salesForm.products || salesForm.products.length === 0) return null;

        const formData = order.formData;

        const itemNameKey = Object.keys(formData).find(k =>
            k.toLowerCase().includes('item') && k.toLowerCase().includes('name')
        );
        const quantityKey = Object.keys(formData).find(k =>
            k.toLowerCase() === 'quantity' || k.toLowerCase() === 'qty'
        );

        if (!itemNameKey || !quantityKey) return null;

        const itemName = formData[itemNameKey];
        const quantity = parseInt(formData[quantityKey]) || 1;

        const product = salesForm.products.find(p =>
            p.name.toLowerCase() === itemName.toLowerCase()
        );

        if (!product) return null;

        const unitPrice = product.price || 0;
        const subtotal = unitPrice * quantity;

        return {
            itemName: product.name,
            quantity,
            unitPrice,
            subtotal
        };
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
    };

    const handleDeleteOrder = async (orderId, orderName) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus order dari ${orderName}?`)) {
            return;
        }

        try {
            await api.delete(`/orders/${orderId}`);
            setOrders(orders.filter(o => o._id !== orderId));
        } catch (err) {
            alert('Gagal menghapus order: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <div className="header" style={{ marginBottom: 20 }}>
                <h2>Incoming Orders</h2>
                <div className="filters" style={{ display: 'flex', gap: 10 }}>
                    <select className="select" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="processed">Processed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px',
                    alignItems: 'start'
                }}>
                    {orders.map(order => {
                        const agent = agents[order.agentId];
                        const priceInfo = calculateOrderPrice(order, agent);

                        const entries = Object.entries(order.formData);

                        const totalEntry = entries.find(([key]) =>
                            key.toLowerCase().includes('total')
                        );

                        const metadata = entries.filter(([key, val]) =>
                            val !== 0 &&
                            val !== '0' &&
                            (key.toLowerCase().includes('outlet') ||
                                key.toLowerCase().includes('less') ||
                                key.toLowerCase().includes('sugar') ||
                                key.toLowerCase().includes('ice') ||
                                (key.toLowerCase().includes('nama') && !key.toLowerCase().includes('item')) ||
                                (key.toLowerCase().includes('name') && !key.toLowerCase().includes('item')))
                        );

                        const itemFields = entries.filter(([key, val]) =>
                            val !== 0 &&
                            val !== '0' &&
                            (key.toLowerCase().includes('item') || key.toLowerCase().includes('quantity')) &&
                            !key.toLowerCase().includes('total')
                        );

                        const calculatedTotal = priceInfo ? priceInfo.subtotal : null;
                        const displayTotal = totalEntry ? totalEntry[1] : (calculatedTotal ? formatRupiah(calculatedTotal) : null);

                        return (
                            <div key={order._id} style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                border: '1px solid #f0f0f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '4px',
                                    background: 'linear-gradient(90deg, #ff6b6b, #ff8e53)',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%'
                                }} />

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteOrder(order._id, order.contactId?.name || 'Unknown')}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ef4444',
                                        fontSize: '0.9em',
                                        transition: 'all 0.2s ease',
                                        zIndex: 10
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ef4444';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.color = '#ef4444';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    title="Hapus Order"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>

                                <div style={{
                                    textAlign: 'center',
                                    borderBottom: '2px dashed #eee',
                                    paddingBottom: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '4px' }}>
                                        {new Date(order.createdAt).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>
                                        {order.contactId?.name || 'Unknown User'}
                                    </div>
                                    <div style={{ color: '#666', fontSize: '0.9em' }}>
                                        {order.contactId?.phone}
                                    </div>
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '0.8em',
                                        background: '#f8f9fa',
                                        display: 'inline-block',
                                        alignSelf: 'center',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        color: '#666'
                                    }}>
                                        {order.formName}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    paddingBottom: '12px',
                                }}>
                                    {priceInfo ? (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{
                                                fontSize: '0.95em',
                                                color: '#333',
                                                fontWeight: '500',
                                                marginBottom: '4px'
                                            }}>
                                                {priceInfo.itemName}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.85em',
                                                color: '#666'
                                            }}>
                                                <span>{priceInfo.quantity} × {formatRupiah(priceInfo.unitPrice)}</span>
                                                <span style={{ fontWeight: '600', color: '#333' }}>
                                                    {formatRupiah(priceInfo.subtotal)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        itemFields.map(([key, val]) => (
                                            <div key={key} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.95em',
                                                marginBottom: '4px'
                                            }}>
                                                <span style={{ color: '#555', textTransform: 'capitalize' }}>{key}</span>
                                                <span style={{ fontWeight: '600', color: '#333' }}>{val}</span>
                                            </div>
                                        ))
                                    )}

                                    {metadata.length > 0 && (
                                        <div style={{
                                            borderTop: '1px solid #f0f0f0',
                                            paddingTop: '8px',
                                            marginTop: '4px'
                                        }}>
                                            {metadata.map(([key, val]) => (
                                                <div key={key} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.85em',
                                                    color: '#666',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                                    <span style={{ fontWeight: '500' }}>{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {displayTotal && (
                                        <div style={{
                                            borderTop: '2px dashed #ddd',
                                            paddingTop: '12px',
                                            marginTop: '8px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    fontSize: '1.05em',
                                                    fontWeight: '700',
                                                    color: '#333',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    Total
                                                </span>
                                                <span style={{
                                                    fontSize: '1.15em',
                                                    fontWeight: '700',
                                                    color: '#ff6b6b'
                                                }}>
                                                    {displayTotal}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Proof Icon */}
                                    {order.paymentProofUrl && (
                                        <div style={{
                                            borderTop: '1px solid #f0f0f0',
                                            paddingTop: '12px',
                                            marginTop: '8px',
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${order.paymentProofUrl}`;
                                                    console.log('Opening image:', imageUrl);
                                                    openImageModal(imageUrl);
                                                }}
                                                style={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '30px',
                                                    height: '30px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '0.9em',
                                                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                                                }}
                                                title="Lihat Bukti Transfer"
                                            >
                                                <FontAwesomeIcon icon={faImage} />
                                            </button>
                                            <span style={{ fontSize: '0.85em', color: '#666' }}>Bukti Transfer</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer: Status & Action */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                    <div style={{ fontSize: '0.9em', fontWeight: '500', color: '#888' }}>Status</div>
                                    {order.status === 'new' ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                className="btn small"
                                                style={{
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 16px',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.9em'
                                                }}
                                                onClick={() => openCancelModal(order)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn small"
                                                style={{
                                                    background: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 16px',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.9em'
                                                }}
                                                onClick={() => handleStatusChange(order._id, 'processed')}
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: '#f8fafc',
                                                fontSize: '0.9em',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                color: '#475569'
                                            }}
                                        >
                                            <option value="new">New</option>
                                            <option value="processed">Processed</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {orders.length === 0 && (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '40px',
                            color: '#888',
                            background: 'white',
                            borderRadius: '12px'
                        }}>
                            No orders found.
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Modal */}
            {cancelModal && (
                <div
                    onClick={closeCancelModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Batalkan Pesanan</h3>
                            <button
                                onClick={closeCancelModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5em',
                                    cursor: 'pointer',
                                    color: '#999',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px'
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '12px' }}>
                                Pesanan dari: <strong>{cancelModal.contactId?.name}</strong>
                            </p>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: '500',
                                color: '#333'
                            }}>
                                Alasan Pembatalan:
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Contoh: Pembayaran tidak valid, Lagi ramai, Tidak dapat melayani..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95em',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={closeCancelModal}
                                disabled={submitting}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={submitting}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#ef4444',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Membatalkan...' : 'Batalkan Pesanan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    onClick={closeImageModal}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        cursor: 'pointer',
                        padding: '20px'
                    }}
                >
                    <img
                        src={selectedImage}
                        alt="Payment Proof Full Size"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        color: 'white',
                        fontSize: '2em',
                        cursor: 'pointer',
                        background: 'rgba(0,0,0,0.5)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        ×
                    </div>
                </div>
            )}
        </div>
    );
}
