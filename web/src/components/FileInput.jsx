import React, { useState, useCallback } from 'react'

export default function FileInput({ onFileSelect }) {
  const [dragging, setDragging] = useState(false)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragging(true)
    } else if (e.type === 'dragleave') {
      setDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0])
        e.dataTransfer.clearData()
      }
    },
    [onFileSelect]
  )

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? 'var(--brand)' : 'var(--border)'}`,
        borderRadius: '10px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <input
        type='file'
        onChange={handleChange}
        style={{ display: 'none' }}
        id='file-input'
      />
      <label htmlFor='file-input'>
        {dragging
          ? 'Drop the file here...'
          : 'Drag & drop a file here, or click to select a file'}
      </label>
    </div>
  )
}
