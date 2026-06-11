import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Check, Star, ArrowRight, Menu, X, Bot, Zap, Shield, ChevronRight, Activity, Users } from 'lucide-react';
import brandImage from '../assets/Brand.png';

/**
 * KALIS.AI Landing Page Redesign
 * * Design System Implementation:
 * - Font: Plus Jakarta Sans
 * - Palette: Slate-50 bg, White surface, Orange-Pink gradient accents
 * - Radius: Rounded-2xl / Full
 * - Animation: Custom CSS keyframes + React state transitions + Scroll Reveal
 */

// --- Helper Component for Scroll Animations ---
const Reveal = ({ children, className = "", delay = 0 }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`reveal-transition transform ${className} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
        >
            {children}
        </div>
    );
};

// --- Components ---

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-110 duration-300">
                        <Bot size={24} />
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">KALIS.AI</span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {['Fitur', 'Harga', 'Testimoni'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors relative group">
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
                        </a>
                    ))}
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                        Login
                    </button>
                    <button className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
                        Daftar Sekarang
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-slate-600"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 md:hidden shadow-xl animate-fade-in-down">
                    <div className="flex flex-col gap-4">
                        {['Fitur', 'Harga', 'Testimoni'].map((item) => (
                            <a key={item} href="#" className="text-slate-600 font-medium py-2 block hover:text-orange-500">
                                {item}
                            </a>
                        ))}
                        <hr className="border-slate-100" />
                        <button className="w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold">Login</button>
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-lg shadow-orange-500/20">
                            Daftar Sekarang
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-visible">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-b from-orange-50/50 to-pink-50/50 blur-3xl opacity-60 rounded-bl-[100px]"></div>
            <div className="absolute top-40 left-10 -z-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob"></div>
            <div className="absolute top-40 right-10 -z-10 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob animation-delay-2000"></div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div className="space-y-8 z-10">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            #1 Platform Customer Service AI Indonesia
                        </div>
                    </Reveal>

                    <Reveal delay={200}>
                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                            Layani Pelanggan <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                                24/7 Non-Stop
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={400}>
                        <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                            Otomatiskan layanan pelanggan Anda, tingkatkan penjualan, dan bangun hubungan yang lebih baik menggunakan agen AI canggih kami yang bekerja tanpa henti.
                        </p>
                    </Reveal>

                    <Reveal delay={600}>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group">
                                Daftar Sekarang
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 rounded-full bg-white text-slate-700 font-bold text-lg border border-slate-200 shadow-lg shadow-slate-200/50 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300">
                                Konsultasi Gratis
                            </button>
                        </div>
                    </Reveal>

                    <Reveal delay={800}>
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm">
                                <div className="flex text-yellow-400 gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                                </div>
                                <p className="text-slate-600 font-medium">Dipercaya 500+ Bisnis</p>
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* Right Content - Animated Agent Image */}
                <div className="relative h-[600px] hidden lg:block select-none pointer-events-none">
                    <Reveal delay={400} className="w-full h-full flex items-end justify-center relative">

                        {/* Glow Effect behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-b from-orange-400/20 to-pink-500/20 rounded-full blur-[80px]"></div>

                        {/* Main Agent Image with Float Animation */}
                        {/* NOTE: Replace the src below with your uploaded image file path: 'image_c2c496.jpg' or similar */}
                        <div className="relative z-10 animate-float w-[450px]">
                            <img
                                src={brandImage}
                                alt="Customer Service Agent"
                                className="w-full h-auto object-cover drop-shadow-2xl"
                                style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}
                            />
                        </div>

                        {/* Floating Info Cards (Glassmorphism) */}
                        <div className="absolute top-32 left-0 z-20 animate-float-delayed">
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Response Time</p>
                                    <p className="text-lg font-bold text-slate-900">0.2 Seconds</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-32 -right-4 z-20 animate-float">
                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase">Daily Chats</p>
                                    <p className="text-lg font-bold text-slate-900">12,500+</p>
                                </div>
                            </div>
                        </div>

                        {/* Abstract Shapes */}
                        <div className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl rotate-12 opacity-80 blur-sm animate-pulse"></div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
};

const ChatDemo = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Halo, apakah produk ini ready?", sender: 'user', time: '10:00' },
    ]);
    const [typing, setTyping] = useState(false);
    const sectionRef = useRef(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        // Only start chat animation when section is in view
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasStarted) {
                setHasStarted(true);
                startChatSequence();
            }
        }, { threshold: 0.5 });

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [hasStarted]);

    const startChatSequence = async () => {
        // Step 1: Wait initial
        await new Promise(r => setTimeout(r, 1000));

        // Step 2: Bot starts typing
        setTyping(true);
        await new Promise(r => setTimeout(r, 1500));

        // Step 3: Bot responds
        setTyping(false);
        setMessages(prev => [...prev, {
            id: 2,
            text: "Tentu! Stok kami selalu update. Silahkan diorder kak! 😊",
            sender: 'bot',
            time: '10:00'
        }]);

        // Step 4: User responds
        await new Promise(r => setTimeout(r, 2000));
        setMessages(prev => [...prev, {
            id: 3,
            text: "Oke, saya order sekarang ya.",
            sender: 'user',
            time: '10:01'
        }]);

        // Step 5: Bot confirms
        await new Promise(r => setTimeout(r, 1000));
        setTyping(true);
        await new Promise(r => setTimeout(r, 1500));
        setTyping(false);
        setMessages(prev => [...prev, {
            id: 4,
            text: "Siap! Terima kasih. Pesanan akan segera kami proses.",
            sender: 'bot',
            time: '10:01'
        }]);
    };

    return (
        <section ref={sectionRef} className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

                {/* Left: The Phone Demo */}
                <Reveal delay={200} className="order-2 lg:order-1 flex justify-center lg:justify-end">
                    <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-8 border-slate-900 ring-1 ring-slate-900/50">
                        {/* Screen */}
                        <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative">
                            {/* Header */}
                            <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 shadow-sm z-10">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                    K
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Kalis Store</p>
                                    <p className="text-[10px] text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
                                <div className="text-center text-[10px] text-slate-400 my-2">Today</div>

                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.sender === 'user'
                                                ? 'bg-white text-slate-700 rounded-br-sm border border-slate-100'
                                                : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                            <div className={`text-[9px] mt-1 text-right opacity-70 ${msg.sender === 'user' ? 'text-slate-400' : 'text-white'}`}>
                                                {msg.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {typing && (
                                    <div className="flex justify-start animate-fade-in">
                                        <div className="bg-slate-200 p-3 rounded-2xl rounded-bl-sm flex gap-1 items-center h-8">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animation-delay-200"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animation-delay-400"></span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-slate-100">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs text-slate-400 flex items-center">
                                        Ketik pesan...
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl"></div>
                    </div>
                </Reveal>

                {/* Right: Text Content */}
                <div className="order-1 lg:order-2 space-y-6">
                    <Reveal>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
                            <Zap size={24} />
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                            Tingkatkan Penjualan <br /> dan Efisiensi
                        </h2>
                    </Reveal>

                    <Reveal delay={200}>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            Platform kami mengubah prospek menjadi pelanggan setia secara otomatis.
                            Dengan kecerdasan buatan, Anda dapat fokus pada strategi bisnis sementara
                            agen AI kami menangani ribuan percakapan sekaligus.
                        </p>
                    </Reveal>

                    <ul className="space-y-4 pt-4">
                        {[
                            "Respon instan 24/7 tanpa henti",
                            "Integrasi mulus ke WhatsApp & Instagram",
                            "Analitik mendalam untuk wawasan bisnis"
                        ].map((item, idx) => (
                            <Reveal key={idx} delay={300 + (idx * 100)}>
                                <li className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    {item}
                                </li>
                            </Reveal>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const PricingCard = ({ title, price, features, isPro }) => (
    <div className={`relative p-8 rounded-[2rem] transition-all duration-300 hover:-translate-y-2 group ${isPro
            ? 'bg-slate-900 text-white shadow-2xl shadow-orange-500/20 border border-slate-800'
            : 'bg-white text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/70'
        }`}>
        {isPro && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                PALING LARIS
            </div>
        )}

        <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{price}</span>
                {price !== "Hubungi Kami" && <span className={`text-sm ${isPro ? 'text-slate-400' : 'text-slate-500'}`}>/bulan</span>}
            </div>
        </div>

        <hr className={`border-t mb-6 ${isPro ? 'border-slate-800' : 'border-slate-100'}`} />

        <ul className="space-y-4 mb-8">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check size={18} className={`shrink-0 mt-0.5 ${isPro ? 'text-orange-400' : 'text-orange-500'}`} />
                    <span className={isPro ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
                </li>
            ))}
        </ul>

        <button className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 ${isPro
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:shadow-orange-500/40'
                : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
            }`}>
            {price === "Hubungi Kami" ? "Hubungi Sales" : "Pilih Paket"}
        </button>
    </div>
);

