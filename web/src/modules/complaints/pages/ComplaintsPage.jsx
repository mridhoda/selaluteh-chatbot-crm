import React, { useEffect, useState } from 'react'
import api from '../../../shared/api/httpClient'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTrash } from '@fortawesome/free-solid-svg-icons'

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get('/complaints')
      setComplaints(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resolve = async (id) => {
    if (!confirm('Mark as resolved?')) return
    try {
      const res = await api.put(`/complaints/${id}`, { status: 'resolved' })
      setComplaints(
        complaints.map((c) => ((c.id || c._id) === id ? res.data : c))
      )
    } catch (err) {
      alert('Failed to resolve')
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this complaint?')) return
    try {
      await api.delete(`/complaints/${id}`)
      setComplaints(complaints.filter((c) => (c.id || c._id) !== id))
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div className='agents-page-header'>
        <h2>Complaints</h2>
        <p>Manage user complaints and issues here.</p>
      </div>

      <div className='card' style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
          >
            <tr>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Date
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Contact
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Issue
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Platform
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: '#64748b',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td
                  colSpan='6'
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  {loading ? 'Loading...' : 'No complaints found.'}
                </td>
              </tr>
            ) : (
              complaints.map((c) => {
                const cid = c.id || c._id
                return (
                  <tr key={cid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`status-badge ${c.status}`}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                          backgroundColor:
                            c.status === 'resolved' ? '#d1fae5' : '#fee2e2',
                          color:
                            c.status === 'resolved' ? '#065f46' : '#991b1b',
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.9em',
                        color: '#334155',
                      }}
                    >
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#0f172a' }}>
                        {c.contactId?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#64748b' }}>
                        {c.contactId?.phone || c.contactId?.email || ''}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        maxWidth: '300px',
                        color: '#334155',
                      }}
                    >
                      <div>{c.text}</div>
                      {c.formData && Object.keys(c.formData).length > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: '0.9em',
                            color: '#64748b',
                            background: '#f8fafc',
                            padding: 8,
                            borderRadius: 4,
                          }}
                        >
                          {Object.entries(c.formData).map(([k, v]) => (
                            <div key={k}>
                              <strong>{k}:</strong> {v}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textTransform: 'capitalize',
                        color: '#334155',
                      }}
                    >
                      {c.platformType || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {c.status !== 'resolved' && (
                        <button
                          className='btn-icon'
                          onClick={() => resolve(cid)}
                          title='Resolve'
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '4px',
                            marginRight: '8px',
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ color: 'green' }}
                          />
                        </button>
                      )}
                      <button
                        className='btn-icon'
                        onClick={() => remove(cid)}
                        title='Delete'
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{ color: 'red' }}
                        />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
