import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronLeft,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Menu,
  X,
  AlertCircle,
  FileText,
  Share2,
  Download,
  ArrowRight,
  Check,
  Phone,
  Coffee,
  ShoppingBag,
  Receipt
} from 'lucide-react';

const MOCK_STOREFRONT = {
  id: 'store_123',
  name: 'SelaluTeh',
  brandName: 'SelaluTeh',
  outlet: {
    id: 'outlet_01',
    name: 'SELKOP-01 JEND SUTOYO',
    address: 'Jl. Jend. Sutoyo No.1, Surabaya'
  },
  banner: {
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800&h=400',
    title: 'Aren Creamy Combo',
    subtitle: 'Mulai dari Rp25.000'
  }
};

const MOCK_CATEGORIES = [
  { id: 'cat_1', name: 'Bundling' },
  { id: 'cat_2', name: 'Coffee' },
  { id: 'cat_3', name: 'Tea' },
  { id: 'cat_4', name: 'Non Coffee' },
  { id: 'cat_5', name: 'Snack' }
];

const MOCK_PRODUCTS = [
  {
    id: 'prod_1',
    categoryId: 'cat_1',
    name: 'Combo Bread (Aren Creamy)',
    description: 'Roti lembut dengan isian cokelat lumer dipadukan Aren Creamy SelaluTeh.',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80',
    status: 'AVAILABLE',
    modifiers: [
      {
        id: 'mod_group_1',
        name: 'Pilih Ukuran',
        required: true,
        type: 'SINGLE',
        options: [
          { id: 'opt_1', name: 'Regular', price: 0 },
          { id: 'opt_2', name: 'Large', price: 3000 }
        ]
      },
      {
        id: 'mod_group_2',
        name: 'Sugar Level',
        required: false,
        type: 'SINGLE',
        options: [
          { id: 'opt_3', name: 'Normal', price: 0 },
          { id: 'opt_4', name: 'Less Sugar', price: 0 },
          { id: 'opt_5', name: 'No Sugar', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod_2',
    categoryId: 'cat_2',
    name: 'Iced Coffee Aren Creamy',
    description: 'Kopi susu dengan gula aren asli yang creamy dan menyegarkan.',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
    status: 'AVAILABLE',
    modifiers: [
      {
        id: 'mod_group_3',
        name: 'Ice Level',
        required: false,
        type: 'SINGLE',
        options: [
          { id: 'opt_6', name: 'Normal Ice', price: 0 },
          { id: 'opt_7', name: 'Less Ice', price: 0 },
          { id: 'opt_8', name: 'No Ice', price: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod_3',
    categoryId: 'cat_5',
    name: 'Roti Bakar Kaya Original',
    description: 'Roti bakar renyah dengan selai srikaya buatan sendiri.',
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
    status: 'AVAILABLE',
    modifiers: []
  },
  {
    id: 'prod_4',
    categoryId: 'cat_2',
    name: 'Caramel Macchiato',
    description: 'Espresso dengan susu dan sirup karamel premium.',
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&q=80',
    status: 'SOLD_OUT',
    modifiers: []
  }
];

// --- UTILS ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// --- COMPONENTS ---
const Header = ({ title, showBack, onBack, rightElement }) => (
  <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm h-14">
    <div className="flex items-center justify-between px-4 h-full max-w-md mx-auto">
      {showBack ? (
        <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
          <ChevronLeft size={24} />
        </button>
      ) : (
        <button className="p-2 -ml-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
          <Menu size={24} />
        </button>
      )}
      
      {title ? (
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center truncate px-2">{title}</h1>
      ) : (
        <div className="flex-1 flex justify-center items-center gap-2">
          <div className="w-7 h-7 rounded bg-rose-600 flex items-center justify-center text-white font-bold text-lg leading-none">
            S
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight text-rose-600">SelaluTeh</span>
        </div>
      )}

      <div className="w-10 flex justify-end">
        {rightElement}
      </div>
    </div>
  </header>
);

const ProductCard = ({ product, onAddClick }) => {
  const isSoldOut = product.status === 'SOLD_OUT';
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col active:scale-[0.98] transition-transform">
      <div className="relative aspect-square bg-gray-100">
        <img src={product.imageUrl} alt={product.name} className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-60' : ''}`} loading="lazy" />
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">SOLD OUT</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</h3>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-rose-600 text-sm">{formatCurrency(product.price)}</span>
          <button 
            onClick={() => !isSoldOut && onAddClick(product)}
            disabled={isSoldOut}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isSoldOut ? 'bg-gray-100 text-gray-400' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductDetailSheet = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedModifiers({});
      setNote('');
      setErrors({});
    }
  }, [isOpen, product]);

  if (!product || !isOpen) return null;

  const calculateTotal = () => {
    let total = product.price;
    Object.values(selectedModifiers).forEach(opt => {
      if (opt && opt.price) total += opt.price;
    });
    return total * quantity;
  };

  const handleModifierSelect = (groupId, option) => {
    setSelectedModifiers(prev => ({ ...prev, [groupId]: option }));
    if (errors[groupId]) {
      setErrors(prev => ({ ...prev, [groupId]: null }));
    }
  };

  const handleAddToCart = () => {
    // Validate required modifiers
    const newErrors = {};
    let isValid = true;
    product.modifiers.forEach(group => {
      if (group.required && !selectedModifiers[group.id]) {
        newErrors[group.id] = 'Wajib dipilih';
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    onAddToCart({
      productId: product.id,
      product: product,
      quantity,
      selectedModifiers: Object.values(selectedModifiers),
      note,
      totalPrice: calculateTotal()
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] flex flex-col max-w-md mx-auto transform transition-transform duration-300">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>
        
        <div className="overflow-y-auto flex-1 pb-24">
          <div className="px-4 pb-4">
            <img src={product.imageUrl} alt={product.name} className="w-full aspect-[4/3] object-cover rounded-2xl bg-gray-100" />
            <div className="mt-4">
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-rose-600 font-bold text-lg mt-1">{formatCurrency(product.price)}</p>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">{product.description}</p>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-50" />

          {product.modifiers.map(group => (
            <div key={group.id} className="p-4 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{group.name}</h3>
                {group.required ? (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">WAJIB</span>
                ) : (
                  <span className="text-gray-400 text-xs">Opsional</span>
                )}
              </div>
              
              <div className="space-y-3">
                {group.options.map(option => (
                  <label key={option.id} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedModifiers[group.id]?.id === option.id ? 'border-rose-600' : 'border-gray-300'}`}>
                        {selectedModifiers[group.id]?.id === option.id && <div className="w-2.5 h-2.5 bg-rose-600 rounded-full" />}
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{option.name}</span>
                    </div>
                    {option.price > 0 && <span className="text-gray-500 text-sm">+ {formatCurrency(option.price)}</span>}
                    <input 
                      type="radio" 
                      name={group.id} 
                      className="hidden" 
                      onChange={() => handleModifierSelect(group.id, option)}
                      checked={selectedModifiers[group.id]?.id === option.id}
                    />
                  </label>
                ))}
              </div>
              {errors[group.id] && <p className="text-rose-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {errors[group.id]}</p>}
            </div>
          ))}

          <div className="w-full h-2 bg-gray-50" />

          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-2">Catatan Opsional</h3>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              placeholder="Contoh: jangan terlalu manis, es dipisah"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Jumlah</h3>
            <div className="flex items-center gap-4 bg-gray-50 rounded-full p-1 border border-gray-100">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <Minus size={18} />
              </button>
              <span className="font-bold w-4 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-8 h-8 flex items-center justify-center text-rose-600 hover:bg-white rounded-full transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button 
            onClick={handleAddToCart}
            className="w-full bg-rose-600 text-white font-bold text-base py-3.5 rounded-full flex items-center justify-between px-6 hover:bg-rose-700 active:scale-[0.98] transition-all"
          >
            <span>Tambah ke Keranjang</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </button>
        </div>
      </div>
    </>
  );
};

// --- MAIN VIEWS ---

const StorefrontView = ({ onNavigate, cart }) => {
  const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0].id);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        rightElement={
          <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
            <Search size={20} />
          </button>
        }
      />
      
      <main className="max-w-md mx-auto bg-white min-h-screen pb-24 shadow-sm">
        
        {/* DROPDOWN OUTLET (PILL STYLE) */}
        <div className="pt-4 px-4 pb-3">
          <button className="w-full flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 hover:bg-gray-50 transition-colors active:scale-[0.99]">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-rose-600" />
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-[10px] text-gray-500 font-bold leading-none uppercase tracking-wider mb-1">Pickup di outlet</span>
              <span className="text-sm font-bold text-gray-900 leading-tight truncate w-full text-left">
                {MOCK_STOREFRONT.outlet.name}
              </span>
            </div>
            <ChevronDown size={18} className="text-gray-400 shrink-0" />
          </button>
        </div>

        {/* Hero Banner */}
        <div className="px-4 pb-4">
          <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-200">
            <img src={MOCK_STOREFRONT.banner.imageUrl} alt="Promo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
              <h2 className="text-white font-bold text-xl leading-tight">{MOCK_STOREFRONT.banner.title}</h2>
              <p className="text-rose-200 text-sm font-medium mt-1">{MOCK_STOREFRONT.banner.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Categories (Sticky) */}
        <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
          <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2">
            {MOCK_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                  selectedCategory === cat.id 
                    ? 'bg-rose-600 border-rose-600 text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-4">
          <h2 className="font-bold text-lg text-gray-900 mb-4">{MOCK_CATEGORIES.find(c => c.id === selectedCategory)?.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_PRODUCTS.filter(p => p.categoryId === selectedCategory).map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddClick={setSelectedProduct} 
              />
            ))}
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button 
              onClick={() => onNavigate('CART')}
              className="w-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-bold text-base py-3.5 rounded-full flex items-center justify-between px-5 hover:bg-rose-700 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1.5 -right-2 bg-white text-rose-600 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </div>
                <span className="text-sm border-l border-rose-400/50 pl-3">{formatCurrency(cartTotal)}</span>
              </div>
              <span className="text-sm">Lihat Keranjang</span>
            </button>
          </div>
        </div>
      )}

      <ProductDetailSheet 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => {
          cart.addItem(item);
        }}
      />
    </div>
  );
};

const CartView = ({ onNavigate, cart }) => {
  const cartSubtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const serviceFee = 2000;
  const cartTotal = cartSubtotal + serviceFee;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Keranjang" showBack onBack={() => onNavigate('STOREFRONT')} />
      
      <main className="flex-1 max-w-md w-full mx-auto bg-white pb-32">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-6">
              <ShoppingCart size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Keranjang masih kosong</h2>
            <p className="text-gray-500 mb-8">Yuk pilih menu favoritmu dulu 🍵</p>
            <button 
              onClick={() => onNavigate('STOREFRONT')}
              className="bg-rose-600 text-white font-bold py-3 px-8 rounded-full shadow-md active:scale-95 transition-transform"
            >
              Mulai Pilih Menu
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 bg-rose-50/50">
              <div className="flex items-center gap-3 text-rose-700">
                <MapPin size={18} className="shrink-0" />
                <div className="text-sm">
                  <span className="opacity-80">Pickup di: </span>
                  <span className="font-bold">{MOCK_STOREFRONT.outlet.name}</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {cart.items.map((item, index) => (
                <div key={index} className="p-4 flex gap-3">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.product.name}</h4>
                    {item.selectedModifiers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {item.selectedModifiers.map(m => m.name).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-gray-400 mt-0.5 italic truncate">Note: {item.note}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-sm text-gray-900">{formatCurrency(item.totalPrice)}</span>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                        <button 
                          onClick={() => cart.updateQuantity(index, -1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-white rounded-full transition-colors shadow-sm"
                        >
                          {item.quantity === 1 ? <Trash2 size={14} className="text-rose-500" /> : <Minus size={14} />}
                        </button>
                        <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => cart.updateQuantity(index, 1)}
                          className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-white rounded-full transition-colors shadow-sm bg-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-full h-2 bg-gray-50" />
            
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Ringkasan Pembayaran</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Biaya Layanan</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span className="text-rose-600">{formatCurrency(cartTotal)}</span>
              </div>
            </div>
          </>
        )}
      </main>

      {cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto">
            <button 
              onClick={() => onNavigate('CHECKOUT')}
              className="w-full bg-rose-600 text-white font-bold text-base py-3.5 rounded-full hover:bg-rose-700 active:scale-[0.98] transition-all"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckoutView = ({ onNavigate, cart, checkoutData, setCheckoutData }) => {
  const [name, setName] = useState(checkoutData.name || '');
  const [phone, setPhone] = useState(checkoutData.phone || '');
  const [orderNote, setOrderNote] = useState(checkoutData.orderNote || '');
  const [errors, setErrors] = useState({});

  const cartSubtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const serviceFee = 2000;
  const total = cartSubtotal + serviceFee;

  const handlePay = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor WhatsApp wajib diisi';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCheckoutData({ name, phone, orderNote, total });
    onNavigate('PAYMENT');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Checkout" showBack onBack={() => onNavigate('CART')} />
      
      <main className="flex-1 max-w-md w-full mx-auto pb-32">
        <div className="bg-white mb-2 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pickup Outlet</h3>
          <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <MapPin size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">{MOCK_STOREFRONT.outlet.name}</p>
              <p className="text-gray-500 text-xs mt-1">{MOCK_STOREFRONT.outlet.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white mb-2 p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Data Customer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama"
                className={`w-full border ${errors.name ? 'border-rose-500 focus:ring-rose-200' : 'border-gray-300 focus:ring-rose-500/20 focus:border-rose-500'} rounded-xl p-3 text-sm focus:outline-none focus:ring-2`}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor WhatsApp <span className="text-rose-500">*</span></label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className={`w-full border ${errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-gray-300 focus:ring-rose-500/20 focus:border-rose-500'} rounded-xl p-3 text-sm focus:outline-none focus:ring-2`}
              />
              {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
              <p className="text-gray-400 text-xs mt-1.5 flex items-center gap-1">
                <CheckCircle2 size={12} /> Nomor digunakan untuk update pesanan
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan Pesanan (opsional)</label>
              <textarea 
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Contoh: Titip di satpam ya"
                rows={2}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <div className="space-y-2 mb-4">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700"><span className="font-medium">{item.quantity}x</span> {item.product.name}</span>
                <span className="text-gray-900 font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Biaya Layanan</span>
              <span>{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2">
              <span>Total</span>
              <span className="text-rose-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handlePay}
            className="w-full bg-rose-600 text-white font-bold text-base py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-rose-700 active:scale-[0.98] transition-all"
          >
            <span>Lanjut Bayar</span>
            <span className="w-1 h-1 bg-white/50 rounded-full mx-1" />
            <span>{formatCurrency(total)}</span>
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-2">Dengan lanjut bayar, pesanan akan dibuat untuk pickup.</p>
        </div>
      </div>
    </div>
  );
};

const PaymentPendingView = ({ onNavigate, checkoutData }) => {
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59); // 15 mins mock

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Simulate successful payment check after a delay when clicking check status
  const handleCheckStatus = () => {
    // In real app, calls API. Here we just redirect to success.
    onNavigate('STATUS');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Pembayaran" />
      
      <main className="flex-1 max-w-md w-full mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-6 relative">
          <Clock size={40} strokeWidth={1.5} />
          <div className="absolute top-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-orange-500 rounded-full animate-pulse" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h2>
        <p className="text-gray-500 text-sm mb-6">Selesaikan pembayaran dalam waktu:</p>
        
        <div className="text-4xl font-bold text-gray-900 font-mono tracking-widest mb-8">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div className="w-full bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">Order ID</span>
            <span className="font-bold text-gray-900 text-sm">#ST-250621-1023</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Total Tagihan</span>
            <span className="font-bold text-rose-600 text-base">{formatCurrency(checkoutData.total)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-8 max-w-[260px]">
          Silakan selesaikan pembayaran di gateway sebelum waktu habis agar pesanan diproses.
        </p>

        <div className="w-full space-y-3 mt-auto">
          <button 
            className="w-full bg-rose-600 text-white font-bold text-base py-3.5 rounded-full hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Bayar Sekarang (Simulasi)</span>
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={handleCheckStatus}
            className="w-full bg-white border border-rose-600 text-rose-600 font-bold text-base py-3.5 rounded-full hover:bg-rose-50 active:scale-[0.98] transition-all"
          >
            Cek Status Pembayaran
          </button>
        </div>

        <button className="flex items-center gap-2 text-gray-500 text-sm mt-8 hover:text-green-600 transition-colors">
          <Phone size={16} /> Butuh bantuan? Hubungi WhatsApp
        </button>
      </main>
    </div>
  );
};

const OrderStatusView = ({ onNavigate, cart, checkoutData, resetState }) => {
  const maskPhone = (phone) => {
    if (!phone) return '';
    return phone.substring(0, 4) + ' **** ' + phone.substring(phone.length - 4);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Detail Pesanan" rightElement={
        <button onClick={() => { resetState(); onNavigate('STOREFRONT'); }} className="p-2 text-gray-700">
          <X size={24} />
        </button>
      } />
      
      <main className="flex-1 max-w-md w-full mx-auto pb-8">
        {/* Success Header */}
        <div className="bg-white p-6 text-center border-b border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <Check size={32} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pembayaran Berhasil!</h2>
          <p className="text-gray-500 text-sm mb-6">Terima kasih, pesanan kamu sudah kami terima.</p>
          
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="bg-gray-50 rounded-xl p-3 flex-1 border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
              <p className="font-bold text-gray-900 text-sm">#ST-250621</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 flex-1 border border-rose-100">
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mb-1">Queue No</p>
              <p className="font-bold text-rose-600 text-lg leading-none">#12</p>
            </div>
          </div>
        </div>

        {/* Status Timeline (Horizontal Design matched to image) */}
        <div className="bg-white mt-2 p-6 border-y border-gray-100 overflow-hidden">
          <div className="relative flex justify-between items-start w-full z-10 pt-2 pb-2">
            
            {/* Connecting Lines Background */}
            <div className="absolute top-[36px] left-[15%] right-[15%] h-1 flex z-[-1]">
                 <div className="w-1/2 bg-gradient-to-r from-green-500 to-rose-500"></div>
                 <div className="w-1/2 bg-gradient-to-r from-rose-500 via-amber-400 to-gray-200"></div>
            </div>

            {/* Step 1: Sedang Diproses (Completed) */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full border-[1.5px] border-green-500 bg-white flex items-center justify-center">
                    <Coffee className="text-green-500" size={20} strokeWidth={2} />
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Check className="text-white" size={12} strokeWidth={3} />
                </div>
              </div>
              <p className="font-bold text-gray-900 text-[12px] text-center mb-1.5 leading-tight">Sedang Diproses</p>
              <span className="bg-green-50 text-green-700 text-[9px] font-bold px-3 py-0.5 rounded-full">Selesai</span>
            </div>

            {/* Step 2: Siap Diambil (Active) */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative mb-3">
                <div className="w-[68px] h-[68px] -mt-1.5 rounded-full bg-rose-50 flex items-center justify-center p-1 shadow-[0_0_20px_rgba(225,29,72,0.15)] relative z-10">
                  <div className="w-full h-full rounded-full border-[2px] border-rose-600 bg-white flex items-center justify-center">
                    <ShoppingBag className="text-rose-600" size={26} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center z-20">
                  <span className="text-white text-[11px] font-bold">2</span>
                </div>
              </div>
              <p className="font-bold text-rose-600 text-[13px] text-center mb-1 leading-tight">Siap Diambil</p>
              <p className="text-gray-500 text-[9px] text-center leading-tight max-w-[85px]">Pesananmu sudah siap untuk diambil ✨</p>
            </div>

            {/* Step 3: Selesai (Upcoming) */}
            <div className="flex flex-col items-center w-1/3">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full border-[1.5px] border-gray-300 bg-white flex items-center justify-center">
                    <Receipt className="text-gray-400" size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[11px] font-bold">3</span>
                </div>
              </div>
              <p className="font-bold text-gray-900 text-[12px] text-center mb-1.5 leading-tight">Selesai</p>
              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-3 py-0.5 rounded-full">Mendatang</span>
            </div>

          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-white mt-2 p-5 border-y border-gray-100 space-y-5">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pickup Outlet</h3>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 text-sm">{MOCK_STOREFRONT.outlet.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{MOCK_STOREFRONT.outlet.address}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Data Customer</h3>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-gray-900 text-sm">{checkoutData.name}</p>
              <p className="text-gray-500 text-sm">{maskPhone(checkoutData.phone)}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white mt-2 p-5 border-y border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ringkasan Pesanan</h3>
          <div className="space-y-2 mb-4">
            {cart.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700"><span className="font-medium">{item.quantity}x</span> {item.product.name}</span>
                <span className="text-gray-900 font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between font-bold text-base text-gray-900">
              <span>Total Pembayaran</span>
              <span className="text-rose-600">{formatCurrency(checkoutData.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-3 mt-2">
          <button className="w-full bg-rose-50 text-rose-600 font-bold text-sm py-3 rounded-full flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
            <Download size={16} /> Download Invoice (PDF)
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Share2 size={16} /> Bagikan Status
          </button>
        </div>
      </main>
    </div>
  );
};

// --- MAIN APP ENTRY ---
export default function App() {
  const [currentView, setCurrentView] = useState('STOREFRONT'); // STOREFRONT, CART, CHECKOUT, PAYMENT, STATUS
  const [cartItems, setCartItems] = useState([]);
  const [checkoutData, setCheckoutData] = useState({});

  // Cart operations
  const cart = {
    items: cartItems,
    addItem: (item) => {
      // In a real app, logic to merge same items goes here
      setCartItems(prev => [...prev, item]);
    },
    updateQuantity: (index, delta) => {
      setCartItems(prev => {
        const newItems = [...prev];
        const newQuantity = newItems[index].quantity + delta;
        if (newQuantity <= 0) {
          newItems.splice(index, 1);
        } else {
          newItems[index].quantity = newQuantity;
          // recalculate price based on unit price
          const unitPrice = newItems[index].totalPrice / (newItems[index].quantity - delta);
          newItems[index].totalPrice = unitPrice * newQuantity;
        }
        return newItems;
      });
    },
    clear: () => setCartItems([])
  };

  const resetState = () => {
    setCartItems([]);
    setCheckoutData({});
  };

  // Simple Router
  return (
    <div className="bg-gray-100 min-h-screen w-full selection:bg-rose-100 selection:text-rose-900">
      {currentView === 'STOREFRONT' && <StorefrontView onNavigate={setCurrentView} cart={cart} />}
      {currentView === 'CART' && <CartView onNavigate={setCurrentView} cart={cart} />}
      {currentView === 'CHECKOUT' && <CheckoutView onNavigate={setCurrentView} cart={cart} checkoutData={checkoutData} setCheckoutData={setCheckoutData} />}
      {currentView === 'PAYMENT' && <PaymentPendingView onNavigate={setCurrentView} checkoutData={checkoutData} />}
      {currentView === 'STATUS' && <OrderStatusView onNavigate={setCurrentView} cart={cart} checkoutData={checkoutData} resetState={resetState} />}
    </div>
  );
}