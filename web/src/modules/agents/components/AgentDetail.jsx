import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import api from '../../../shared/api/httpClient'
import AgentSales from './AgentSales'
import BrandIcon from '../../../shared/components/brand/BrandIcon'

const FILE_MENTION_REGEX = /!(?:\{format:(image|sticker|document|file)\})?\[([^\]]*)\]\(([^)]+)\)/i

const isImageFilename = (filename = '') => /\.(png|jpe?g|gif|webp)$/i.test(filename)

const buildPreviewFileUrl = (url = '') => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  if (url.startsWith('/files/') || url.startsWith('/uploads/')) return `${api.defaults.baseURL}${url}`
  if (url.startsWith('/')) return `${api.defaults.baseURL}${url}`
  return `${api.defaults.baseURL}/files/${url}`
}

const parsePreviewFileMention = (text = '', databaseFiles = []) => {
  const match = FILE_MENTION_REGEX.exec(text || '')
  if (!match) return null

  let explicitFormat = (match[1] || '').trim().toLowerCase()
  let altText = (match[2] || '').trim()
  let rawRef = (match[3] || '').trim()
  if (!rawRef) return null

  const altFormatMatch = altText.match(/^\{format:(image|sticker|document|file)\}\s*/i)
  if (altFormatMatch) {
    explicitFormat ||= altFormatMatch[1].toLowerCase()
    altText = altText.replace(altFormatMatch[0], '').trim()
  }

  const refFormatMatch = rawRef.match(/^\{format:(image|sticker|document|file)\}\s*/i)
  if (refFormatMatch) {
    explicitFormat ||= refFormatMatch[1].toLowerCase()
    rawRef = rawRef.replace(refFormatMatch[0], '').trim()
  }

  if (explicitFormat === 'file') explicitFormat = 'document'

  let decodedRef = rawRef
  try {
    decodedRef = decodeURIComponent(rawRef)
  } catch (_) {
    decodedRef = rawRef
  }

  const normalizedTargets = [rawRef, decodedRef].map((val) => (val || '').toLowerCase())
  const candidate = databaseFiles.find((file) => {
    const aliases = [file.storedName, file.originalName, file.id]
      .filter(Boolean)
      .map((val) => String(val).toLowerCase())
    return aliases.some((alias) =>
      normalizedTargets.some((target) => target === alias || target.includes(alias)),
    )
  })

  const storedName = candidate?.storedName || rawRef.replace(/^\/?files\//i, '')
  const filename = candidate?.originalName || candidate?.storedName || altText || storedName
  const type = explicitFormat === 'image' || explicitFormat === 'sticker' || isImageFilename(filename || storedName)
    ? 'image'
    : 'document'

  return {
    token: match[0],
    text: (text || '').replace(match[0], altText || '').trim(),
    attachment: {
      url: storedName.startsWith('http') || storedName.startsWith('/') || storedName.startsWith('data:')
        ? storedName
        : `/files/${storedName}`,
      filename,
      storedName: candidate?.storedName || storedName,
      type,
      format: explicitFormat || null,
    },
  }
}

const normalizePreviewMessage = (message = {}, databaseFiles = []) => {
  if (message.attachment) return message
  const mention = parsePreviewFileMention(message.text || '', databaseFiles)
  if (!mention) return message
  return {
    ...message,
    text: mention.text,
    attachment: mention.attachment,
  }
}

const PreviewAttachment = ({ attachment }) => {
  if (!attachment) return null
  const filename = attachment.filename || attachment.storedName || attachment.url || 'attachment'
  const url = buildPreviewFileUrl(attachment.url || attachment.storedName)
  const isImage = attachment.type === 'image' || attachment.format === 'image' || attachment.format === 'sticker' || isImageFilename(filename)

  if (isImage) {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm mt-0 bg-slate-100 max-w-[260px]">
        <img
          src={url}
          alt={filename}
          className="block w-full h-auto max-h-[260px] object-contain cursor-pointer"
          onClick={() => window.open(url, '_blank')}
        />
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 mt-1 no-underline">
      <i className="fa-solid fa-download"></i>
      <span className="truncate max-w-[180px]">{filename}</span>
    </a>
  )
}

const KnowledgeTextEditor = ({ value, onChange, placeholder }) => {
  const textareaRef = React.useRef(null)

  const insertFormat = (before, after = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = before + selected + after

    const newValue = text.substring(0, start) + replacement + text.substring(end)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const handleBold = () => insertFormat('**', '**')
  const handleItalic = () => insertFormat('*', '*')
  const handleImage = () => {
    const url = prompt('Masukkan URL Gambar:')
    if (url) {
      insertFormat(`![gambar](${url})`)
    }
  }
  const handleUndo = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      document.execCommand('undo')
    }
  }
  const handleRedo = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
      document.execCommand('redo')
    }
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
        <button 
          onClick={handleUndo} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8 font-normal" 
          title="Undo"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
        <button 
          onClick={handleRedo} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8 font-normal" 
          title="Redo"
        >
          <i className="fa-solid fa-rotate-right"></i>
        </button>
        
        <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
        
        <button 
          onClick={handleBold} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded font-bold transition flex items-center justify-center w-8 h-8" 
          title="Bold"
        >
          <i className="fa-solid fa-bold"></i>
        </button>
        <button 
          onClick={handleItalic} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded italic transition flex items-center justify-center w-8 h-8" 
          title="Italic"
        >
          <i className="fa-solid fa-italic"></i>
        </button>
        
        <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
        
        <button 
          onClick={handleImage} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8" 
          title="Insert Image"
        >
          <i className="fa-regular fa-image"></i>
        </button>
        
        <div className="w-[1px] h-5 bg-slate-200 mx-1"></div>
        
        <button 
          onClick={() => insertFormat('<div align="left">\n', '\n</div>')} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8" 
          title="Align Left"
        >
          <i className="fa-solid fa-align-left"></i>
        </button>
        <button 
          onClick={() => insertFormat('<div align="center">\n', '\n</div>')} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8" 
          title="Align Center"
        >
          <i className="fa-solid fa-align-center"></i>
        </button>
        <button 
          onClick={() => insertFormat('<div align="right">\n', '\n</div>')} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8" 
          title="Align Right"
        >
          <i className="fa-solid fa-align-right"></i>
        </button>
        <button 
          onClick={() => insertFormat('<div align="justify">\n', '\n</div>')} 
          className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded transition flex items-center justify-center w-8 h-8" 
          title="Align Justify"
        >
          <i className="fa-solid fa-align-justify"></i>
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[400px] p-4 text-sm outline-none border-none resize-y leading-relaxed text-slate-700 bg-white"
      />

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-medium">
        {value ? value.length : 0} Characters
      </div>
    </div>
  )
}

