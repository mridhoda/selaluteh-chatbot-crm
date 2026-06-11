import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function QuickActions() {
  const nav = useNavigate()
  const items = [
    {
      title: '1. Hubungkan Platform',
      desc: 'Mulai terima pesan dari Whatsapp, IG, dan FB Anda!',
      icon: '📨',
      href: '/app/platforms',
    },
    {
      title: '2. Buat AI Agent',
      desc: 'Jawab pesan masuk dengan Agent AI anda',
      icon: '🤖',
      href: '/app/agents',
    },
    {
      title: '3. Undang Agen Manusia',
      desc: 'Undang tim Anda untuk membantu menjawab chat',
      icon: '👨‍💼',
      href: '/app/humans',
    },
    {
      title: '4. Konek AI Agent ke Inbox',
      desc: 'Hubungkan AI Agent dan Human Agent ke Platform',
      icon: '🔗', // or similar
      href: '/app/agents',
    },
  ]
  return (
    <div className='quick-container'>
      <h2>Selamat datang kembali di KALIS AI!</h2>
      <div className='quick'>
        {items.map((item) => (
          <div key={item.href + item.title} className='card' onClick={() => nav(item.href)}>
            <div className='icon'>{item.icon}</div>
            <div className='content'>
              <div className='title'>{item.title}</div>
              <div className='desc'>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <a
        href='#'
        className='footer-link'
        onClick={(e) => {
          e.preventDefault()
          alert('Tutorial coming soon!')
        }}
      >
        Butuh bantuan lebih? Lihat Tutorial Youtube kami
      </a>
    </div>
  )
}
