import React, { useState } from 'react'

export default function FilterPopup({ onClose, onApply, filters }) {
  const [from, setFrom] = useState(filters.from || '')
  const [to, setTo] = useState(filters.to || '')
  const [tags, setTags] = useState(filters.tags || [])
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleApply = () => {
    onApply({ from, to, tags })
  }

  return (
    <div className='modal'>
      <div className='modal-card'>
        <div
          className='row'
          style={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3 style={{ margin: 0 }}>Advanced Filters</h3>
          <button className='btn ghost' onClick={onClose}>
            Close
          </button>
        </div>

        <div className='col' style={{ gap: 16, marginTop: 16 }}>
          <div className='col' style={{ gap: 4 }}>
            <div className='muted'>Date Range</div>
            <div className='row'>
              <input
                className='input'
                type='date'
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                className='input'
                type='date'
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className='col' style={{ gap: 8 }}>
            <div className='muted'>Labels</div>
            <div className='row' style={{ flexWrap: 'wrap', gap: 6 }}>
              {tags.map((tag) => (
                <div
                  key={tag}
                  className='badge row'
                  style={{ alignItems: 'center', gap: 4 }}
                >
                  <span>{tag}</span>
                  <span
                    onClick={() => removeTag(tag)}
                    style={{ cursor: 'pointer', fontSize: 14 }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
            <div className='row'>
              <input
                className='input'
                placeholder='Add a label...'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <button className='btn' onClick={addTag}>
                Add
              </button>
            </div>
          </div>

          <div
            className='row'
            style={{ justifyContent: 'flex-end', gap: 8, marginTop: 16 }}
          >
            <button className='btn ghost' onClick={onClose}>
              Cancel
            </button>
            <button className='btn' onClick={handleApply}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