export default function AgentDetail() {
  const { id, tab = 'general' } = useParams()
  const localDbStorageKey = useMemo(() => `agent-db-${id}`, [id])
  const navigate = useNavigate()

  const setTab = (newTab) => {
    navigate(`/app/agents/${id}/${newTab}`);
  };

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [platforms, setPlatforms] = useState([])

  const [agent, setAgent] = useState(null)
  const [name, setName] = useState('')
  const [platformId, setPlatformId] = useState('')
  const [behavior, setBehavior] = useState('')
  const [prompt, setPrompt] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [stickerUrl, setStickerUrl] = useState('')
  const [tools, setTools] = useState([])
  const [knowledge, setKnowledge] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [database, setDatabase] = useState([])
  const [complaintFields, setComplaintFields] = useState([])
  const [complaintNotification, setComplaintNotification] = useState({ enabled: false, platformId: '', destination: '' })
  const [aiSettings, setAiSettings] = useState({
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: '',
  })
  const [knowledgeTab, setKnowledgeTab] = useState('text')
  const [newUrl, setNewUrl] = useState('')
  const [newText, setNewText] = useState('')
  const [newFileUploading, setNewFileUploading] = useState(false)
  const [newQa, setNewQa] = useState({ question: '', answer: '' })
  const [localDatabase, setLocalDatabase] = useState([])
  const [dbUploadStatus, setDbUploadStatus] = useState({
    status: 'idle',
    message: '',
  })
  const [activeLinkId, setActiveLinkId] = useState(null)

  const [messages, setMessages] = useState([])
  const [testMsg, setTestMsg] = useState('')
  const [testAttachment, setTestAttachment] = useState(null)
  const [testing, setTesting] = useState(false)
  const [manualSaveFeedback, setManualSaveFeedback] = useState(false)
  const manualSaveFeedbackTimerRef = useRef(null)

  const combinedDatabase = useMemo(
    () => [
      ...database.map((f) => ({ ...f, source: 'remote' })),
      ...localDatabase.map((f) => ({ ...f, source: 'local' })),
    ],
    [database, localDatabase]
  )

  const getFileLink = (file) => {
    if (file.source === 'remote' && file.storedName) {
      const publicFilesBaseUrl =
        import.meta.env.VITE_PUBLIC_FILES_BASE_URL ||
        `${api.defaults.baseURL}/files`
      return `${publicFilesBaseUrl.replace(/\/$/, '')}/${file.storedName}`
    }
    if (file.source === 'local' && file.dataUrl) {
      return file.dataUrl
    }
    return ''
  }

  const getAiFileMarkdown = (file, format = '') => {
    if (file.source !== 'remote' || !file.storedName) return ''
    const label = file.originalName || file.storedName
    const formatPrefix = format ? `{format:${format}}` : ''
    return `![${formatPrefix}${label}](${file.storedName})`
  }

  const toggleLinkPanel = (fileKey, file) => {
    const link = getFileLink(file)
    if (!link) {
      alert('Link tidak tersedia untuk file ini.')
      return
    }
    setActiveLinkId((prev) => (prev === fileKey ? null : fileKey))
  }

  const copyLink = async (link) => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Gagal menyalin link.')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const raw = window.localStorage.getItem(localDbStorageKey)
      setLocalDatabase(raw ? JSON.parse(raw) : [])
    } catch (error) {
      console.error('Failed to load local database files:', error)
      setLocalDatabase([])
    }
  }, [localDbStorageKey])

  const persistLocalDatabase = (updater) => {
    setLocalDatabase((prev) => {
      const next =
        typeof updater === 'function'
          ? updater(prev)
          : Array.isArray(updater)
            ? updater
            : prev
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(localDbStorageKey, JSON.stringify(next))
        } catch (error) {
          console.error('Failed to persist local database files:', error)
        }
      }
      return next
    })
  }

  const readFileAsDataUrl = (file, entryId) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const entry = {
          id: entryId,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: reader.result,
        }
        persistLocalDatabase((prev) => {
          const filtered = prev.filter((item) => item.id !== entryId)
          return [...filtered, entry]
        })
        resolve(entry)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const generateLocalId = () =>
    typeof window !== 'undefined' &&
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false);
      return;
    }
    ;(async () => {
      try {
        const [a, p] = await Promise.all([
          api.get(`/agents/${id}`),
          api.get('/platforms'),
        ])
        setAgent(a.data)
        setName(a.data.name || '')
        setPlatformId(a.data.platformId || '')
        setBehavior(a.data.behavior || '')
        setPrompt(a.data.prompt || '')
        setWelcomeMessage(a.data.welcomeMessage || '')
        setStickerUrl(a.data.stickerUrl || '')
        setTools(a.data.tools || [])
        setKnowledge(Array.isArray(a.data.knowledge) ? a.data.knowledge : [])
        setFollowUps(Array.isArray(a.data.followUps) ? a.data.followUps : [])
        setDatabase(Array.isArray(a.data.database) ? a.data.database : [])
        setComplaintFields(Array.isArray(a.data.complaintFields) ? a.data.complaintFields : [])
        setComplaintNotification(a.data.complaintNotification || { enabled: false, platformId: '', destination: '' })
        setAiSettings(a.data.aiSettings || { provider: 'openai', baseUrl: '', apiKey: '', model: '', temperature: 0.7, maxTokens: '' })
        setPlatforms(p.data)
      } catch (error) {
        console.error('Error fetching agent data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name,
        platformId: platformId || null,
        behavior,
        prompt,
        welcomeMessage,
        stickerUrl,
        tools,
        knowledge,
        followUps,
        database,
        complaintFields,
        complaintNotification,
        aiSettings,
      }
      const r = await api.put(`/agents/${id}`, payload)
      setAgent(r.data)
      return true
    } catch (error) {
      console.error('Error saving agent data:', error)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = async () => {
    const ok = await save()
    if (!ok) return

    setManualSaveFeedback(true)
    if (manualSaveFeedbackTimerRef.current) {
      clearTimeout(manualSaveFeedbackTimerRef.current)
    }
    manualSaveFeedbackTimerRef.current = setTimeout(() => {
      setManualSaveFeedback(false)
      manualSaveFeedbackTimerRef.current = null
    }, 1400)
  }

  useEffect(() => {
    return () => {
      if (manualSaveFeedbackTimerRef.current) {
        clearTimeout(manualSaveFeedbackTimerRef.current)
      }
    }
  }, [])

  const addKnowledge = (k = { kind: 'url', value: '' }) =>
    setKnowledge([...knowledge, k])
  const updKnowledge = (i, patch) => {
    const arr = [...knowledge]
    arr[i] = { ...arr[i], ...patch }
    setKnowledge(arr)
  }
  const delKnowledge = (i) =>
    setKnowledge(knowledge.filter((_, idx) => idx !== i))

  const addFollowUp = () =>
    setFollowUps([...followUps, { prompt: '', delay: 60 }])
  const updFollowUp = (i, patch) => {
    const arr = [...followUps]
    arr[i] = { ...arr[i], ...patch }
    setFollowUps(arr)
  }
  const delFollowUp = (i) =>
    setFollowUps(followUps.filter((_, idx) => idx !== i))

  const handleStickerSelect = async (file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setStickerUrl(response.data.filePath)
    } catch (error) {
      console.error('Sticker upload error:', error)
      alert('Sticker upload failed.')
    }
  }

  const handleFileSelect = async (file, i) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const { filePath, originalName } = response.data;
      updKnowledge(i, { value: filePath, originalName: originalName });
    } catch (error) {
      console.error('File upload error:', error)
      alert('File upload failed.')
    }
  }

  const handleUploadFileKnowledge = async (file) => {
    if (!file) return
    setNewFileUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post('/agents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const { filePath, originalName } = response.data;
      addKnowledge({ kind: 'file', value: filePath, originalName: originalName })
    } catch (error) {
      console.error('File upload error:', error)
      alert('File upload failed.')
    } finally {
      setNewFileUploading(false)
    }
  }

  const handleDatabaseFileSelect = async (file) => {
    if (!file) return
    const entryId = generateLocalId()

    const MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const skipLocalStorage = file.size > MAX_LOCAL_STORAGE_SIZE;

    setDbUploadStatus({
      status: 'loading',
      message: `Processing ${file.name}...`,
    })

    if (!skipLocalStorage) {
      try {
        await readFileAsDataUrl(file, entryId)
        setDbUploadStatus({
          status: 'loading',
          message: 'Stored locally. Uploading to server...',
        })
      } catch (error) {
        console.error('Failed to store database file locally:', error)
        setDbUploadStatus({
          status: 'error',
          message: 'Cannot store file locally. Please try another file.',
        })
        return
      }
    } else {
      setDbUploadStatus({
        status: 'loading',
        message: 'File is large, uploading directly to server...',
      })
    }

    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.post(`/agents/${id}/database`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setDatabase((prev) => [...prev, response.data])
      if (!skipLocalStorage) {
        persistLocalDatabase((prev) => prev.filter((item) => item.id !== entryId))
      }
      setDbUploadStatus({
        status: 'success',
        message: `${file.name} uploaded successfully.`,
      })
    } catch (error) {
      console.error('Database file upload error:', error)
      setDbUploadStatus({
        status: 'error',
        message: skipLocalStorage
          ? 'Upload failed. Please try again.'
          : 'Upload failed, file saved locally on this device.',
      })
    }
  }

  const deleteDatabaseFile = async (file) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    if (file.source === 'local') {
      persistLocalDatabase((prev) => prev.filter((f) => f.id !== file.id))
      setDbUploadStatus({
        status: 'idle',
        message: '',
      })
      return
    }
    try {
      await api.delete(`/agents/${id}/database/${file.id}`)
      setDatabase((prev) => prev.filter((f) => f.id !== file.id))
    } catch (error) {
      console.error('Database file delete error:', error)
      alert('Database file delete failed.')
    }
  }

  const sendTest = async () => {
    if (!testMsg.trim() && !testAttachment) return
    setTesting(true)

    const historyPayload = messages
      .filter((m) => typeof m.text === 'string' && m.text.trim().length > 0)
      .slice(-10)
      .map((m) => ({ from: m.from, text: m.text }));

    const userMessage = { from: 'user', text: testMsg }
    if (testAttachment) {
      userMessage.attachment = testAttachment
    }
    let newMessages = [...messages, userMessage]

    if (messages.length === 0) {
      const welcomeMsg = normalizePreviewMessage({ from: 'ai', text: welcomeMessage || 'Halo!' }, database)
      newMessages.push(welcomeMsg)
      if (stickerUrl) {
        const stickerMsg = { from: 'ai', sticker: stickerUrl }
        newMessages.push(stickerMsg)
      }
    }

    setMessages(newMessages)
    setTestMsg('')
    setTestAttachment(null)

    try {
      let payload = { message: testMsg, history: historyPayload }

      if (testAttachment && testAttachment.file) {
        const formData = new FormData()
        formData.append('file', testAttachment.file)
        const uploadRes = await api.post('/agents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        payload.attachment = {
          url: uploadRes.data.filePath,
          filename: uploadRes.data.originalName
        }
      }

      const r = await api.post(`/agents/${id}/test`, payload)
      const reply = r.data.reply;

      if (typeof reply === 'object' && reply.attachment) {
        setMessages((prev) => [...prev, normalizePreviewMessage({ from: 'ai', text: reply.text, attachment: reply.attachment }, database)])
      } else {
        setMessages((prev) => [...prev, normalizePreviewMessage({ from: 'ai', text: reply }, database)])
      }
    } catch (error) {
      console.error('Test message error:', error)
      setMessages((prev) => [...prev, { from: 'ai', text: 'Error: Failed to send message' }])
    } finally {
      setTesting(false)
    }
  }

  const getChatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendQuickReply = async (text) => {
    setTesting(true);
    const userMessage = { from: 'user', text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    try {
      const historyPayload = newMessages
        .filter((m) => typeof m.text === 'string' && m.text.trim().length > 0)
        .slice(-10)
        .map((m) => ({ from: m.from, text: m.text }));

      const r = await api.post(`/agents/${id}/test`, { message: text, history: historyPayload });
      const reply = r.data.reply;
      
      if (typeof reply === 'object' && reply.attachment) {
        setMessages((prev) => [...prev, normalizePreviewMessage({ from: 'ai', text: reply.text, attachment: reply.attachment }, database)]);
      } else {
        setMessages((prev) => [...prev, normalizePreviewMessage({ from: 'ai', text: reply }, database)]);
      }
    } catch (error) {
      console.error('Test message error:', error);
      setMessages((prev) => [...prev, { from: 'ai', text: 'Error: Failed to send message' }]);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-500 font-semibold gap-2">
        <i className="fa-solid fa-spinner animate-spin text-xl text-orange-500"></i>
        <span>Loading AI Agent details...</span>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-6 text-center">
        <i className="fa-solid fa-triangle-exclamation text-3xl mb-2 text-red-500"></i>
        <h3 className="font-bold text-lg">Agent not found</h3>
        <p className="text-sm mt-1">Kami tidak dapat menemukan konfigurasi agen ini.</p>
        <button onClick={() => navigate('/app/agents')} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-700">
          Kembali ke Daftar Agen
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto text-slate-800 px-6 py-4 pb-16 box-border">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span className="hover:text-orange-500 cursor-pointer transition" onClick={() => navigate('/app/agents')}>My Bots</span>
            <i className="fa-solid fa-chevron-right text-xs mx-2"></i>
            <span className="text-slate-800 font-semibold">Editing</span>
          </div>
          <div className="flex items-center gap-3 group">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-bold bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-orange-500 focus:outline-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 w-full md:w-auto transition-colors"
            />
            <i className="fa-solid fa-pen-to-square text-slate-300 group-hover:text-orange-400 transition cursor-pointer"></i>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 transition-opacity duration-500 ${saving ? 'opacity-50' : 'opacity-100'}`}>
            <i className="fa-solid fa-check mr-1"></i> {saving ? 'Saving...' : 'Auto-saved'}
          </span>
          <button 
            onClick={() => {
              setName(agent.name || '')
              setPlatformId(agent.platformId || '')
              setBehavior(agent.behavior || '')
              setPrompt(agent.prompt || '')
              setWelcomeMessage(agent.welcomeMessage || '')
              setStickerUrl(agent.stickerUrl || '')
              setTools(agent.tools || [])
              setKnowledge(Array.isArray(agent.knowledge) ? agent.knowledge : [])
              setFollowUps(Array.isArray(agent.followUps) ? agent.followUps : [])
              setDatabase(Array.isArray(agent.database) ? agent.database : [])
              setComplaintFields(Array.isArray(agent.complaintFields) ? agent.complaintFields : [])
              setComplaintNotification(agent.complaintNotification || { enabled: false, platformId: '', destination: '' })
              setAiSettings(agent.aiSettings || { provider: 'openai', baseUrl: '', apiKey: '', model: '', temperature: 0.7, maxTokens: '' })
            }} 
            className="bg-white text-slate-600 px-5 py-2.5 rounded-full font-semibold text-sm border border-slate-200 shadow-sm hover:bg-slate-50 transition"
          >
            <i className="fa-solid fa-rotate-right mr-2"></i> Reset
          </button>
          <button 
            onClick={handleManualSave} 
            disabled={saving}
            className={`px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 ${manualSaveFeedback ? 'bg-emerald-500 text-white shadow-emerald-500/25' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02]'}`}
          >
            {saving ? 'Saving...' : manualSaveFeedback ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <nav className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: 'fa-sliders' },
          { id: 'knowledge', label: 'Knowledge', icon: 'fa-book-open' },
          { id: 'integrations', label: 'Integrations', icon: 'fa-plug' },
          { id: 'followups', label: 'Follow-ups', icon: 'fa-clock' },
          { id: 'evaluation', label: 'Evaluation', icon: 'fa-chart-line' },
          { id: 'database', label: 'Files / Database', icon: 'fa-folder-open' },
          { id: 'complaints', label: 'Complaints', icon: 'fa-circle-exclamation' },
          { id: 'ai-settings', label: 'AI Settings', icon: 'fa-microchip' },
          { id: 'sales', label: 'Sales', icon: 'fa-sack-dollar' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-md border border-slate-100'
                : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'
            }`}
          >
            <i className={`fa-solid ${t.icon} ${tab === t.id ? 'text-orange-500' : 'opacity-50'}`}></i>
            {t.label}
          </button>
        ))}
      </nav>

      {/* MAIN SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0 box-border">
        
        {/* LEFT COLUMN: ACTIVE TAB PANEL */}
        <main className={tab === 'general' ? 'lg:col-span-7 xl:col-span-8 space-y-6 min-w-0 box-border' : 'lg:col-span-12 space-y-6 min-w-0 box-border'}>
          
          {/* TAB: GENERAL */}
          {tab === 'general' && (
            <div className="flex flex-col gap-6 animate-slide-up w-full max-w-full">
              
              {/* Card: Persona */}
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 transition hover:shadow-2xl hover:shadow-slate-200/80 w-full max-w-full box-border">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-fingerprint text-orange-400"></i> AI Agent Persona
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">System Prompt</span>
                </div>
                
                <div className="relative group">
                  <textarea 
                    value={behavior}
                    onChange={(e) => setBehavior(e.target.value)}
                    className="w-full min-h-[260px] bg-slate-50 border border-slate-200 rounded-xl p-4 pb-14 text-slate-700 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition resize-y leading-relaxed"
                    placeholder="Describe precisely how the AI should behave..."
                  />
                  <button 
                    onClick={() => {
                      if (!behavior.trim()) {
                        setBehavior("Kamu adalah asisten penjualan yang ramah, proaktif, dan siap membantu pelanggan dalam memilih teh dan merchandise premium kami.");
                      } else {
                        setBehavior((prev) => `${prev} Jawablah dengan nada yang ramah, hangat, edukatif tentang varian teh kami, dan bantu pelanggan memproses pesanan dengan sabar.`);
                      }
                    }} 
                    className="absolute bottom-3 right-3 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2 group/btn"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles group-hover/btn:animate-pulse"></i> Improve with AI
                  </button>
                </div>
              </div>

              {/* Card: Welcome Message */}
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 w-full max-w-full box-border">
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 block flex items-center gap-2">
                  <i className="fa-regular fa-message text-orange-400"></i> Welcome Message
                </label>

                <input 
                  type="file" 
                  id="sticker-input" 
                  className="hidden" 
                  onChange={(e) => handleStickerSelect(e.target.files[0])} 
                  accept="image/*" 
                />
                <div 
                  onClick={() => document.getElementById('sticker-input').click()} 
                  className="mb-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 min-h-[104px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-orange-300 transition group relative overflow-hidden"
                >
                  {stickerUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={`${api.defaults.baseURL}${stickerUrl}`} 
                        alt="Welcome banner preview" 
                        className="max-h-16 rounded-lg mb-1.5 border border-slate-200 object-cover" 
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickerUrl('');
                        }} 
                        className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-orange-50 text-orange-500 p-2.5 rounded-full mb-2 group-hover:scale-110 transition z-10">
                        <i className="fa-solid fa-cloud-arrow-up text-base"></i>
                      </div>
                      <p className="text-xs font-medium text-slate-700">Klik untuk upload gambar selamat datang</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">SVG, PNG, JPG atau GIF (Maks. 3MB)</p>
                    </>
                  )}
                </div>

                <div className="relative mt-3">
                  <textarea 
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition resize-none leading-relaxed"
                    placeholder="Tulis ucapan selamat datang yang akan dikirim saat pertama kali chat..."
                  />
                </div>
              </div>

              {/* Card: Prompt AI */}
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 opacity-90 hover:opacity-100 transition w-full max-w-full box-border">
                <label className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 block flex items-center gap-2">
                  <i className="fa-solid fa-brain text-orange-400"></i> Prompt AI Context
                </label>
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition resize-none leading-relaxed"
                    placeholder="Masukkan konteks detail, peraturan, produk, atau pedoman utama untuk model AI ini..."
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB: KNOWLEDGE */}
          {tab === 'knowledge' && (
            <div className="flex flex-col gap-6 animate-slide-up">
              
              {/* Sub-Navigasi Knowledge */}
              <div className="bg-white rounded-xl p-1.5 flex gap-1 w-max shadow-sm border border-slate-100">
                {[
                  { id: 'text', label: 'Text', icon: 'fa-file-lines' },
                  { id: 'url', label: 'URL', icon: 'fa-link' },
                  { id: 'file', label: 'File', icon: 'fa-folder-open' },
                  { id: 'qna', label: 'Q&A', icon: 'fa-comments' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setKnowledgeTab(sub.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                      knowledgeTab === sub.id
                        ? 'bg-slate-100 text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <i className={`fa-solid ${sub.icon} ${knowledgeTab === sub.id ? 'text-orange-500' : 'opacity-50'}`}></i>
                    {sub.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 min-h-[400px]">
                <div className="mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 capitalize">{knowledgeTab} Sources</h2>
                  <p className="text-sm text-slate-500 mt-1">Latih bot Anda menggunakan sumber data {knowledgeTab}.</p>
                </div>

                {/* Always visible insert form based on active sub-tab */}
                {knowledgeTab === 'url' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-plus text-orange-500"></i> Add New URL Source
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition"
                        placeholder="https://contoh-website.com/halaman-produk"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newUrl.trim()) {
                              addKnowledge({ kind: 'url', value: newUrl.trim() });
                              setNewUrl('');
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newUrl.trim()) {
                            addKnowledge({ kind: 'url', value: newUrl.trim() });
                            setNewUrl('');
                          } else {
                            alert('Silakan masukkan URL terlebih dahulu.');
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm shrink-0"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                )}

                {knowledgeTab === 'text' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-plus text-orange-500"></i> Add New Text Source
                    </h3>
                    <div className="flex flex-col gap-3">
                      <KnowledgeTextEditor
                        value={newText}
                        onChange={setNewText}
                        placeholder="Tempelkan teks mentah di sini (misal detail produk, FAQ, dll.)..."
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            if (newText.trim()) {
                              addKnowledge({ kind: 'text', value: newText.trim() });
                              setNewText('');
                            } else {
                              alert('Silakan masukkan teks terlebih dahulu.');
                            }
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {knowledgeTab === 'file' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-plus text-orange-500"></i> Upload New File
                    </h3>
                    <div 
                      onClick={() => document.getElementById('knowledge-file-upload').click()}
                      className="border-2 border-dashed border-slate-200 bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-50/20 hover:border-orange-300 transition group relative overflow-hidden"
                    >
                      <input 
                        type="file" 
                        id="knowledge-file-upload" 
                        className="hidden" 
                        onChange={(e) => handleUploadFileKnowledge(e.target.files[0])} 
                      />
                      <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition shadow-sm">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                      </div>
                      {newFileUploading ? (
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                          <i className="fa-solid fa-spinner animate-spin text-orange-500"></i>
                          <span>Uploading file...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-700">Klik untuk upload dokumen baru</p>
                          <p className="text-xs text-slate-400 mt-1">PDF, TXT, DOCX atau CSV (Maks. 10MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {knowledgeTab === 'qna' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-plus text-orange-500"></i> Add New Q&A Pair
                    </h3>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition"
                        placeholder="Pertanyaan (Question) - e.g. Berapa lama pengiriman produk?"
                        value={newQa.question}
                        onChange={(e) => setNewQa({ ...newQa, question: e.target.value })}
                      />
                      <textarea
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition h-20 resize-none"
                        placeholder="Jawaban (Answer) - e.g. Pengiriman produk biasanya membutuhkan waktu 2-3 hari kerja."
                        value={newQa.answer}
                        onChange={(e) => setNewQa({ ...newQa, answer: e.target.value })}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            if (newQa.question.trim() && newQa.answer.trim()) {
                              addKnowledge({ kind: 'qna', question: newQa.question.trim(), answer: newQa.answer.trim() });
                              setNewQa({ question: '', answer: '' });
                            } else {
                              alert('Silakan masukkan pertanyaan dan jawaban terlebih dahulu.');
                            }
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                        >
                          Add Q&A Pair
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Added Sources List Header */}
                {knowledge.filter((k) => k.kind === knowledgeTab).length > 0 && (
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-list-check"></i> Added Sources
                  </h4>
                )}

                <div className="space-y-4">
                  {knowledgeTab === 'url' && (
                    <div className="space-y-3">
                      {knowledge
                        .map((k, i) => ({ ...k, originalIndex: i }))
                        .filter((k) => k.kind === 'url')
                        .map((k) => (
                          <div key={k.originalIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4 animate-slide-up">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-link"></i>
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition"
                                value={k.value || ''}
                                onChange={(e) => updKnowledge(k.originalIndex, { value: e.target.value })}
                              />
                            </div>
                            <button
                              onClick={() => delKnowledge(k.originalIndex)}
                              className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white border border-slate-100 shadow-sm shrink-0"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {knowledgeTab === 'text' && (
                    <div className="space-y-3">
                      {knowledge
                        .map((k, i) => ({ ...k, originalIndex: i }))
                        .filter((k) => k.kind === 'text')
                        .map((k) => (
                          <div key={k.originalIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4 animate-slide-up">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-1">
                              <i className="fa-solid fa-file-lines"></i>
                            </div>
                            <div className="flex-1">
                              <KnowledgeTextEditor
                                value={k.value || ''}
                                onChange={(val) => updKnowledge(k.originalIndex, { value: val })}
                              />
                            </div>
                            <button
                              onClick={() => delKnowledge(k.originalIndex)}
                              className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white border border-slate-100 shadow-sm shrink-0"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {knowledgeTab === 'file' && (
                    <div className="space-y-3">
                      {knowledge
                        .map((k, i) => ({ ...k, originalIndex: i }))
                        .filter((k) => k.kind === 'file')
                        .map((k) => (
                          <div key={k.originalIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 animate-slide-up">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-file-pdf"></i>
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-slate-700 block truncate">
                                  {k.originalName || k.value.split('/').pop()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {k.value && (
                                <a 
                                  href={`${api.defaults.baseURL}${k.value}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs font-bold text-sky-500 hover:underline px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm"
                                >
                                  Buka File
                                </a>
                              )}
                              <button
                                onClick={() => delKnowledge(k.originalIndex)}
                                className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white border border-slate-100 shadow-sm"
                              >
                                <i className="fa-regular fa-trash-can text-sm"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {knowledgeTab === 'qna' && (
                    <div className="space-y-3">
                      {knowledge
                        .map((k, i) => ({ ...k, originalIndex: i }))
                        .filter((k) => k.kind === 'qna')
                        .map((k) => (
                          <div key={k.originalIndex} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4 animate-slide-up">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-1">
                              <i className="fa-solid fa-comments"></i>
                            </div>
                            <div className="flex-1 flex flex-col gap-2 min-w-0">
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition font-semibold text-slate-800"
                                value={k.question || ''}
                                onChange={(e) => updKnowledge(k.originalIndex, { question: e.target.value })}
                                placeholder="Pertanyaan"
                              />
                              <textarea
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition h-16 resize-none text-slate-600"
                                value={k.answer || ''}
                                onChange={(e) => updKnowledge(k.originalIndex, { answer: e.target.value })}
                                placeholder="Jawaban"
                              />
                            </div>
                            <button
                              onClick={() => delKnowledge(k.originalIndex)}
                              className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-white border border-slate-100 shadow-sm shrink-0"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}


                </div>
              </div>
            </div>
          )}

          {/* TAB: INTEGRATIONS */}
          {tab === 'integrations' && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Integrations</h2>
                <p className="text-sm text-slate-500 mb-6">Hubungkan agen ke platform messaging yang sudah terdaftar.</p>
                
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-link text-slate-400"></i>
                  </div>
                  <select 
                    value={platformId || ''} 
                    onChange={(e) => setPlatformId(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="">Select Platform</option>
                    {platforms.map((p) => (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {p.name || p.label} ({p.type})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-slate-400 text-xs"></i>
                  </div>
                </div>
              </div>

              {platformId && (
                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 animate-slide-up">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center shadow-sm">
                        <i className={`fa-brands fa-${platforms.find(p => (p.id || p._id) === platformId)?.type === 'whatsapp' ? 'whatsapp' : 'telegram'} text-3xl text-sky-500`}></i>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 capitalize">
                          {platforms.find(p => (p.id || p._id) === platformId)?.type || 'Telegram'}
                        </h2>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          Terhubung sebagai <span className="font-semibold text-slate-700">{platforms.find(p => (p.id || p._id) === platformId)?.name || 'Platform'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-md shadow-emerald-200 flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-wide">Connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Webhook URL Platform</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-600 overflow-x-auto whitespace-nowrap flex items-center">
                        {`${api.defaults.baseURL || window.location.origin}/webhook/${platforms.find(p => (p.id || p._id) === platformId)?.type || 'platform'}`}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${api.defaults.baseURL || window.location.origin}/webhook/${platforms.find(p => (p.id || p._id) === platformId)?.type || 'platform'}`)
                          alert('Webhook URL copied!')
                        }}
                        className="bg-white text-slate-600 border border-slate-200 px-4 rounded-lg hover:bg-slate-100 transition hover:text-orange-500" 
                        title="Copy"
                      >
                        <i className="fa-regular fa-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tools list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition hover:shadow-lg ${tools.includes('time') ? 'border-orange-300 bg-orange-50/10' : 'opacity-75 hover:opacity-100'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
                      <i className="fa-solid fa-clock text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Auto Reminder</h3>
                      <p className="text-xs text-slate-500">Tugas terjadwal (Time API)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newTools = tools.includes('time')
                        ? tools.filter(t => t !== 'time')
                        : [...tools, 'time'];
                      setTools(newTools);
                    }}
                    className={`w-full py-2 rounded-lg border font-semibold text-sm transition ${
                      tools.includes('time') 
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tools.includes('time') ? 'Deactivate' : 'Activate'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 opacity-75 hover:opacity-100 transition hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <i className="fa-solid fa-globe text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Web Search</h3>
                      <p className="text-xs text-slate-500">Mencari informasi online</p>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg border border-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed">Coming Soon</button>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 opacity-75 hover:opacity-100 transition hover:shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                      <i className="fa-solid fa-file-excel text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Google Sheets</h3>
                      <p className="text-xs text-slate-500">Membaca/menulis data spreadsheet</p>
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg border border-slate-200 text-slate-400 font-semibold text-sm cursor-not-allowed">Coming Soon</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FOLLOWUPS */}
          {tab === 'followups' && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Automated Follow-ups</h2>
                  <p className="text-sm text-slate-500 mt-1">Sapa kembali pengguna jika mereka berhenti merespons.</p>
                </div>
                <button 
                  onClick={addFollowUp}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white pl-4 pr-5 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Add Follow-up
                </button>
              </div>

              <div className="space-y-6">
                {followUps.map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/80 transition-all animate-slide-up">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-pink-500"></div>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-full md:w-48 shrink-0">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-1">
                          <i className="fa-regular fa-clock text-orange-400"></i> Trigger Delay
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={f.delay} 
                            onChange={(e) => updFollowUp(i, { delay: e.target.value })}
                            className="pl-4 pr-12 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-2 focus:ring-orange-100 outline-none transition"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-xs text-slate-400 font-medium">mins</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">Menit setelah chat terakhir.</p>
                      </div>

                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Follow-up Instruction</label>
                          <button 
                            onClick={() => delFollowUp(i)}
                            className="text-slate-300 hover:text-red-500 transition text-sm w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                        <textarea 
                          value={f.prompt} 
                          onChange={(e) => updFollowUp(i, { prompt: e.target.value })}
                          className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition resize-none leading-relaxed"
                          placeholder="Tulis instruksi atau pesan follow-up yang harus dikirim oleh AI..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {!followUps.length && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 shadow-sm shadow-slate-200/50">
                    <i className="fa-regular fa-clock text-3xl mb-2 opacity-50 block"></i>
                    Belum ada follow-up yang dikonfigurasi.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: EVALUATION */}
          {tab === 'evaluation' && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-200/60 text-center py-16 animate-slide-up">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                <i className="fa-solid fa-chart-line"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Agent Performance Evaluation</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Tinjau statistik interaksi, tingkat ketepatan, frekuensi eskalasi manusia, dan ulasan pelanggan.
              </p>
              <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-xs mt-6 hover:bg-slate-800 transition">
                Mulai Audit Performa
              </button>
            </div>
          )}

          {/* TAB: DATABASE (FILES) */}
          {tab === 'database' && (
            <div className="flex flex-col gap-6 animate-slide-up">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Files & Assets Database</h2>
                  <p className="text-sm text-slate-500 mt-1">Kelola dokumen, gambar, dan file aset untuk bot Anda.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
                <input 
                  type="file" 
                  id="db-file-upload" 
                  className="hidden" 
                  onChange={(e) => handleDatabaseFileSelect(e.target.files[0])} 
                />
                <div 
                  onClick={() => document.getElementById('db-file-upload').click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-50/50 hover:border-orange-300 transition group relative overflow-hidden"
                >
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition shadow-sm">
                    <i className="fa-solid fa-folder-plus"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">Upload Documents & Media</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Mendukung Gambar, Dokumen (PDF, DOCX), dan file lainnya. Maks. 25MB.</p>
                </div>

                {dbUploadStatus.status !== 'idle' && (
                  <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${
                    dbUploadStatus.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    dbUploadStatus.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-700 animate-pulse'
                  }`}>
                    {dbUploadStatus.message}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Stored Files ({combinedDatabase.length})</h4>
                <div className="grid grid-cols-1 gap-3">
                  {combinedDatabase.map((f, i) => {
                    const fileKey = f.id || f.storedName || `${f.originalName}-${i}`
                    const link = getFileLink(f)
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(f.originalName);

                    return (
                      <div key={fileKey} className="flex flex-col p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                              isImage ? 'bg-purple-50 text-purple-500' : 'bg-red-50 text-red-500'
                            }`}>
                              <i className={isImage ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf'}></i>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{f.originalName}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="font-mono">Source: {f.source === 'remote' ? 'Server' : 'Local'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{f.size ? `${(f.size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleLinkPanel(fileKey, f)}
                              className="text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 transition px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2" 
                              title="Get File URL Links"
                            >
                              <i className="fa-solid fa-link text-sm"></i>
                              Get Links
                            </button>
                            <button 
                              onClick={() => deleteDatabaseFile(f)}
                              className="text-slate-400 hover:text-red-500 transition p-2 rounded-full hover:bg-slate-50"
                              title="Delete File"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                            </button>
                          </div>
                        </div>

                        {activeLinkId === fileKey && link && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 animate-slide-up space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Public File URL</label>
                                <button
                                  onClick={() => {
                                    copyLink(link);
                                    alert('Link berhasil disalin!');
                                  }}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 text-xs font-semibold text-slate-700"
                                >
                                  Copy URL
                                </button>
                              </div>
                              <input
                                type="text"
                                readOnly
                                value={link}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
                                onFocus={(e) => e.target.select()}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">AI Markdown Trigger</label>
                                <div className="flex gap-1.5">
                                  <button
                                    disabled={!getAiFileMarkdown(f)}
                                    onClick={() => {
                                      copyLink(getAiFileMarkdown(f));
                                      alert('Markdown untuk AI berhasil disalin!');
                                    }}
                                    className="bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Copy Auto
                                  </button>
                                  <button
                                    disabled={!getAiFileMarkdown(f, 'image')}
                                    onClick={() => {
                                      copyLink(getAiFileMarkdown(f, 'image'));
                                      alert('Markdown image berhasil disalin!');
                                    }}
                                    className="bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Copy Image
                                  </button>
                                  <button
                                    disabled={!getAiFileMarkdown(f, 'sticker')}
                                    onClick={() => {
                                      copyLink(getAiFileMarkdown(f, 'sticker'));
                                      alert('Markdown sticker berhasil disalin!');
                                    }}
                                    className="bg-white border border-slate-200 px-3 py-1 rounded hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Copy Sticker
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                readOnly
                                value={getAiFileMarkdown(f) || 'Upload file ke server dulu agar bisa dipakai AI.'}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 focus:outline-none"
                                onFocus={(e) => e.target.select()}
                              />
                              <p className="mt-1 text-[11px] text-slate-400">
                                Auto mengikuti ekstensi file. Pakai Copy Image untuk paksa kirim sebagai gambar, atau Copy Sticker untuk format sticker jika platform/file mendukung.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!combinedDatabase.length && (
                    <div className="text-center py-10 bg-white rounded-xl border border-slate-100 text-slate-400 shadow-sm">
                      Belum ada file tersimpan dalam database agen ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPLAINTS */}
          {tab === 'complaints' && (
            <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 animate-slide-up">
              <h3 className="text-xl font-bold text-slate-800">Complaint Form Configuration</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Definisikan data/formulir yang wajib ditanyakan AI ketika pelanggan mengajukan komplain atau keluhan.
              </p>

              <div className="space-y-3">
                {complaintFields.map((field, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition"
                      value={field}
                      onChange={(e) => {
                        const next = [...complaintFields];
                        next[i] = e.target.value;
                        setComplaintFields(next);
                      }}
                      placeholder="e.g. Nama Lengkap"
                    />
                    <button 
                      onClick={() => {
                        const next = [...complaintFields];
                        next.splice(i, 1);
                        setComplaintFields(next);
                      }}
                      className="text-slate-400 hover:text-red-500 transition p-2.5 rounded-xl hover:bg-slate-50 border border-slate-200"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setComplaintFields([...complaintFields, ''])}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition text-xs mt-2"
                >
                  + Add Field
                </button>
              </div>

              <hr className="my-8 border-slate-150" />

              <h3 className="text-xl font-bold text-slate-800">Complaint Notifications</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Secara otomatis teruskan laporan keluhan ke manajer atau akun tertentu.</p>

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  id="complaint-notify-enable"
                  checked={complaintNotification.enabled}
                  onChange={(e) => setComplaintNotification({ ...complaintNotification, enabled: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="complaint-notify-enable" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Aktifkan Notifikasi Terusan Keluhan
                </label>
              </div>

              {complaintNotification.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notification Platform</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-orange-100 outline-none transition shadow-sm"
                      value={complaintNotification.platformId || ''}
                      onChange={(e) => setComplaintNotification({ ...complaintNotification, platformId: e.target.value })}
                    >
                      <option value="">Select Platform</option>
                      {platforms.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Destination (No. HP atau Chat ID)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition"
                      placeholder="e.g. 628123456789 (WA) or 123456789 (Telegram ID)"
                      value={complaintNotification.destination || ''}
                      onChange={(e) => setComplaintNotification({ ...complaintNotification, destination: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400">
                      Gunakan format nomor HP dengan kode negara (e.g. 628...) tanpa karakter "+" untuk integrasi WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI SETTINGS */}
          {tab === 'ai-settings' && (
            <div className="space-y-6 animate-slide-up">
              
              {/* Header card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fa-solid fa-microchip text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Model Settings</h3>
                    <p className="text-slate-400 text-sm">Konfigurasi model AI khusus untuk agent ini</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 bg-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                  <i className="fa-solid fa-circle-info text-orange-400"></i>
                  <span>Pengaturan ini akan <strong className="text-white">menimpa konfigurasi global</strong> hanya untuk agent ini. Kosongkan jika ingin menggunakan pengaturan default sistem.</span>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
                <h4 className="text-base font-bold text-slate-800 mb-1">AI Provider</h4>
                <p className="text-xs text-slate-500 mb-4">Pilih provider AI yang akan digunakan untuk agent ini.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'openai', label: 'OpenAI Compatible', icon: 'fa-robot', desc: 'OpenAI API atau provider yang kompatibel (LocalAI, Ollama, dll)' },
                    { id: 'global', label: 'Gunakan Default Sistem', icon: 'fa-globe', desc: 'Gunakan konfigurasi AI global dari server' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAiSettings(prev => ({ ...prev, provider: p.id }))}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                        aiSettings.provider === p.id
                          ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        aiSettings.provider === p.id ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <i className={`fa-solid ${p.icon} text-sm`}></i>
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${aiSettings.provider === p.id ? 'text-orange-700' : 'text-slate-700'}`}>{p.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* OpenAI Compatible Settings */}
              {aiSettings.provider === 'openai' && (
                <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-5">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">OpenAI Compatible Configuration</h4>
                    <p className="text-xs text-slate-500">Kompatibel dengan OpenAI API, LocalAI, Ollama (via OpenAI compat), LM Studio, Together AI, Groq, dan lainnya.</p>
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Base URL <span className="text-slate-400 font-normal">(endpoint API)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        <i className="fa-solid fa-link"></i>
                      </span>
                      <input
                        type="url"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition"
                        placeholder="https://api.openai.com/v1 atau http://localhost:11434/v1"
                        value={aiSettings.baseUrl || ''}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Contoh: <code className="bg-slate-100 px-1 rounded">http://localhost:20128/v1</code> untuk LocalAI lokal</p>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      API Key <span className="text-slate-400 font-normal">(opsional jika lokal)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        <i className="fa-solid fa-key"></i>
                      </span>
                      <input
                        type="password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition font-mono"
                        placeholder="sk-..."
                        value={aiSettings.apiKey || ''}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Untuk server lokal, bisa diisi dengan nilai apapun (misal: <code className="bg-slate-100 px-1 rounded">local</code>)</p>
                  </div>

                  {/* Model Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Model Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        <i className="fa-solid fa-brain"></i>
                      </span>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition font-mono"
                        placeholder="gpt-4o-mini, llama3, mmf/mimo-auto, dll"
                        value={aiSettings.model || ''}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Nama model yang tersedia di provider Anda</p>
                  </div>

                  {/* Temperature & Max Tokens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Temperature
                        <span className="ml-2 text-orange-500 font-bold">{aiSettings.temperature ?? 0.7}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={aiSettings.temperature ?? 0.7}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full accent-orange-500"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0 – Deterministik</span>
                        <span>2 – Sangat Kreatif</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Max Tokens <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          <i className="fa-solid fa-hashtag"></i>
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="32000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition"
                          placeholder="Kosong = default model"
                          value={aiSettings.maxTokens || ''}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: e.target.value ? parseInt(e.target.value) : '' }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <i className="fa-solid fa-circle-info text-blue-400 mt-0.5 shrink-0"></i>
                    <div className="text-sm text-blue-700">
                      <strong>Tips Kompatibilitas:</strong>
                      <ul className="mt-1 space-y-0.5 text-blue-600 text-xs">
                        <li>• <strong>LocalAI / LM Studio:</strong> Base URL <code className="bg-blue-100 px-1 rounded">http://localhost:PORT/v1</code></li>
                        <li>• <strong>Ollama:</strong> Base URL <code className="bg-blue-100 px-1 rounded">http://localhost:11434/v1</code>, API Key <code className="bg-blue-100 px-1 rounded">ollama</code></li>
                        <li>• <strong>Groq:</strong> Base URL <code className="bg-blue-100 px-1 rounded">https://api.groq.com/openai/v1</code></li>
                        <li>• <strong>Together AI:</strong> Base URL <code className="bg-blue-100 px-1 rounded">https://api.together.xyz/v1</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Global Default Info */}
              {aiSettings.provider === 'global' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex gap-4 items-start">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-globe text-slate-500"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 mb-1">Menggunakan Konfigurasi Default Sistem</h4>
                    <p className="text-sm text-slate-500">Agent ini akan menggunakan model dan konfigurasi AI yang dikonfigurasi di file <code className="bg-slate-100 px-1 rounded">.env</code> server. Pergi ke menu <strong>Settings</strong> untuk mengubah konfigurasi global.</p>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  {saving ? 'Menyimpan...' : 'Simpan AI Settings'}
                </button>
              </div>

            </div>
          )}

          {/* TAB: SALES */}
          {tab === 'sales' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/60 animate-slide-up">
              <AgentSales agent={agent} onUpdate={setAgent} />
            </div>
          )}

        </main>

        {/* RIGHT COLUMN: LIVE PREVIEW CHATBOT WIDGET (ONLY ON GENERAL TAB) */}
        {tab === 'general' && (
          <aside className="lg:col-span-5 xl:col-span-4 sticky top-8 animate-slide-up min-w-0 box-border">
            <div className="sticky top-8">
              
              {/* Wrapper for Chat card without backdrop blur */}
              <div>
                {/* Outer Card Container (Matches the card in the reference image, border and glow removed) */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 flex flex-col h-[700px] overflow-hidden p-5 pt-2 pb-5 relative transform transition hover:scale-[1.01] duration-500">
                  
                  {/* Header: Title, Subtitle, Refresh button (Inside the container, tight layout) */}
                  <div className="flex flex-col mb-1.5 px-1.5">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <i className="fa-regular fa-eye text-slate-750 text-lg"></i>
                        <h3 className="font-bold text-slate-800 text-lg leading-none m-0 p-0">Preview Live</h3>
                      </div>
                      <button 
                        onClick={() => setMessages([])} 
                        className="text-slate-400 hover:text-slate-750 transition p-1.5 rounded-full hover:bg-slate-100"
                        title="Refresh Chat"
                      >
                        <i className="fa-solid fa-rotate-right text-base"></i>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-[2px] font-medium leading-none m-0 p-0">
                      Lihat bagaimana {name || agent?.name || 'SelaluTeh AI'} merespons percakapan.
                    </p>
                  </div>

                  {/* Inner Chat Box Container */}
                  <div className="flex-1 border border-slate-100 rounded-[1.5rem] bg-white flex flex-col overflow-hidden relative min-h-0">
                    
                    {/* Bot Header */}
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2.5 bg-white z-10">
                      <div className="relative group cursor-pointer shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center group-hover:shadow-sm transition">
                          <i className="fa-solid fa-robot text-slate-500 text-sm"></i>
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-bold text-slate-800 text-sm leading-none truncate max-w-[150px]">{name || agent?.name || 'SelaluTeh AI'}</h3>
                        <div className="flex items-center gap-1 -mt-[5px] leading-none">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] text-slate-400 font-semibold leading-none">Online</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages Box */}
                    <div className="flex-1 bg-white px-6 pt-4 pb-6 overflow-y-auto space-y-2 scroll-smooth min-h-0">
                      
                      {/* Today date divider */}
                      <div className="flex items-center justify-center mt-1 mb-1.5">
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                        <span className="text-[10px] text-slate-400 font-medium px-3">Hari ini</span>
                        <div className="flex-1 h-[1px] bg-slate-100"></div>
                      </div>

                      {/* First Message (Welcome message) */}
                      {(() => {
                        const previewWelcome = normalizePreviewMessage(
                          { from: 'ai', text: welcomeMessage || 'Halo! 👋 Ada yang bisa saya bantu hari ini?' },
                          database,
                        )
                        return (
                          <div className="flex flex-col items-start max-w-[85%] animate-slide-up">
                            <div className="inline-block w-fit max-w-full bg-slate-50 border border-slate-100 text-slate-800 px-4 pt-3 pb-5 rounded-2xl rounded-tl-none text-sm leading-relaxed relative shadow-sm">
                              <PreviewAttachment attachment={previewWelcome.attachment} />
                              {stickerUrl && (
                                <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm max-w-[200px] mt-2 bg-slate-100">
                                  <img src={buildPreviewFileUrl(stickerUrl)} alt="sticker" className="block w-full h-auto object-contain" />
                                </div>
                              )}
                              {previewWelcome.text && (
                                <p className={`${previewWelcome.attachment || stickerUrl ? 'mt-2' : 'mt-0'} mb-0 whitespace-normal break-words`}>
                                  {previewWelcome.text}
                                </p>
                              )}
                              <div className="absolute bottom-1 right-2 text-[9px] text-slate-400">
                                {getChatTime()}
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Dynamic user and AI messages */}
                      {messages.map((m, idx) => {
                        const normalizedMessage = normalizePreviewMessage(m, database);
                        const isUser = normalizedMessage.from === 'user';
                        return (
                          <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full animate-slide-up`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative shadow-sm pb-6 ${
                              isUser 
                                ? 'bg-pink-50 border border-pink-100 text-slate-800 rounded-tr-none'
                                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                            }`}>
                              {normalizedMessage.sticker && (
                                <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm max-w-[200px] mt-1 bg-slate-100">
                                  <img src={buildPreviewFileUrl(normalizedMessage.sticker)} alt="sticker" className="block w-full h-auto object-contain" />
                                </div>
                              )}

                              <PreviewAttachment attachment={normalizedMessage.attachment} />

                              {normalizedMessage.text && (
                                <p className={`${normalizedMessage.attachment || normalizedMessage.sticker ? 'mt-2' : 'mt-0'} mb-0 break-words ${isUser ? 'pr-12' : ''}`}>
                                  {normalizedMessage.text}
                                </p>
                              )}

                              {isUser ? (
                                <div className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[9px] text-pink-400 font-medium">
                                  <span>{getChatTime()}</span>
                                  <i className="fa-solid fa-check-double text-[8px]"></i>
                                </div>
                              ) : (
                                <div className="absolute bottom-1 right-2 text-[9px] text-slate-400">
                                  {getChatTime()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing Indicator */}
                      {testing && (
                        <div className="flex flex-col items-start max-w-[85%] animate-slide-up">
                          <div className="bg-slate-50 border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggestion Chips / Quick Replies */}
                    <div className="px-6 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                      {[
                        'Rekomendasi untuk diet',
                        'Teh tanpa kafein',
                        'Promo hari ini'
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendQuickReply(chip)}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-orange-500 hover:border-orange-300 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm hover:shadow-md transition active:scale-95 shrink-0"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 pt-2 bg-white pb-6 border-t border-slate-100 shrink-0">
                      {testAttachment && (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 animate-slide-up">
                          <img src={testAttachment.preview} alt="Attachment preview" className="w-10 h-10 object-cover rounded" />
                          <span className="flex-1 text-xs truncate font-medium text-slate-600">{testAttachment.file?.name}</span>
                          <button onClick={() => setTestAttachment(null)} className="text-slate-400 hover:text-red-500 p-1">
                            <i className="fa-solid fa-xmark text-sm"></i>
                          </button>
                        </div>
                      )}

                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Ketik pesan Anda..." 
                          value={testMsg}
                          onChange={(e) => setTestMsg(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendTest()}
                          className="w-full bg-slate-50 text-slate-600 placeholder-slate-400 rounded-2xl pl-5 pr-24 py-4 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition shadow-inner text-sm font-medium border border-slate-200"
                        />
                        
                        <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                          <input 
                            type="file" 
                            id="test-photo-input" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setTestAttachment({ file, preview: reader.result });
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                          <button 
                            onClick={() => document.getElementById('test-photo-input')?.click()} 
                            className="w-10 h-10 rounded-xl hover:bg-slate-200 text-slate-400 flex items-center justify-center transition"
                            title="Attach Image"
                          >
                            <i className="fa-solid fa-paperclip text-sm"></i>
                          </button>
                          
                          <button 
                            onClick={sendTest} 
                            disabled={testing}
                            className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 transition transform active:scale-95 disabled:opacity-50"
                          >
                            <i className="fa-solid fa-paper-plane text-sm"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom Footer outside Chat Container */}
                <div className="text-center mt-3 shrink-0">
                  <p className="text-[10px] text-slate-400 font-medium">Preview ini menggunakan contoh respons AI. Hasil aktual dapat berbeda.</p>
                </div>

              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
