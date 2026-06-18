import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import api from '../../../shared/api/httpClient'

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [q, setQ] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    api.get('/contacts').then((r) => setContacts(r.data))
  }, [])

  const filtered = contacts.filter((c) =>
    c.name?.toLowerCase().includes(q.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [q, itemsPerPage])

  const paginatedContacts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p)
    }
  }

  const getPageNumbers = () => {
    const delta = 2
    const range = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      range.unshift('...')
    }

    if (currentPage + delta < totalPages - 1) {
      range.push('...')
    }

    range.unshift(1)

    if (totalPages > 1) {
      range.push(totalPages)
    }

    return range
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      contacts.map((c) => ({
        'Name': c.name,
        'ID / Phone': c.platformAccountId || c.phone || '-',
        'Waktu Awal Chat': new Date(c.createdAt).toLocaleString(),
        'Waktu Akhir Chat': new Date(c.lastMessageAt).toLocaleString(),
        'Pesan Terakhir': c.lastMessage || '-',
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'contacts.xlsx')
  }

  return (
    <div className='contacts-container'>
      <div className='contacts-header'>
        <h1>Contacts</h1>
        <div className='contacts-actions'>
          <button className='contacts-export-btn' onClick={exportToExcel}>
            <span style={{ fontSize: 16 }}>⬇</span> Export to Excel
          </button>
        </div>
      </div>

      <div className='contacts-search-wrapper'>
        <input
          className='contacts-search-input'
          placeholder='Search contacts by name...'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <svg className='contacts-search-icon' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
      </div>

      <div className='contacts-grid'>
        {paginatedContacts.map((c) => (
          <div key={c._id} className='contact-card'>
            <div className='contact-header'>
              <div className='contact-avatar'>
                {c.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className='contact-info'>
                <div className='contact-name' title={c.name}>{c.name}</div>
                <div className='contact-phone'>{c.platformAccountId || c.phone || '-'}</div>
              </div>
            </div>

            <div className='contact-body'>
              <div className='contact-message-label'>Last Message</div>
              <div className='contact-message-text'>
                {c.lastMessage ? `"${c.lastMessage}"` : <span style={{ opacity: 0.5 }}>No messages yet</span>}
              </div>
            </div>

            <div className='contact-footer'>
              <div className='contact-date'>
                <span>Started</span>
                {new Date(c.createdAt).toLocaleDateString()}
              </div>
              <div className='contact-date' style={{ alignItems: 'flex-end' }}>
                <span>Last Active</span>
                {new Date(c.lastMessageAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className='contacts-empty'>
          <div className='contacts-empty-icon'>📭</div>
          <p>No contacts found matching &quot;{q}&quot;</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className='contacts-footer-bar'>
          <div>Total Data: <strong>{filtered.length.toLocaleString()}</strong></div>

          <div className='pagination-controls'>
            <button
              className='page-btn'
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              &lt;
            </button>

            {getPageNumbers().map((p, i) => (
              <button
                key={i}
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => p !== '...' && handlePageChange(p)}
                disabled={p === '...'}
              >
                {p}
              </button>
            ))}

            <button
              className='page-btn'
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              &gt;
            </button>
          </div>

          <div className='rows-per-page-selector'>
            <button className='btn ghost small' style={{ marginRight: 8 }}>Show per Page</button>
            <select
              className='rows-select'
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
