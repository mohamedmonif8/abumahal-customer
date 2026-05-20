import { useState, useEffect, useCallback } from 'react';

function App() {
  // 1. الحفظ: استرجاع البيانات من localStorage عند بدء التطبيق
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart')) || []);
  const [selectedBranch, setSelectedBranch] = useState(() => localStorage.getItem('selectedBranch') || '');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  
  const [view, setView] = useState('home'); // home, menu, cart, orders
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل للأداء

  const API_URL = 'https://abumahal-backend.onrender.com';
  const colors = { primary: '#8b0000', bg: '#f9f9f9', card: '#ffffff', success: '#27ae60' };

  // تحديث localStorage عند تغير البيانات
  useEffect(( ) => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('selectedBranch', selectedBranch);
  }, [selectedBranch]);

  const showToast = useCallback((msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  // 2. الأداء: جلب البيانات بشكل متوازي لتسريع التحميل
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
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const data = await res.json();
      
      if (data.error) return showToast(data.error);
      setUser(data); 
      showToast(`أهلاً بك يا ${data.name}`);
    } catch (error) {
      showToast("خطأ في الاتصال");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setSelectedBranch('');
    setView('home');
  };

  const addToCart = (product) => {
    if (!product.isAvailable) return showToast("عذراً، نفدت الكمية!");
    setCart(prev => [...prev, product]); 
    showToast("تمت الإضافة للسلة 🛒");
  };

  const placeOrder = async () => {
    if (!selectedBranch) return showToast("الرجاء اختيار الفرع أولاً!");
    if (cart.length === 0) return showToast("السلة فارغة!");
    
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const orderData = { 
      userId: user.id, 
      customerName: user.name, 
      orderType: 'استلام من الفرع', 
      branch: selectedBranch, 
      totalPrice, 
      items: cart, 
      paymentStatus: 'غير مدفوع' 
    };
    
    try {
      await fetch(`${API_URL}/api/orders`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(orderData) 
      });
      setCart([]); 
      setView('orders'); 
      showToast("تم إرسال طلبك بنجاح! 🎉");
    } catch (error) {
      showToast("حدث خطأ أثناء إرسال الطلب");
    }
  };

  // 3. السلاسة: أنماط CSS مدمجة للحركات والانتقالات
  const styles = {
    fadeIn: { animation: 'fadeIn 0.4s ease-in-out' },
    button: { transition: 'all 0.2s ease', cursor: 'pointer' },
    toast: {
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#333', color: 'white', padding: '15px 25px', borderRadius: '30px',
      zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideDown 0.3s ease-out'
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: colors.bg }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }
        `}</style>
        
        {toast && <div style={styles.toast}>{toast}</div>}
        
        <div style={{ ...styles.fadeIn, backgroundColor: colors.card, padding: '40px 30px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: colors.primary, marginBottom: '25px' }}>{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && <input placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }} />}
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }} />
            <button type="submit" style={{ ...styles.button, padding: '15px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>
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

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: colors.primary, fontSize: '20px' }}>جاري التحميل...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', direction: 'rtl', backgroundColor: colors.bg, fontFamily: 'sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }
        .nav-btn:hover { transform: translateY(-2px); }
        .nav-btn:active { transform: translateY(0); }
      `}</style>

      {toast && <div style={styles.toast}>{toast}</div>}
      
      <div style={{ backgroundColor: colors.primary, color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 20px 20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0 }}>مطعم أبو مهل</h2>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>خروج</button>
      </div>

      <div style={{ padding: '20px', ...styles.fadeIn }} key={view}>
        {view === 'home' && (
          <div>
            <h3 style={{ color: colors.primary, marginBottom: '20px' }}>اختر الفرع الأقرب لك:</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {branches.map(b => (
                <button key={b.id} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} 
                  style={{ ...styles.button, padding: '20px', backgroundColor: colors.card, border: selectedBranch === b.name ? `2px solid ${colors.primary}` : '1px solid #eee', borderRadius: '15px', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📍 {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: colors.primary, margin: 0 }}>المنيو</h3>
              {selectedBranch && <span style={{ background: '#eee', padding: '5px 10px', borderRadius: '20px', fontSize: '14px' }}>فرع {selectedBranch}</span>}
            </div>
            
            {categories.map(c => (
              <div key={c.id} style={{ marginBottom: '25px' }}>
                <h4 style={{ backgroundColor: 'white', padding: '12px 15px', borderRadius: '10px', borderRight: `4px solid ${colors.primary}`, boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>{c.name}</h4>
                <div style={{ display: 'grid', gap: '12px', marginTop: '10px' }}>
                  {products.filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: '15px', borderRadius: '12px', opacity: p.isAvailable ? 1 : 0.6, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div>
                        <strong style={{ textDecoration: p.isAvailable ? 'none' : 'line-through', fontSize: '16px' }}>{p.name}</strong>
                        <div style={{ color: colors.primary, fontWeight: 'bold', marginTop: '5px' }}>{p.price} ريال</div>
                        {!p.isAvailable && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>نفدت الكمية</div>}
                      </div>
                      <button onClick={() => addToCart(p)} disabled={!p.isAvailable} 
                        style={{ ...styles.button, padding: '10px 20px', backgroundColor: p.isAvailable ? colors.primary : '#ccc', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px' }}>
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'cart' && (
          <div>
            <h3 style={{ color: colors.primary, marginBottom: '20px' }}>السلة 🛒</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</div>
                <p>سلتك فارغة حالياً</p>
                <button onClick={() => setView('menu')} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>تصفح المنيو</button>
              </div>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: colors.card, padding: '15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                    <span>{item.name}</span>
                    <strong style={{ color: colors.primary }}>{item.price} ريال</strong>
                  </div>
                ))}
                <div style={{ marginTop: '25px', padding: '20px', backgroundColor: colors.card, borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginBottom: '20px' }}>الإجمالي: <span style={{ color: colors.primary }}>{cart.reduce((sum, item) => sum + item.price, 0)} ريال</span></h3>
                  <button onClick={placeOrder} style={{ ...styles.button, width: '100%', padding: '15px', backgroundColor: colors.success, color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                    تأكيد الطلب
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'orders' && (
          <div>
            <h3 style={{ color: colors.primary, marginBottom: '20px' }}>طلباتي السابقة 🧾</h3>
            {myOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>لا توجد طلبات سابقة</p>
            ) : (
              myOrders.map(o => (
                <div key={o.id} style={{ backgroundColor: colors.card, padding: '15px', borderRadius: '12px', marginBottom: '15px', borderRight: `5px solid ${o.status === 'جاهز' ? colors.success : colors.primary}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>طلب #{o.id}</strong>
                    <span style={{ color: colors.primary, fontWeight: 'bold' }}>{o.totalPrice} ريال</span>
                  </div>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>الفرع: {o.branch}</p>
                  <div style={{ padding: '8px', backgroundColor: o.status === 'جاهز' ? '#e8f8f5' : '#fef5e7', color: o.status === 'جاهز' ? colors.success : '#d35400', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    {o.status}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', display: 'flex', justifyContent: 'space-around', padding: '12px 5px', boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', zIndex: 100 }}>
        {[
          { id: 'home', icon: '12112', label: 'الفروع' },
          { id: 'menu', icon: '🍔', label: 'المنيو' },
          { id: 'cart', icon: '🛒', label: `السلة ${cart.length > 0 ? `(${cart.length})` : ''}` },
          { id: 'orders', icon: '🧾', label: 'طلباتي' }
        ].map(tab => (
          <button key={tab.id} className="nav-btn" onClick={() => setView(tab.id)} 
            style={{ ...styles.button, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', color: view === tab.id ? colors.primary : '#999', fontWeight: view === tab.id ? 'bold' : 'normal' }}>
            <span style={{ fontSize: '20px', filter: view === tab.id ? 'none' : 'grayscale(100%)' }}>{tab.icon}</span>
            <span style={{ fontSize: '12px' }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default App;
