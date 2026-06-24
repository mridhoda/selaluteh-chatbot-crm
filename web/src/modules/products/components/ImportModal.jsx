import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UploadCloud, Download, X, Plus, RefreshCw } from 'lucide-react'

/**
 * ImportModal — renders its backdrop via a JS-injected DOM node appended
 * directly to <body>, so it is completely unaffected by any ancestor's
 * overflow / transform / filter CSS that would normally constrain position:fixed.
 */
export default function ImportModal({
  isOpen,
  onClose,
  // file handling
  onFileDrop,
  onFileChange,
  onDownloadTemplate,
  onExecuteImport,
  onClearProducts,
  // state
  isImporting,
  importProductsList,
  importErrors,
  importProgress,
  importStatusText,
  // utils
  money,
}) {
  // Create a stable container div that lives directly on <body>
  const containerRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const el = document.createElement('div')
    el.setAttribute('data-import-modal', 'true')
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'z-index:99999',
      'pointer-events:none',
      'display:flex',
      'align-items:center',
      'justify-content:center',
    ].join(';')
    document.body.appendChild(el)
    containerRef.current = el
    setMounted(true)

    return () => {
      document.body.removeChild(el)
      containerRef.current = null
      setMounted(false)
    }
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !containerRef.current || !isOpen) return null

  const step = isImporting || importProgress > 0 || importStatusText?.includes('completed')
    ? 'progress'
    : importProductsList.length > 0
      ? 'preview'
      : 'upload'

  const closeLabel = isImporting
    ? 'Close'
    : importProductsList.length > 0 || importErrors.length > 0
      ? 'Cancel'
      : 'Close'

  return createPortal(
    /* ── Backdrop ── */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'all',
        zIndex: 99999,
      }}
    >
      {/* ── Modal Panel ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(15,23,42,0.28), 0 0 0 1px rgba(226,232,240,0.8)',
          animation: 'importModalIn 0.18s cubic-bezier(0.34,1.2,0.64,1)',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes importModalIn {
            from { opacity:0; transform:scale(0.94) translateY(8px); }
            to   { opacity:1; transform:scale(1)    translateY(0);   }
          }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#fff1f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UploadCloud size={18} color="#FF1F6D" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Import Products</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 1 }}>Upload Excel or CSV file</div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isImporting ? 'not-allowed' : 'pointer', opacity: isImporting ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <X size={14} color="#64748b" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
          padding: '24px',
        }}>

          {/* ─── STEP: UPLOAD ─── */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Drop zone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={onFileDrop}
                style={{
                  border: '2px dashed #e2e8f0', borderRadius: 16, padding: '40px 24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', textAlign: 'center', position: 'relative',
                  cursor: 'pointer', background: '#f8fafc', transition: 'all 0.15s', minHeight: 200,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#FF1F6D'
                  e.currentTarget.style.background = '#fff5f8'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: '#fff1f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <UploadCloud size={26} color="#FF1F6D" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  Drag and drop your file here
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 16 }}>
                  or click to browse your computer
                </div>
                <div style={{
                  fontSize: 11, color: '#cbd5e1', fontWeight: 600,
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: 6, padding: '4px 10px',
                }}>
                  Supports .xlsx, .xls, .csv · Max 10MB
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileChange}
                  style={{
                    position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
                  }}
                />
              </div>

              {/* Template download card */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, background: '#fff1f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" fill="none" stroke="#FF1F6D" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
                    Don't have a template yet?
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>
                    Download our pre-formatted CSV template with all required headers ready to fill.
                  </div>
                  <button
                    onClick={onDownloadTemplate}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0',
                      borderRadius: 8, color: '#FF1F6D', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f8'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Download size={11} />
                    Download CSV Template
                  </button>
                </div>
              </div>

              {/* Supported headers */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Supported Headers
                </div>
                {[
                  ['Name / Nama', 'Required — e.g. Salty Caramel'],
                  ['SKU / Kode', 'Optional — auto-generated if blank'],
                  ['Category / Kategori', 'Optional — defaults to "Minuman"'],
                  ['Price / Harga', 'Optional — base retail price'],
                  ['Cost / Modal', 'Optional — cost of goods sold (COGS)'],
                  ['Stock / Stok', 'Optional — initial stock count'],
                  ['Status', 'Optional — "active" or "inactive"'],
                  ['Tags / Label', 'Optional — comma-separated e.g. "Best Seller, Premium"'],
                ].map(([header, desc], i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'baseline',
                    padding: '3px 0',
                    borderBottom: i < 7 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', minWidth: 0, whiteSpace: 'nowrap' }}>
                      {header}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP: PREVIEW ─── */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Success banner */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>File parsed successfully</div>
                    <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>{importProductsList.length} products ready to import</div>
                  </div>
                </div>
                <button
                  onClick={onClearProducts}
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#64748b', padding: '5px 10px',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Clear & Upload Another
                </button>
              </div>

              {/* Table */}
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{ overflowX: 'auto', maxHeight: 260 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {['Product Name', 'SKU', 'Category', 'Retail Price', 'Cost', 'Stock', 'Tags'].map(h => (
                          <th key={h} style={{
                            padding: '9px 12px', textAlign: 'left',
                            fontSize: 9, fontWeight: 700, color: '#94a3b8',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importProductsList.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                          <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{item.sku}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{item.category}</span>
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#1e293b', fontWeight: 600, whiteSpace: 'nowrap' }}>{money(item.basePrice)}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'nowrap' }}>{money(item.costPrice)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>{item.stockQuantity}</td>
                          <td style={{ padding: '8px 12px', maxWidth: 100, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflow: 'hidden' }}>
                              {item.tags?.slice(0, 2).map((t, ti) => (
                                <span key={ti} style={{ background: '#fff1f5', color: '#FF1F6D', borderRadius: 5, padding: '1px 5px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>{t}</span>
                              ))}
                              {item.tags?.length > 2 && <span style={{ color: '#94a3b8', fontSize: 9, fontWeight: 700 }}>+{item.tags.length - 2}</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP: PROGRESS / RESULT ─── */}
          {step === 'progress' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '16px 0' }}>
              {/* Status icon */}
              {isImporting ? (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff1f5', border: '2px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={24} color="#FF1F6D" style={{ animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : importErrors.length > 0 ? (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fffbeb', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {isImporting ? 'Importing Products...' : 'Import Task Complete'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 360 }}>
                  {importStatusText}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: 'linear-gradient(90deg, #FF1F6D, #e0155b)',
                    width: `${importProgress}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                  <span>PROGRESS</span>
                  <span>{importProgress}%</span>
                </div>
              </div>

              {/* Error log */}
              {!isImporting && importErrors.length > 0 && (
                <div style={{
                  width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Error Log ({importErrors.length} failed)
                  </div>
                  <div style={{ maxHeight: 130, overflowY: 'auto' }}>
                    {importErrors.map((err, idx) => (
                      <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', gap: 12,
                        padding: '7px 0', borderBottom: idx < importErrors.length - 1 ? '1px solid #f1f5f9' : 'none',
                        fontSize: 11,
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{err.name}</div>
                          {err.sku && <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8' }}>{err.sku}</div>}
                        </div>
                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
                          {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderTop: '1px solid #f1f5f9',
          background: '#f8fafc', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            style={{
              padding: '8px 18px', background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#475569',
              cursor: isImporting ? 'not-allowed' : 'pointer', opacity: isImporting ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => !isImporting && (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            {closeLabel}
          </button>

          {!isImporting && importProductsList.length > 0 && step === 'preview' && (
            <button
              type="button"
              onClick={onExecuteImport}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', background: '#FF1F6D',
                border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 4px 12px rgba(255,31,109,0.3)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0155b'}
              onMouseLeave={e => e.currentTarget.style.background = '#FF1F6D'}
            >
              <Plus size={13} />
              Import {importProductsList.length} Products
            </button>
          )}
        </div>
      </div>
    </div>,
    containerRef.current,
  )
}