const Pricing = () => {
    return (
        <section className="py-24 bg-slate-50" id="harga">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <Reveal>
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Pilih Paket Sesuai Kebutuhan</h2>
                        <p className="text-slate-600">Investasi terbaik untuk pertumbuhan bisnis Anda. Upgrade kapan saja.</p>
                    </Reveal>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center">
                    <Reveal delay={0} className="h-full">
                        <PricingCard
                            title="Basic"
                            price="Rp 150rb"
                            features={["1 Agen AI", "1.000 Pesan/Bulan", "Integrasi WhatsApp", "Analitik Dasar"]}
                        />
                    </Reveal>
                    <Reveal delay={200} className="h-full">
                        <PricingCard
                            title="Pro"
                            price="Rp 450rb"
                            isPro={true}
                            features={["5 Agen AI", "5.000 Pesan/Bulan", "Integrasi Multi-platform", "Analitik Lanjutan", "Dukungan Prioritas"]}
                        />
                    </Reveal>
                    <Reveal delay={400} className="h-full">
                        <PricingCard
                            title="Enterprise"
                            price="Hubungi Kami"
                            features={["Agen AI Tanpa Batas", "Volume Pesan Kustom", "Fitur Kustom", "Dukungan Khusus (Dedicated)"]}
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
};

const TestimonialCard = ({ quote, name, role, company }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
        <div>
            <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-current" />)}
            </div>
            <p className="text-slate-700 leading-relaxed mb-6 italic">"{quote}"</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                {name.charAt(0)}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">{role}, {company}</p>
            </div>
        </div>
    </div>
);

const Testimonials = () => {
    const testimonials = [
        {
            quote: "Sejak menggunakan platform ini, efisiensi layanan pelanggan kami meningkat 200%. Sangat direkomendasikan!",
            name: "John Doe",
            role: "CEO",
            company: "TechCorp"
        },
        {
            quote: "Analitiknya sangat membantu kami memahami pelanggan. Penjualan kami naik 30% dalam tiga bulan pertama.",
            name: "Jane Smith",
            role: "Marketing Head",
            company: "Marketify"
        },
        {
            quote: "Agen AI-nya luar biasa! Menghemat banyak waktu tim kami untuk menjawab pertanyaan berulang.",
            name: "Emily White",
            role: "Ops Manager",
            company: "Logistix"
        }
    ];

    return (
        <section className="py-24 bg-white relative overflow-hidden" id="testimoni">
            {/* Background blobs */}
            <div className="absolute left-0 bottom-0 w-64 h-64 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6">
                <Reveal>
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-16">Apa Kata Klien Kami</h2>
                </Reveal>

                <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                    {testimonials.map((t, idx) => (
                        <Reveal key={idx} delay={idx * 200} className="h-full">
                            <TestimonialCard {...t} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white">
                            <Bot size={20} />
                        </div>
                        <span className="text-lg font-bold text-slate-900">KALIS.AI</span>
                    </div>
                    <p className="text-slate-500 max-w-sm">
                        Platform AI Customer Service terdepan untuk membantu bisnis Anda berkembang lebih cepat dengan otomatisasi cerdas.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">Produk</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><a href="#" className="hover:text-orange-600">Fitur Utama</a></li>
                        <li><a href="#" className="hover:text-orange-600">Integrasi</a></li>
                        <li><a href="#" className="hover:text-orange-600">Harga</a></li>
                        <li><a href="#" className="hover:text-orange-600">Enterprise</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 mb-4">Perusahaan</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><a href="#" className="hover:text-orange-600">Tentang Kami</a></li>
                        <li><a href="#" className="hover:text-orange-600">Karir</a></li>
                        <li><a href="#" className="hover:text-orange-600">Kontak</a></li>
                        <li><a href="#" className="hover:text-orange-600">Kebijakan Privasi</a></li>
                    </ul>
                </div>
            </div>
            <div className="text-center pt-8 border-t border-slate-200 text-sm text-slate-500">
                © 2025 KALIS.AI. Semua Hak Dilindungi.
            </div>
        </div>
    </footer>
);

// --- Main App Component ---

const App = () => {
    return (
        <div className="font-sans text-slate-900 bg-slate-50 selection:bg-orange-100 selection:text-orange-600">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        /* Custom Keyframe Animations */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out 1s infinite;
        }

        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.3s ease-out forwards;
        }

        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Scroll Reveal Transition */
        .reveal-transition {
          transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>

            <Navbar />
            <Hero />
            <ChatDemo />
            <Pricing />
            <Testimonials />
            <Footer />
        </div>
    );
};

export default App;