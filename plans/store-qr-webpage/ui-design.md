import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, ChevronLeft, MapPin, 
  Plus, Minus, X, CheckCircle2, Clock, 
  Download, Share2, HelpCircle, ChevronRight,
  AlertCircle
} from 'lucide-react';

const STORE_INFO = {
  name: "SelaluTeh",
  outlet: {
    id: "OUTLET-01",
    name: "SELKOP-01 JEND SUTOYO",
    address: "Jl. Jend. Sutoyo No.1, Surabaya"
  }
};

const CATEGORIES = [
  { id: 'c1', name: 'Bundling' },
  { id: 'c2', name: 'Coffee' },
  { id: 'c3', name: 'Tea' },
  { id: 'c4', name: 'Non Coffee' },
  { id: 'c5', name: 'Snack' }
];

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    categoryId: 'c1',
    name: 'Combo Bread (Aren Creamy)',
    description: 'Roti lembut dengan isian cokelat lumer dipadukan Aren Creamy SelaluTeh.',
    basePrice: 25000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?auto=format&fit=crop&q=80&w=400&h=400',
    isAvailable: true,
    modifiers: [
      {
        id: 'm1',
        title: 'Pilih Ukuran',
        isRequired: true,
        type: 'single',
        options: [
          { id: 'opt1', name: 'Regular', price: 0 },
          { id: 'opt2', name: 'Large', price: 3000 }
        ]
      },
      {
        id: 'm2',
        title: 'Sugar Level',
        isRequired: false,
        type: 'single',
        options: [
          { id: 'opt3', name: 'Normal', price: 0 },
          { id: 'opt4', name: 'Less Sugar', price: 0 },
          { id: 'opt5', name: 'No Sugar', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'p2',
    categoryId: 'c2',
    name: 'Iced Coffee Aren',
    description: 'Espresso blend signature dengan susu segar dan gula aren asli.',
    basePrice: 18000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400&h=400',
    isAvailable: true,
    modifiers: []
  },
  {
    id: 'p3',
    categoryId: 'c5',
    name: 'Roti Bakar Kaya',
    description: 'Roti bakar klasik dengan selai srikaya buatan rumah.',
    basePrice: 18000,
    image: 'https://images.unsplash.com/photo-1584314981149-623c21172a6b?auto=format&fit=crop&q=80&w=400&h=400',
    isAvailable: true,
    modifiers: []
  },
  {
    id: 'p4',
    categoryId: 'c3',
    name: 'Signature Tea',
    description: 'Teh melati pilihan dengan racikan khusus.',
    basePrice: 12000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400&h=400',
    isAvailable: false, // Sold out example
    modifiers: []
  }
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length < 8) return phone;
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 4);
  return `${start} **** ${end}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const StorefrontPage = ({ onProductClick, cartCount, cartTotal, onOpenCart }) => {
  const [activeCategory, setActiveCategory] = useState('c1');

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-bold text-lg text-gray-800">SelaluTeh</span>
        </div>
        <div className="flex items-center gap-4 text-gray-600">
          <Search className="w-5 h-5" />
          <div className="relative cursor-pointer" onClick={onOpenCart}>
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Outlet Badge */}
      <div className="px-4 py-3 bg-white mt-2 flex items-center gap-3">
        <div className="bg-red-50 p-2 rounded-full text-red-600">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Pickup di outlet</p>
          <p className="text-sm font-semibold text-gray-800">{STORE_INFO.outlet.name}</p>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 mt-4">
        <div className="bg-red-600 rounded-xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 w-2/3">
            <h2 className="text-2xl font-black italic mb-1 leading-tight">AREN CREAMY COMBO</h2>
            <p className="text-sm opacity-90">Mulai dari<br/><span className="text-xl font-bold">Rp25.000</span></p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6 sticky top-[60px] z-10 bg-gray-50 py-2">
        <div className="flex overflow-x-auto px-4 gap-2 no-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-4">
        {MOCK_PRODUCTS.filter(p => p.categoryId === activeCategory || activeCategory === 'all').map(product => (
          <div 
            key={product.id} 
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
            onClick={() => product.isAvailable && onProductClick(product)}
          >
            <div className="relative aspect-square bg-gray-100">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded">SOLD OUT</span>
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-red-600 font-bold text-sm mt-auto">{formatRupiah(product.basePrice)}</p>
              
              <button 
                disabled={!product.isAvailable}
                className={`mt-3 w-full py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
                  product.isAvailable ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent max-w-md mx-auto z-20">
          <button 
            onClick={onOpenCart}
            className="w-full bg-red-600 text-white rounded-xl py-3 px-4 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-medium text-sm">{cartCount} item · {formatRupiah(cartTotal)}</span>
            </div>
            <span className="font-bold text-sm">Lihat Keranjang</span>
          </button>
        </div>
      )}
    </div>
  );
};

