import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment,
  faCheck,
  faStar,
  faArrowRight,
  faBars,
  faTimes,
  faRobot,
  faBolt,
  faShieldAlt,
  faChevronRight,
  faChartLine,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import brandImage from '../../../assets/logos/Brand.png'

// Helper Component for Scroll Animations (will be controlled by CSS)
const Reveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const classes = `reveal ${className} ${isVisible ? 'is-visible' : ''}`

  return (
    <div
      ref={ref}
      className={classes}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// --- Components ---

const NewNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`lp-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className='lp-container lp-navbar-content'>
        <div className='lp-logo'>
          <div className='lp-logo-icon'>
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <span className='lp-logo-text'>KALIS.AI</span>
        </div>

        <div className='lp-nav-links'>
          {['Fitur', 'Harga', 'Testimoni'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className='lp-nav-link'
            >
              {item}
            </a>
          ))}
        </div>

        <div className='lp-auth-buttons'>
          <Link to='/login' className='lp-btn-login'>
            Login
          </Link>
          <Link to='/register' className='lp-btn-register'>
            Daftar Sekarang
          </Link>
        </div>

        <button
          className='lp-mobile-toggle'
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className='lp-mobile-menu'>
          <div className='lp-mobile-menu-content'>
            {['Fitur', 'Harga', 'Testimoni'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className='lp-mobile-link'
              >
                {item}
              </a>
            ))}
            <hr />
            <Link to='/login' className='lp-btn-login-mobile'>
              Login
            </Link>
            <Link to='/register' className='lp-btn-register-mobile'>
              Daftar Sekarang
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

const Hero = () => {
  return (
    <section className='lp-hero'>
      <div className='lp-hero-bg'></div>
      <div className='lp-container lp-hero-content-grid'>
        <div className='lp-hero-text'>
          <Reveal>
            <div className='lp-hero-badge'>
              <span className='lp-hero-badge-dot'></span>
              #1 Platform Customer Service AI Indonesia
            </div>
          </Reveal>

          <Reveal>
            <h1 className='lp-hero-title'>
              Layani Pelanggan <br />
              <span className='lp-hero-title-gradient'>24/7 Non-Stop</span>
            </h1>
          </Reveal>

          <Reveal>
            <p className='lp-hero-subtitle'>
              Otomatiskan layanan pelanggan Anda, tingkatkan penjualan, dan
              bangun hubungan yang lebih baik menggunakan agen AI canggih kami
              yang bekerja tanpa henti.
            </p>
          </Reveal>

          <Reveal>
            <div className='lp-hero-buttons'>
              <Link to='/register' className='lp-btn lp-btn-primary'>
                Daftar Sekarang <FontAwesomeIcon icon={faArrowRight} />
              </Link>
              <Link to='/contact' className='lp-btn lp-btn-secondary'>
                Konsultasi Gratis
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <div className='lp-hero-social-proof'>
              <div className='lp-hero-avatars'>
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt='User'
                    className='lp-hero-avatar-img'
                  />
                ))}
              </div>
              <div className='lp-hero-rating'>
                <div className='lp-stars'>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesomeIcon key={s} icon={faStar} />
                  ))}
                </div>
                <p>Dipercaya 500+ Bisnis</p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className='lp-hero-image-section'>
          <Reveal className='lp-hero-image-wrapper'>
            <div className='lp-hero-image-glow'></div>
            <div className='lp-hero-image-float'>
              <img src={brandImage} alt='Agent' className='lp-hero-main-img' />
            </div>

            <div className='lp-hero-card response-time'>
              <div
                className='lp-hero-card-icon'
                style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}
              >
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div>
                <p className='lp-hero-card-title'>Response Time</p>
                <p className='lp-hero-card-value'>0.2 Seconds</p>
              </div>
            </div>

            <div className='lp-hero-card daily-chats'>
              <div
                className='lp-hero-card-icon'
                style={{ backgroundColor: '#FFEDD5', color: '#9A3412' }}
              >
                <FontAwesomeIcon icon={faComment} />
              </div>
              <div>
                <p className='lp-hero-card-title'>Daily Chats</p>
                <p className='lp-hero-card-value'>12,500+</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const ChatDemo = () => {
  return (
    <section className='lp-section lp-chat-demo'>
      <div className='lp-container lp-chat-demo-grid'>
        <div className='lp-chat-demo-phone'>
          <div className='lp-phone-mockup'>
            <div className='lp-phone-screen'>
              <div className='lp-phone-header'>
                <div className='lp-phone-header-icon'>K</div>
                <div>
                  <p className='lp-phone-header-title'>Kalis Store</p>
                  <p className='lp-phone-header-status'>
                    <span className='lp-online-dot'></span> Online
                  </p>
                </div>
              </div>
              <div className='lp-phone-chat-area'>
                <div className='lp-chat-bubble lp-user'>
                  Halo, apakah produk ini ready?
                </div>
                <div className='lp-chat-bubble lp-bot'>
                  Tentu! Stok kami selalu update. Silahkan diorder kak! 😊
                </div>
              </div>
              <div className='lp-phone-input-area'>
                <div className='lp-phone-input-text'>Ketik pesan...</div>
                <div className='lp-phone-input-send'>
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='lp-chat-demo-text'>
          <Reveal>
            <div className='lp-section-icon'>
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <h2 className='lp-section-title'>
              Tingkatkan Penjualan dan Efisiensi
            </h2>
          </Reveal>
          <Reveal>
            <p className='lp-section-subtitle'>
              Platform kami mengubah prospek menjadi pelanggan setia secara
              otomatis. Dengan kecerdasan buatan, Anda dapat fokus pada strategi
              bisnis sementara agen AI kami menangani ribuan percakapan
              sekaligus.
            </p>
          </Reveal>
          <ul className='lp-feature-list'>
            {[
              'Respon instan 24/7 tanpa henti',
              'Integrasi mulus ke WhatsApp & Instagram',
              'Analitik mendalam untuk wawasan bisnis',
            ].map((item, idx) => (
              <Reveal key={idx}>
                <li className='lp-feature-item'>
                  <div className='lp-feature-icon'>
                    <FontAwesomeIcon icon={faCheck} />
                  </div>
                  {item}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const PricingCard = ({ title, price, features, isPro }) => (
  <div className={`lp-pricing-card ${isPro ? 'pro' : ''}`}>
    {isPro && <div className='lp-pricing-badge'>PALING LARIS</div>}
    <div className='lp-pricing-header'>
      <h3>{title}</h3>
      <div className='lp-pricing-price-wrapper'>
        <span className='lp-pricing-price'>{price}</span>
        {price !== 'Hubungi Kami' && (
          <span className='lp-pricing-period'>/bulan</span>
        )}
      </div>
    </div>
    <hr />
    <ul className='lp-pricing-features'>
      {features.map((feature, idx) => (
        <li key={idx}>
          <FontAwesomeIcon icon={faCheck} className='lp-pricing-check' />{' '}
          {feature}
        </li>
      ))}
    </ul>
    <Link
      to={price === 'Hubungi Kami' ? '/contact' : '/register'}
      className='lp-btn lp-pricing-btn'
    >
      {price === 'Hubungi Kami' ? 'Hubungi Sales' : 'Pilih Paket'}
    </Link>
  </div>
)

const Pricing = () => {
  return (
    <section className='lp-section lp-pricing' id='harga'>
      <div className='lp-container'>
        <div className='lp-section-header'>
          <Reveal>
            <h2 className='lp-section-title'>Pilih Paket Sesuai Kebutuhan</h2>
            <p className='lp-section-subtitle'>
              Investasi terbaik untuk pertumbuhan bisnis Anda. Upgrade kapan
              saja.
            </p>
          </Reveal>
        </div>
        <div className='lp-pricing-grid'>
          <Reveal>
            <PricingCard
              title='Basic'
              price='Rp 150rb'
              features={[
                '1 Agen AI',
                '1.000 Pesan/Bulan',
                'Integrasi WhatsApp',
                'Analitik Dasar',
              ]}
            />
          </Reveal>
          <Reveal>
            <PricingCard
              title='Pro'
              price='Rp 450rb'
              isPro={true}
              features={[
                '5 Agen AI',
                '5.000 Pesan/Bulan',
                'Integrasi Multi-platform',
                'Analitik Lanjutan',
                'Dukungan Prioritas',
              ]}
            />
          </Reveal>
          <Reveal>
            <PricingCard
              title='Enterprise'
              price='Hubungi Kami'
              features={[
                'Agen AI Tanpa Batas',
                'Volume Pesan Kustom',
                'Fitur Kustom',
                'Dukungan Khusus (Dedicated)',
              ]}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

const TestimonialCard = ({ quote, name, role, company }) => (
  <div className='lp-testimonial-card'>
    <div>
      <div className='lp-stars'>
        {[1, 2, 3, 4, 5].map((i) => (
          <FontAwesomeIcon key={i} icon={faStar} />
        ))}
      </div>
      <p className='lp-testimonial-quote'>&quot;{quote}&quot;</p>
    </div>
    <div className='lp-testimonial-author'>
      <div className='lp-testimonial-avatar'>{name.charAt(0)}</div>
      <div>
        <p className='lp-testimonial-name'>{name}</p>
        <p className='lp-testimonial-role'>
          {role}, {company}
        </p>
      </div>
    </div>
  </div>
)

const Testimonials = () => {
  const testimonials = [
    {
      quote:
        'Sejak menggunakan platform ini, efisiensi layanan pelanggan kami meningkat 200%. Sangat direkomendasikan!',
      name: 'John Doe',
      role: 'CEO',
      company: 'TechCorp',
    },
    {
      quote:
        'Analitiknya sangat membantu kami memahami pelanggan. Penjualan kami naik 30% dalam tiga bulan pertama.',
      name: 'Jane Smith',
      role: 'Marketing Head',
      company: 'Marketify',
    },
    {
      quote:
        'Agen AI-nya luar biasa! Menghemat banyak waktu tim kami untuk menjawab pertanyaan berulang.',
      name: 'Emily White',
      role: 'Ops Manager',
      company: 'Logistix',
    },
  ]

  return (
    <section className='lp-section lp-testimonials' id='testimoni'>
      <div className='lp-container'>
        <Reveal>
          <h2 className='lp-section-title lp-text-center'>
            Apa Kata Klien Kami
          </h2>
        </Reveal>
        <div className='lp-testimonials-grid'>
          {testimonials.map((t, idx) => (
            <Reveal key={idx}>
              <TestimonialCard {...t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const NewFooter = () => (
  <footer className='lp-footer'>
    <div className='lp-container'>
      <div className='lp-footer-grid'>
        <div className='lp-footer-about'>
          <div className='lp-logo'>
            <div className='lp-logo-icon small'>
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <span className='lp-logo-text'>KALIS.AI</span>
          </div>
          <p>
            Platform AI Customer Service terdepan untuk membantu bisnis Anda
            berkembang lebih cepat dengan otomatisasi cerdas.
          </p>
        </div>
        <div>
          <h4 className='lp-footer-title'>Produk</h4>
          <ul className='lp-footer-links'>
            <li>
              <a href='#'>Fitur Utama</a>
            </li>
            <li>
              <a href='#'>Integrasi</a>
            </li>
            <li>
              <a href='#'>Harga</a>
            </li>
            <li>
              <a href='#'>Enterprise</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className='lp-footer-title'>Perusahaan</h4>
          <ul className='lp-footer-links'>
            <li>
              <a href='#'>Tentang Kami</a>
            </li>
            <li>
              <a href='#'>Karir</a>
            </li>
            <li>
              <a href='#'>Kontak</a>
            </li>
            <li>
              <a href='#'>Kebijakan Privasi</a>
            </li>
          </ul>
        </div>
      </div>
      <div className='lp-footer-bottom'>
        © {new Date().getFullYear()} KALIS.AI. Semua Hak Dilindungi.
      </div>
    </div>
  </footer>
)

export default function Landing() {
  return (
    <div className='lp-main-wrapper'>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
             `}</style>
      <NewNavbar />
      <Hero />
      <ChatDemo />
      <Pricing />
      <Testimonials />
      <NewFooter />
    </div>
  )
}
