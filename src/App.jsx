import { useState, useEffect, useCallback } from 'react';

function App() {
  // --- الحفظ والاسترجاع ---
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [selectedBranch, setSelectedBranch] = useState(() => localStorage.getItem('selectedBranch') || '');
  
  // --- حالات التطبيق ---
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // ميزة البحث
  
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  
  const [view, setView] = useState('home');
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'https://abumahal-backend.onrender.com';
  
  // ألوان مستوحاة من الشعار
  const colors = { 
    primary: '#e31837', // أحمر الشعار
    dark: '#000000',    // أسود الشعار
    bg: '#f4f6f8', 
    card: '#ffffff', 
    success: '#27ae60',
    text: '#333'
  };

  // ⚠️ ضع مسار صورة الشعار هنا (مثلاً إذا كانت في مجلد public )
  const LOGO_URL = '/logo.jpg'; 

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedBranch', selectedBranch);
  }, [user, cart, selectedBranch]);

  const showToast = useCallback((msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [branchesRes, categoriesRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/api/branches`).then(res => res.json()),
          fetch(`${API_URL}/api/categories`).then(res => res.json()),
          fetch(`${API_URL}/api/products`).then(res => res.json())
        ]);
        if(Array.isArray(branchesRes)) setBranches(branchesRes);
        if(Array.isArray(categoriesRes)) setCategories(categoriesRes);
        if(Array.isArray(productsRes)) setProducts(productsRes);
      } catch (error) {
        showToast("حدث خطأ أثناء جلب البيانات");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  useEffect(() => {
    if (user && view === 'orders') {
      fetch(`${API_URL}/api/orders`)
        .then(res => res.json())
        .then(data => {
          if(Array.isArray(data)) setMyOrders(data.filter(o => o.userId === user.id).reverse());
        }).catch(()=>{});
    }
  }, [user, view]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering ? { name, phone, password, role: 'عميل' } : { phone, password };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) 
      });
      const data = await res.json();
      if (data.error) return showToast(data.error);
      setUser(data); showToast(`أهلاً بك يا ${data.name}`);
    } catch (error) {
      showToast("خطأ في الاتصال");
    }
  };

  // --- ميزة إدارة السلة المتقدمة ---
  const updateCartQuantity = (product, change) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + change;
        if (newQuantity <= 0) return prevCart.filter(item => item.id !== product.id); // حذف إذا وصلت 0
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
      }
      if (change > 0) {
        showToast("تمت الإضافة للسلة 🛒");
        return [...prevCart, { ...product, quantity: 1 }];
      }
      return prevCart;
    });
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (!selectedBranch) return showToast("الرجاء اختيار الفرع أولاً!");
    if (cart.length === 0) return showToast("السلة فارغة!");
    
    const orderData = { 
      userId: user.id, customerName: user.name, orderType: 'استلام من الفرع', 
      branch: selectedBranch, totalPrice: getCartTotal(), items: cart, paymentStatus: 'غير مدفوع' 
    };
    
    try {
      await fetch(`${API_URL}/api/orders`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) 
      });
      setCart([]); setView('orders'); showToast("تم إرسال طلبك بنجاح! 🎉");
    } catch (error) {
      showToast("حدث خطأ أثناء إرسال الطلب");
    }
  };

  const styles = {
    input: { padding: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', width: '100%', boxSizing: 'border-box' },
    btn: { padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    card: { backgroundColor: colors.card, padding: '15px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '15px' }
  };

  // --- شاشة تسجيل الدخول ---
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: colors.dark }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: colors.primary, color: 'white', padding: '15px 25px', borderRadius: '30px', zIndex: 1000 }}>{toast}</div>}
        
        <div style={{ backgroundColor: colors.card, padding: '40px 30px', borderRadius: '25px', textAlign: 'center', width: '90%', maxWidth: '400px' }}>
          {/* الشعار في شاشة الدخول */}
          <img src={LOGO_URL} alt="أبو مهل" style={{ width: '150px', marginBottom: '20px', borderRadius: '50%' }} />
          
          <h2 style={{ color: colors.dark, marginBottom: '25px' }}>{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && <input placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={styles.input} />}
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
            <button type="submit" style={{ ...styles.btn, backgroundColor: colors.primary, color: 'white', fontSize: '16px' }}>
              {isRegistering ? 'تسجيل' : 'دخول'}
            </button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#666', cursor: 'pointer', marginTop: '20px', fontSize: '14px' }}>
            {isRegistering ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
            <span style={{ color: colors.primary, fontWeight: 'bold' }}>{isRegistering ? 'سجل دخول' : 'سجل الآن'}</span>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark, color: 'white', fontSize: '20px' }}>جاري التحميل...</div>;

  // --- التطبيق الرئيسي ---
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', direction: 'rtl', backgroundColor: colors.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: colors.dark, color: 'white', padding: '15px 25px', borderRadius: '30px', zIndex: 1000 }}>{toast}</div>}
      
      {/* الترويسة العلوية بالشعار */}
      <div style={{ backgroundColor: colors.dark, color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 25px 25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={LOGO_URL} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${colors.primary}` }} />
          <h3 style={{ margin: 0 }}>أبو مهل</h3>
        </div>
        <button onClick={() => { setUser(null); setCart([]); }} style={{ background: colors.primary, border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>خروج</button>
      </div>

      <div style={{ padding: '20px' }}>
        {view === 'home' && (
          <div>
            <h3 style={{ color: colors.dark, marginBottom: '20px' }}>اختر الفرع الأقرب لك:</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {branches.map(b => (
                <button key={b.id} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} 
                  style={{ ...styles.card, border: selectedBranch === b.name ? `2px solid ${colors.primary}` : 'none', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: '100%', textAlign: 'right' }}>
                  📍 {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div>
            {/* شريط البحث */}
            <input type="text" placeholder="🔍 ابحث عن وجبتك المفضلة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...styles.input, marginBottom: '20px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }} />
            
            {categories.map(c => {
              const categoryProducts = products.filter(p => p.categoryId === c.id && p.name.includes(searchQuery));
              if (categoryProducts.length === 0) return null;

              return (
                <div key={c.id} style={{ marginBottom: '25px' }}>
                  <h4 style={{ backgroundColor: colors.dark, color: 'white', padding: '10px 15px', borderRadius: '10px', display: 'inline-block', marginBottom: '15px' }}>{c.name}</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {categoryProducts.map(p => {
                      const cartItem = cart.find(item => item.id === p.id);
                      return (
                        <div key={p.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: p.isAvailable ? 1 : 0.6 }}>
                          <div>
                            <strong style={{ fontSize: '16px' }}>{p.name}</strong>
                            <div style={{ color: colors.primary, fontWeight: 'bold', marginTop: '5px' }}>{p.price} ريال</div>
                          </div>
                          
                          {/* أزرار التحكم بالكمية */}
                          {cartItem ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0f0f0', borderRadius: '10px', padding: '5px' }}>
                              <button onClick={() => updateCartQuantity(p, 1)} style={{ border: 'none', background: colors.primary, color: 'white', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>+</button>
                              <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{cartItem.quantity}</span>
                              <button onClick={() => updateCartQuantity(p, -1)} style={{ border: 'none', background: colors.dark, color: 'white', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>-</button>
                            </div>
                          ) : (
                            <button onClick={() => updateCartQuantity(p, 1)} disabled={!p.isAvailable} 
                              style={{ ...styles.btn, padding: '10px 20px', backgroundColor: p.isAvailable ? colors.dark : '#ccc', color: 'white' }}>
                              إضافة
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'cart' && (
          <div>
            <h3 style={{ color: colors.dark, marginBottom: '20px' }}>السلة 🛒</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🛒</div>
                <p>سلتك فارغة حالياً</p>
              </div>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ color: colors.primary, fontSize: '14px' }}>{item.price} ريال</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button onClick={() => updateCartQuantity(item, 1)} style={{ border: 'none', background: '#eee', padding: '5px 10px', borderRadius: '5px' }}>+</button>
                      <strong>{item.quantity}</strong>
                      <button onClick={() => updateCartQuantity(item, -1)} style={{ border: 'none', background: '#eee', padding: '5px 10px', borderRadius: '5px' }}>-</button>
                    </div>
                  </div>
                ))}
                <div style={{ ...styles.card, marginTop: '20px', textAlign: 'center', border: `2px solid ${colors.primary}` }}>
                  <h3 style={{ marginBottom: '15px' }}>الإجمالي: <span style={{ color: colors.primary }}>{getCartTotal()} ريال</span></h3>
                  <button onClick={placeOrder} style={{ ...styles.btn, width: '100%', backgroundColor: colors.success, color: 'white', fontSize: '18px' }}>تأكيد الطلب</button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'orders' && (
          <div>
            <h3 style={{ color: colors.dark, marginBottom: '20px' }}>طلباتي السابقة 🧾</h3>
            {myOrders.map(o => (
              <div key={o.id} style={{ ...styles.card, borderRight: `5px solid ${o.status === 'جاهز' ? colors.success : colors.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>طلب #{o.id}</strong>
                  <span style={{ color: colors.primary, fontWeight: 'bold' }}>{o.totalPrice} ريال</span>
                </div>
                
                {/* شريط تتبع حالة الطلب */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '12px', color: '#666', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', left: '10%', right: '10%', height: '2px', background: '#eee', zIndex: 0 }}></div>
                  {['قيد المراجعة', 'قيد التجهيز', 'جاهز'].map((step, index) => {
                    const isActive = o.status === step || (o.status === 'جاهز') || (o.status === 'قيد التجهيز' && index === 0);
                    return (
                      <div key={step} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isActive ? colors.success : '#ddd', border: '2px solid white' }}></div>
                        <span style={{ color: isActive ? colors.dark : '#999', fontWeight: isActive ? 'bold' : 'normal' }}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', display: 'flex', justifyContent: 'space-around', padding: '12px 5px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 100 }}>
        {[
          { id: 'home', icon: '📍', label: 'الفروع' },
          { id: 'menu', icon: '🍔', label: 'المنيو' },
          { id: 'cart', icon: '🛒', label: `السلة`, badge: getCartCount() },
          { id: 'orders', icon: '🧾', label: 'طلباتي' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} 
            style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: view === tab.id ? colors.primary : '#999', cursor: 'pointer', position: 'relative' }}>
            <span style={{ fontSize: '22px', filter: view === tab.id ? 'none' : 'grayscale(100%)' }}>{tab.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: view === tab.id ? 'bold' : 'normal' }}>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '10px', background: colors.primary, color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
export default App;