const ProductSheet = ({ product, onClose, onAddToCart }) => {
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState({});
  const [note, setNote] = useState('');

  // Auto-select first option for required single choice modifiers (Mock UI behavior)
  useEffect(() => {
    if (!product) return;
    const initial = {};
    product.modifiers?.forEach(mod => {
      if (mod.isRequired && mod.options.length > 0) {
        initial[mod.id] = mod.options[0].id;
      }
    });
    setSelections(initial);
  }, [product]);

  if (!product) return null;

  const handleSelection = (modId, optId) => {
    setSelections(prev => ({ ...prev, [modId]: optId }));
  };

  // Calculate local UI total (Note: Actual authority is backend)
  const computeTotal = () => {
    let total = product.basePrice;
    product.modifiers?.forEach(mod => {
      const selectedOptId = selections[mod.id];
      if (selectedOptId) {
        const opt = mod.options.find(o => o.id === selectedOptId);
        if (opt) total += opt.price;
      }
    });
    return total * qty;
  };

  const isReadyToAdd = product.modifiers?.every(mod => !mod.isRequired || selections[mod.id]) ?? true;

  const handleAdd = () => {
    if (!isReadyToAdd) return;
    onAddToCart({
      cartItemId: generateId(),
      product,
      qty,
      selections,
      note,
      uiPrice: computeTotal() / qty // passing per-item calculated price for mock UI
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end max-w-md mx-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl h-[85vh] flex flex-col animate-slide-up">
        {/* Drag Handle & Close */}
        <div className="flex justify-center pt-3 pb-2 relative">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          <button onClick={onClose} className="absolute right-4 top-4 bg-gray-100 p-1.5 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-24">
          <img src={product.image} alt={product.name} className="w-full h-56 object-cover bg-gray-100" />
          
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
            <p className="text-red-600 font-bold text-lg mt-1">{formatRupiah(product.basePrice)}</p>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">{product.description}</p>
          </div>

          <div className="h-2 bg-gray-50" />

          {/* Modifiers */}
          <div className="p-4 flex flex-col gap-6">
            {product.modifiers?.map(mod => (
              <div key={mod.id}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">{mod.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${mod.isRequired ? 'bg-red-50 text-red-600 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                    {mod.isRequired ? 'Wajib' : 'Opsional'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mod.options.map(opt => {
                    const isSelected = selections[mod.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelection(mod.id, opt.id)}
                        className={`px-4 py-2 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                          isSelected 
                            ? 'border-red-600 bg-red-50 text-red-600 font-medium' 
                            : 'border-gray-200 text-gray-700 bg-white'
                        }`}
                      >
                        {opt.name} {opt.price > 0 && <span className="text-xs opacity-70">(+{formatRupiah(opt.price)})</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Note */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Catatan Opsional</h3>
              <input 
                type="text" 
                placeholder="Contoh: jangan terlalu manis" 
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-4">
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-2 border border-gray-200">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-gray-600 disabled:opacity-50" disabled={qty <= 1}>
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-semibold w-4 text-center">{qty}</span>
            <button onClick={() => setQty(Math.min(20, qty + 1))} className="p-2 text-red-600">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleAdd}
            disabled={!isReadyToAdd}
            className="flex-1 bg-red-600 text-white rounded-xl font-bold text-sm flex justify-center items-center disabled:opacity-50 disabled:bg-gray-400"
          >
            Tambah · {formatRupiah(computeTotal())}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckout }) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.uiPrice * item.qty), 0);
  const serviceFee = 2000; // Mock fee
  const total = subtotal + (cart.length > 0 ? serviceFee : 0);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end max-w-md mx-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-[90vh] rounded-t-2xl flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 text-gray-500 bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
            <h2 className="font-bold text-lg text-gray-800">Keranjang</h2>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Keranjang masih kosong</h3>
            <p className="text-sm text-gray-500 mb-6">Yuk pilih menu favoritmu dulu 🍵</p>
            <button onClick={onClose} className="bg-red-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm">
              Mulai Pilih Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-red-50 p-3 mx-4 mt-4 rounded-lg flex items-start gap-3 border border-red-100">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-red-600 font-medium">Pickup di:</p>
                  <p className="text-sm font-semibold text-gray-800">{STORE_INFO.outlet.name}</p>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {cart.map(item => (
                  <div key={item.cartItemId} className="flex gap-3 pb-4 border-b border-gray-100">
                    <img src={item.product.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{item.product.name}</h4>
                      
                      {/* Format modifiers to string */}
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {item.product.modifiers?.map(mod => {
                          const optId = item.selections[mod.id];
                          const opt = mod.options.find(o => o.id === optId);
                          return opt ? opt.name : null;
                        }).filter(Boolean).join(', ')}
                        {item.note && ` · "${item.note}"`}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-800 text-sm">{formatRupiah(item.uiPrice)}</span>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-2 py-1 border border-gray-200">
                            <button onClick={() => onUpdateQty(item.cartItemId, item.qty - 1)} className="text-gray-500" disabled={item.qty <= 1}>
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-semibold text-sm w-4 text-center">{item.qty}</span>
                            <button onClick={() => onUpdateQty(item.cartItemId, item.qty + 1)} className="text-red-600">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button onClick={() => onRemove(item.cartItemId)} className="text-gray-400 hover:text-red-600 p-1">
                             <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50 mt-4 rounded-t-2xl">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>Biaya Layanan</span>
                  <span>{formatRupiah(serviceFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-lg pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-red-600">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <button onClick={() => { onClose(); onCheckout(); }} className="w-full bg-red-600 text-white rounded-xl py-3.5 font-bold shadow-lg">
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CheckoutView = ({ cart, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', note: '' });
  const [errors, setErrors] = useState({});

  const subtotal = cart.reduce((sum, item) => sum + (item.uiPrice * item.qty), 0);
  const serviceFee = 2000;
  const total = subtotal + serviceFee;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.length < 2) newErrors.name = "Nama wajib diisi (min. 2 karakter)";
    if (!formData.phone.trim() || formData.phone.length < 9) newErrors.phone = "Nomor WhatsApp aktif wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData, total);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="font-bold text-lg text-gray-800">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Outlet Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Pickup Outlet</p>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">{STORE_INFO.outlet.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{STORE_INFO.outlet.address}</p>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Data Customer</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <input 
              type="text" 
              placeholder="Contoh: Hafiz Rahman"
              className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500 focus:border-red-500'}`}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp *</label>
            <input 
              type="tel" 
              placeholder="Contoh: 081234567890"
              className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500 focus:border-red-500'}`}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Nomor ini digunakan untuk update status pesanan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Pesanan <span className="text-gray-400 font-normal">(Opsional)</span></label>
            <textarea 
              rows="2"
              placeholder="Contoh: Kurangi es nya ya"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              value={formData.note}
              onChange={e => setFormData({...formData, note: e.target.value})}
            />
          </div>
        </div>

        {/* Order Summary Summary (Compact) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
           <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Ringkasan Pesanan</p>
           <div className="space-y-2 mb-4">
             {cart.map(item => (
               <div key={item.cartItemId} className="flex justify-between text-sm">
                 <span className="text-gray-700"><span className="font-medium">{item.qty}x</span> {item.product.name}</span>
                 <span className="text-gray-800 font-medium">{formatRupiah(item.uiPrice * item.qty)}</span>
               </div>
             ))}
           </div>
           
           <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Biaya Layanan</span>
                <span>{formatRupiah(serviceFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 pt-1">
                <span>Total</span>
                <span className="text-red-600">{formatRupiah(total)}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100">
        <p className="text-[11px] text-gray-500 text-center mb-3">Dengan lanjut bayar, pesanan akan dibuat untuk pickup di outlet ini.</p>
        <button onClick={handleSubmit} className="w-full bg-red-600 text-white rounded-xl py-3.5 font-bold shadow-lg flex justify-between px-6 items-center">
          <span>Lanjut Bayar</span>
          <span>{formatRupiah(total)} <ChevronRight className="inline w-4 h-4 ml-1"/></span>
        </button>
      </div>
    </div>
  );
};

const PaymentPendingView = ({ orderData, onSimulatePaymentSuccess }) => {
  // Simple mock countdown
  const [timeLeft, setTimeLeft] = useState(23 * 60 + 59); 

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 justify-center items-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-orange-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-1">Menunggu Pembayaran</h2>
        <p className="text-sm text-gray-500 mb-6">Selesaikan pembayaran dalam waktu:</p>

        <div className="text-4xl font-black text-gray-800 tracking-wider mb-6 flex items-center justify-center gap-2">
           <div className="bg-gray-100 px-3 py-2 rounded-lg">{mins}</div>
           <span className="text-gray-400">:</span>
           <div className="bg-gray-100 px-3 py-2 rounded-lg">{secs}</div>
        </div>

        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left">
          <p className="text-xs text-gray-500 mb-1">Order Number</p>
          <p className="font-semibold text-gray-800 mb-3">{orderData?.orderNumber || 'ST-MOCK-123'}</p>
          
          <p className="text-xs text-gray-500 mb-1">Total Pembayaran</p>
          <p className="font-bold text-xl text-red-600">{formatRupiah(orderData?.total || 0)}</p>
        </div>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Silakan selesaikan pembayaran sebelum waktu habis agar pesanan tidak dibatalkan.
        </p>

        <button 
          onClick={onSimulatePaymentSuccess}
          className="w-full bg-red-600 text-white rounded-xl py-3.5 font-bold mb-3 shadow-md"
        >
          Bayar Sekarang (Mock Simulator)
        </button>

        <button className="w-full bg-white text-gray-700 border border-gray-200 rounded-xl py-3.5 font-semibold">
          Cek Status Pembayaran
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <HelpCircle className="w-4 h-4" />
        <span>Butuh bantuan? <a href="#" className="text-green-600 font-medium">Hubungi via WhatsApp</a></span>
      </div>
    </div>
  );
};

const OrderStatusView = ({ orderData, onBackToMenu }) => {
  const statusSteps = [
    { id: 'PAID', label: 'Dibayar', done: true, time: '09:41' },
    { id: 'AWAITING', label: 'Diproses Outlet', done: true, time: '09:42' },
    { id: 'PREPARING', label: 'Sedang Dibuat', done: false, time: null },
    { id: 'READY', label: 'Siap Diambil', done: false, time: null },
    { id: 'COMPLETED', label: 'Selesai', done: false, time: null },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-24">
      <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={onBackToMenu} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6"/></button>
        <h1 className="font-bold text-lg text-gray-800">Detail Pesanan</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Header */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="font-bold text-gray-800 text-lg mb-1">Pembayaran Berhasil!</h2>
          <p className="text-sm text-gray-500">Terima kasih, pesanan kamu sudah kami terima.</p>
          
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div className="text-left">
              <p className="text-xs text-gray-500">Order Number</p>
              <p className="font-bold text-gray-800">{orderData?.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Queue</p>
              <p className="font-black text-xl text-red-600">#{orderData?.queueNumber}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Status Pesanan</h3>
           <div className="pl-2 space-y-5">
             {statusSteps.map((step, idx) => (
               <div key={step.id} className="relative flex items-start gap-4">
                 {/* Line */}
                 {idx < statusSteps.length - 1 && (
                   <div className={`absolute left-2 top-6 bottom-[-20px] w-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                 )}
                 {/* Dot */}
                 <div className={`relative z-10 w-4 h-4 rounded-full mt-1 ${step.done ? 'bg-green-500 border-2 border-white ring-2 ring-green-100' : 'bg-gray-200'}`}></div>
                 
                 <div className="flex-1">
                   <p className={`text-sm font-semibold ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                   {step.time && <p className="text-xs text-gray-500 mt-0.5">{step.time}</p>}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
             <p className="text-xs text-blue-800">Semua pesanan adalah untuk <b>PICKUP</b> di outlet. Tunjukkan halaman ini ke staff saat pesanan siap diambil.</p>
           </div>
        </div>

        {/* Customer & Outlet Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Data Customer</h3>
            <p className="text-sm font-medium text-gray-800">{orderData?.customer?.name}</p>
            <p className="text-sm text-gray-600">{maskPhone(orderData?.customer?.phone)}</p>
          </div>
          <div className="h-px bg-gray-100"></div>
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Pickup Outlet</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-800">{STORE_INFO.outlet.name}</p>
                <p className="text-xs text-gray-500">{STORE_INFO.outlet.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4" /> Invoice PDF
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
            <Share2 className="w-4 h-4" /> Bagikan Status
          </button>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100">
        <button onClick={onBackToMenu} className="w-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-xl py-3.5 font-bold">
          Kembali ke Menu
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('storefront'); // 'storefront' | 'checkout' | 'payment' | 'status'
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // Derived state
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.uiPrice * item.qty), 0);

  // Handlers
  const handleAddToCart = (item) => {
    // Basic implementation: adds new line item instead of merging same variants to keep logic simple for MVP
    setCart(prev => [...prev, item]);
  };

  const handleUpdateCartQty = (cartItemId, newQty) => {
    setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, qty: newQty } : item));
  };

  const handleRemoveCartItem = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    if (cart.length === 1) setIsCartOpen(false); // Close if last item removed
  };

  const handleCheckoutSubmit = (customerData, computedTotal) => {
    // Generate mock order data based on input
    const newOrder = {
      orderNumber: `ST-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(1000+Math.random()*9000)}`,
      queueNumber: Math.floor(Math.random() * 50) + 1,
      total: computedTotal,
      customer: customerData,
      items: [...cart]
    };
    setOrderData(newOrder);
    setView('payment');
  };

  const handlePaymentSuccess = () => {
    setView('status');
    setCart([]); // Clear cart after payment
  };

  // Render logic based on 'view' state to mimic routing in a single file
  return (
    <div className="w-full min-h-screen bg-gray-900 flex justify-center font-sans selection:bg-red-200">
      {/* Mobile Frame Simulator for Desktop preview */}
      <div className="w-full max-w-md bg-white h-screen overflow-hidden relative shadow-2xl sm:rounded-none md:rounded-[2.5rem] md:h-[90vh] md:my-auto md:border-8 border-gray-800">
        
        {view === 'storefront' && (
          <StorefrontPage 
            onProductClick={setSelectedProduct} 
            cartCount={cartCount}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}
        
        {view === 'checkout' && (
          <CheckoutView 
            cart={cart} 
            onBack={() => setView('storefront')} 
            onSubmit={handleCheckoutSubmit}
          />
        )}

        {view === 'payment' && (
          <PaymentPendingView 
            orderData={orderData} 
            onSimulatePaymentSuccess={handlePaymentSuccess} 
          />
        )}

        {view === 'status' && (
          <OrderStatusView 
            orderData={orderData} 
            onBackToMenu={() => {
              setView('storefront');
              setOrderData(null);
            }} 
          />
        )}

        {/* Overlays (Sheet & Drawer) */}
        {selectedProduct && (
          <ProductSheet 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            onAddToCart={handleAddToCart}
          />
        )}

        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart}
          onUpdateQty={handleUpdateCartQty}
          onRemove={handleRemoveCartItem}
          onCheckout={() => setView('checkout')}
        />

      </div>
      
      {/* Global Styles for Animations & Scrollbar hiding within the container */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}