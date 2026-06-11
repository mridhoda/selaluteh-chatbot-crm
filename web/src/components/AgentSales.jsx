import React, { useState } from 'react';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function AgentSales({ agent, onUpdate }) {
    const [forms, setForms] = useState(agent.salesForms || []);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFormId, setCurrentFormId] = useState(null);

    // Form Editor State
    const [editName, setEditName] = useState('');
    const [editTriggers, setEditTriggers] = useState('');
    const [editFields, setEditFields] = useState('');
    const [editProducts, setEditProducts] = useState([]);

    const [outlets, setOutlets] = useState(agent.outlets || []);
    const [newOutlet, setNewOutlet] = useState('');

    const startEditing = (form) => {
        setCurrentFormId(form ? form._id : null);
        setEditName(form ? form.name : '');
        setEditTriggers(form ? form.triggerKeywords.join(', ') : '');
        setEditFields(form ? form.fields.join(', ') : '');
        // Ensure products is an array
        setEditProducts(form && form.products ? form.products : []);
        setIsEditing(true);
    };

    const handleSaveForm = async () => {
        if (!editName) return alert('Scenario Name is required');

        const newFormObj = {
            name: editName,
            triggerKeywords: editTriggers.split(',').map(s => s.trim()).filter(Boolean),
            fields: editFields.split(',').map(s => s.trim()).filter(Boolean),
            products: editProducts.map(p => ({ ...p, price: p.price === '' ? 0 : Number(p.price) })),
            isActive: true
        };

        let updatedForms;
        if (currentFormId) {
            updatedForms = forms.map(f => f._id === currentFormId ? { ...newFormObj, _id: f._id } : f);
        } else {
            updatedForms = [...forms, newFormObj];
        }

        try {
            const res = await api.put(`/agents/${agent._id}`, { salesForms: updatedForms });
            setForms(res.data.salesForms);
            onUpdate(res.data);
            setIsEditing(false);
            setCurrentFormId(null);
        } catch (err) {
            alert('Failed to save scenario');
            console.error(err);
        }
    };

    const handleUpdateOutlets = async (updatedOutlets) => {
        try {
            const res = await api.put(`/agents/${agent._id}`, { outlets: updatedOutlets });
            setOutlets(res.data.outlets);
            onUpdate(res.data);
            setNewOutlet('');
        } catch (err) {
            alert('Failed to update outlets');
        }
    };

    const handleDeleteForm = async (formId) => {
        if (!confirm('Delete this scenario?')) return;
        const updatedForms = forms.filter(f => f._id !== formId);
        try {
            const res = await api.put(`/agents/${agent._id}`, { salesForms: updatedForms });
            setForms(res.data.salesForms);
            onUpdate(res.data);
        } catch (err) {
            alert('Failed to delete scenario');
        }
    };

    // Product Editor Helpers
    const addProductToForm = () => {
        setEditProducts([...editProducts, { name: '', price: 0, description: '' }]);
    };
    const updateProduct = (idx, field, val) => {
        const updated = [...editProducts];
        updated[idx] = { ...updated[idx], [field]: val };
        setEditProducts(updated);
    };
    const removeProduct = (idx) => {
        const updated = editProducts.filter((_, i) => i !== idx);
        setEditProducts(updated);
    };

    if (isEditing) {
        return (
            <div className="agent-sales-editor card" style={{ padding: 20, border: '1px solid #ddd' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3>{currentFormId ? 'Edit Scenario' : 'New Order Scenario'}</h3>
                    <button className="btn-icon" onClick={() => setIsEditing(false)}><FontAwesomeIcon icon={faTimes} /></button>
                </div>

                <div className="form-group">
                    <label>Scenario Name</label>
                    <input
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="e.g. Pesan Makanan"
                    />
                </div>

                <div className="form-group">
                    <label>Trigger Words (Keywords that start this flow)</label>
                    <textarea
                        className="textarea"
                        rows={2}
                        value={editTriggers}
                        onChange={e => setEditTriggers(e.target.value)}
                        placeholder="e.g. mau pesan, order, beli makanan"
                    />
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="form-group">
                    <label>Products & Menu</label>
                    <p className="muted" style={{ fontSize: '0.9em', marginBottom: 10 }}>
                        Define what products are available in this scenario.
                    </p>

                    {editProducts.map((p, idx) => (
                        <div key={idx} className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'center' }}>
                            <div style={{ flex: 2 }}>
                                <input
                                    className="input small"
                                    placeholder="Product Name (e.g. Nasi Goreng)"
                                    value={p.name}
                                    onChange={e => updateProduct(idx, 'name', e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, padding: '0 8px', background: '#fff', height: 38 }}>
                                    <span style={{ fontSize: '0.9em', color: '#888', marginRight: 5 }}>Rp</span>
                                    <input
                                        className="input small"
                                        type="number"
                                        min="0"
                                        style={{ border: 'none', outline: 'none', width: '100%', padding: 0 }}
                                        placeholder="0"
                                        value={p.price}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            updateProduct(idx, 'price', val < 0 ? 0 : val);
                                        }}
                                    />
                                </div>
                            </div>
                            <button className="btn-icon danger" onClick={() => removeProduct(idx)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}

                    <button className="btn small ghost" onClick={addProductToForm}>
                        <FontAwesomeIcon icon={faPlus} /> Add Product
                    </button>
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div className="form-group">
                    <label>Extra Fields to Collect</label>
                    <textarea
                        className="textarea"
                        rows={2}
                        value={editFields}
                        onChange={e => setEditFields(e.target.value)}
                        placeholder="e.g. Address, Notes, Spicy Level"
                    />
                    <small className="muted" style={{ display: 'block', marginTop: 5 }}>
                        Tip: <strong>Item Name</strong> and <strong>Quantity</strong> are automatically asked if you added products above.
                    </small>
                </div>

                <div className="row" style={{ gap: 10, marginTop: 20 }}>
                    <button className="btn" onClick={handleSaveForm}>Save Scenario</button>
                    <button className="btn ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="agent-sales-list">

            {/* --- Outlets Section --- */}
            <div className="card" style={{ padding: 20, marginBottom: 24, border: '1px solid #eee' }}>
                <h3>Outlets</h3>
                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                    <input
                        className="input"
                        value={newOutlet}
                        onChange={(e) => setNewOutlet(e.target.value)}
                        placeholder="e.g. Jakarta Selatan, Cabang A"
                    />
                    <button className="btn" onClick={() => {
                        if (newOutlet.trim()) handleUpdateOutlets([...outlets, newOutlet.trim()]);
                    }}>Add</button>
                </div>
                <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {outlets.map((outlet, i) => (
                        <div key={i} className="badge" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {outlet}
                            <span onClick={() => {
                                handleUpdateOutlets(outlets.filter((_, idx) => idx !== i));
                            }} style={{ cursor: 'pointer', opacity: 0.6 }}>
                                <FontAwesomeIcon icon={faTrash} size="sm" />
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Payment Settings --- */}
            <div className="card" style={{ padding: 20, marginBottom: 24, border: '1px solid #eee' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3>Payment Settings</h3>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={agent.payment?.enabled || false}
                            onChange={async (e) => {
                                try {
                                    const res = await api.put(`/agents/${agent._id}`, {
                                        payment: { ...agent.payment, enabled: e.target.checked }
                                    });
                                    onUpdate(res.data);
                                } catch (err) { alert('Failed'); }
                            }}
                        />
                        <span>Enable Payment Request</span>
                    </label>
                </div>
                {agent.payment?.enabled && (
                    <div className="payment-config">
                        <div className="form-group">
                            <label>Transfer Info / Bank Account</label>
                            <textarea
                                className="textarea"
                                rows={3}
                                value={agent.payment?.bankInfo || ''}
                                onChange={(e) => onUpdate({ ...agent, payment: { ...agent.payment, bankInfo: e.target.value } })}
                                onBlur={async () => {
                                    await api.put(`/agents/${agent._id}`, { payment: agent.payment });
                                }}
                                placeholder="Bank details..."
                            />
                        </div>
                        <div className="form-group" style={{ marginTop: 15 }}>
                            <label>QRIS Image</label>
                            {agent.payment?.qrisUrl ? (
                                <div style={{ marginTop: 10 }}>
                                    <img src={`${api.defaults.baseURL}${agent.payment.qrisUrl}`} alt="QRIS" style={{ height: 100, borderRadius: 8 }} />
                                    <div style={{ marginTop: 5 }}>
                                        <button className="btn ghost small" onClick={async () => {
                                            if (!confirm('Delete?')) return;
                                            const res = await api.put(`/agents/${agent._id}`, { payment: { ...agent.payment, qrisUrl: '' } });
                                            onUpdate(res.data);
                                        }}>Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 10 }}>
                                    <input type="file" id="qris-upload" style={{ display: 'none' }} onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const formData = new FormData();
                                            formData.append('file', e.target.files[0]);
                                            const upRes = await api.post('/agents/upload', formData);
                                            const res = await api.put(`/agents/${agent._id}`, { payment: { ...agent.payment, qrisUrl: upRes.data.filePath } });
                                            onUpdate(res.data);
                                        }
                                    }} />
                                    <label htmlFor="qris-upload" className="btn ghost small" style={{ cursor: 'pointer' }}>
                                        <FontAwesomeIcon icon={faPlus} /> Upload QRIS
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Scenarios List --- */}
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Order Scenarios</h3>
                <button className="btn" onClick={() => startEditing(null)}>
                    <FontAwesomeIcon icon={faPlus} /> New Scenario
                </button>
            </div>

            <div className="sales-forms-grid">
                {forms.map((form, idx) => (
                    <div key={idx} className="card" style={{ padding: 15, marginBottom: 10, border: '1px solid #ddd' }}>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                            <strong>{form.name}</strong>
                            <div className="actions">
                                <button className="btn-icon" onClick={() => startEditing(form)}><FontAwesomeIcon icon={faEdit} /></button>
                                <button className="btn-icon" onClick={() => handleDeleteForm(form._id)}><FontAwesomeIcon icon={faTrash} /></button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9em', marginTop: 5, color: '#666' }}>
                            <div>Triggers: {form.triggerKeywords.join(', ')}</div>
                            <div>Products: {form.products?.length || 0} items</div>
                        </div>
                    </div>
                ))}
                {forms.length === 0 && <p className="muted">No scenarios defined.</p>}
            </div>

        </div>
    );
}
