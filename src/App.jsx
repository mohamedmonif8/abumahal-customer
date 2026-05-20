import { useState, useEffect, useCallback, useRef } from 'react';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('customer_user')) || null; } catch (e) { return null; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('customer_cart')) || []; } catch (e) { return []; }
  });

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('selected_branch') || '');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [view, setView] = useState('home'); 
  const [toast, setToast] = useState(null);

  const prevOrdersRef = useRef([]);
  const API_URL = 'https://abumahal-backend.onrender.com';

  const theme = {
    primary: '#e31837', bg: '#f4f7f6', card: '#ffffff', text: '#2c3e50',
    gray: '#95a5a6', success: '#27ae60', warning: '#f39c12', shadow: '0 8px 20px rgba(0,0,0,0.08 )'
  };

  useEffect(() => {
    if (user) localStorage.setItem('customer_user', JSON.stringify(user));
    else localStorage.removeItem('customer_user');
  }, [user]);

  useEffect(() => { localStorage.setItem('customer_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (selectedBranch) localStorage.setItem('selected_branch', selectedBranch); }, [selectedBranch]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const playSound = () => {
    try { new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3' ).play().catch(()=>{}); } catch (e) {}
  };

  // جلب البيانات الأساسية
  useEffect(() => {
    fetch(`${API_URL}/api/branches`).then(res => res.json()).then(data => { if(Array.isArray(data)) setBranches(data); }).catch(()=>{});
    fetch(`${API_URL}/api/categories`).then(res => res.json()).then(data => { if(Array.isArray(data)) setCategories(data); }).catch(()=>{});
    fetch(`${API_URL}/api/products`).then(res => res.json()).then(data => { if(Array.isArray(data)) setProducts(data); }).catch(()=>{});
  }, []);

  // 🚀 التحديث الحي للطلبات (كل ثانية) مع الإشعارات
  useEffect(() => {
    if (!user) return;
    const fetchMyOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const userOrders = data.filter(o => o.userId === user.id).reverse();
          
          // مقارنة الحالات لإرسال إشعارات
          userOrders.forEach(newOrder => {
            const oldOrder = prevOrdersRef.current.find(o => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              if (newOrder.status === 'جاهز') {
                showToast(`🎉 طلبك رقم #${newOrder.id} جاهز للاستلام!`);
                playSound();
              } else if (newOrder.status === 'جاري التجهيز') {
                showToast(`👨‍🍳 بدأنا بتجهيز طلبك رقم #${newOrder.id}، انتظرنا قريباً!`);
              }
            }
          });
          
          prevOrdersRef.current = userOrders;
          setMyOrders(userOrders);
        }
      } catch (error) {}
    };

    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 1500); // تحديث كل ثانية ونصف
    return () => clearInterval(interval);
  }, [user, showToast]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering ? { name, phone, password, role: 'عميل' } : { phone, password };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) return showToast(data.error);
      setUser(data); showToast(`أهلاً بك يا ${data.name} 👋`);
    } catch (error) { showToast("خطأ في الاتصال"); }
  };

  const addToCart = (product) => {
    if (!product.isAvailable) return showToast("عذراً، نفدت الكمية!");
    setCart([...cart, { ...product, cartId: Date.now() }]); 
    showToast("تمت الإضافة للسلة 🛒");
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const placeOrder = async () => {
    if (!selectedBranch) { setView('home'); return showToast("الرجاء اختيار الفرع أولاً!"); }
    if (cart.length === 0) return showToast("السلة فارغة!");
    
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const orderData = { userId: user.id, customerName: user.name, orderType: 'استلام من الفرع', branch: selectedBranch, totalPrice, items: cart, paymentStatus: 'غير مدفوع' };
    
    try {
      const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (res.ok) {
        setCart([]); 
        setView('orders'); 
        showToast("تم إرسال طلبك بنجاح! 🎉");
        playSound();
      }
    } catch (error) { showToast("فشل إرسال الطلب"); }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'Tajawal, sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: '#333', color: 'white', padding: '15px 25px', borderRadius: '30px', zIndex: 1000, boxShadow: theme.shadow }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: theme.shadow }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: theme.primary, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '30px' }}>🍔</div>
          <h2 style={{ color: theme.text, marginBottom: '30px' }}>{isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && <input placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none' }} />}
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none' }} />
            <button type="submit" style={{ padding: '15px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: '0.3s' }}>{isRegistering ? 'تسجيل' : 'دخول'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: theme.gray, cursor: 'pointer', marginTop: '25px', fontSize: '14px' }}>
            {isRegistering ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ سجل الآن'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'Tajawal, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px 30px', borderRadius: '30px', zIndex: 1000, boxShadow: theme.shadow, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>{toast}</div>}
      
      <div style={{ backgroundColor: theme.card, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '22px', fontWeight: '900' }}>أبو مهل</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: theme.text, fontWeight: 'bold' }}>{user.name}</span>
          <button onClick={() => setUser(null)} style={{ background: '#ffeeee', color: theme.primary, border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>خروج</button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {view === 'home' && (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>📍 اختر الفرع الأقرب لك</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {branches.map(b => (
                <div key={b.id} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} style={{ padding: '25px', backgroundColor: theme.card, border: selectedBranch === b.name ? `2px solid ${theme.primary}` : '2px solid transparent', borderRadius: '20px', cursor: 'pointer', boxShadow: theme.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.3s' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text }}>فرع {b.name}</span>
                  <span style={{ fontSize: '24px' }}>🏪</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            {!selectedBranch ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray }}>الرجاء اختيار الفرع أولاً من الصفحة الرئيسية</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: theme.text, margin: 0 }}>المنيو - {selectedBranch}</h3>
                </div>
                {categories.map(c => {
                  const catProducts = products.filter(p => p.categoryId === c.id);
                  if (catProducts.length === 0) return null;
                  return (
                    <div key={c.id} style={{ marginBottom: '30px' }}>
                      <h4 style={{ color: theme.primary, borderBottom: `2px solid ${theme.primary}`, paddingBottom: '10px', display: 'inline-block' }}>{c.name}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '15px' }}>
                        {catProducts.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: '20px', borderRadius: '20px', boxShadow: theme.shadow, opacity: p.isAvailable ? 1 : 0.6 }}>
                            <div>
                              <strong style={{ fontSize: '18px', color: theme.text, textDecoration: p.isAvailable ? 'none' : 'line-through' }}>{p.name}</strong>
                              <div style={{ color: theme.primary, fontWeight: 'bold', marginTop: '5px', fontSize: '16px' }}>{p.price} ريال</div>
                              {!p.isAvailable && <div style={{ color: theme.primary, fontSize: '12px', marginTop: '5px', backgroundColor: '#ffeeee', padding: '3px 8px', borderRadius: '10px', display: 'inline-block' }}>نفدت الكمية</div>}
                            </div>
                            <button onClick={() => addToCart(p)} disabled={!p.isAvailable} style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: p.isAvailable ? theme.primary : '#eee', color: p.isAvailable ? 'white' : '#aaa', border: 'none', fontSize: '24px', cursor: p.isAvailable ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' }}>+</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {view === 'cart' && (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>سلة المشتريات 🛒</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray, backgroundColor: theme.card, borderRadius: '20px' }}>
                <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛒</div>
                السلة فارغة، أضف بعض الوجبات اللذيذة!
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: theme.card, borderRadius: '20px', padding: '10px', boxShadow: theme.shadow }}>
                  {cart.map((item) => (
                    <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' }}>
                      <span style={{ fontWeight: 'bold', color: theme.text }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <strong style={{ color: theme.primary }}>{item.price} ريال</strong>
                        <button onClick={() => removeFromCart(item.cartId)} style={{ background: 'none', border: 'none', color: theme.gray, fontSize: '20px', cursor: 'pointer' }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', padding: '25px', backgroundColor: theme.card, borderRadius: '20px', boxShadow: theme.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: theme.text }}>
                    <span>الإجمالي:</span>
                    <span style={{ color: theme.primary }}>{cart.reduce((sum, item) => sum + item.price, 0)} ريال</span>
                  </div>
                  <button onClick={placeOrder} style={{ width: '100%', padding: '18px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)' }}>تأكيد وإرسال الطلب</button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'orders' && (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>طلباتي الحية 🧾</h3>
            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray }}>لا توجد طلبات سابقة</div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {myOrders.map(o => {
                  const isReady = o.status === 'جاهز';
                  const isPreparing = o.status === 'جاري التجهيز' || o.status === 'قيد التجهيز';
                  const isCompleted = o.status === 'مكتمل';
                  
                  let statusColor = theme.gray;
                  let statusIcon = '🕒';
                  if (isReady) { statusColor = theme.success; statusIcon = '🎉'; }
                  else if (isPreparing) { statusColor = theme.warning; statusIcon = '👨‍🍳'; }
                  else if (isCompleted) { statusColor = theme.primary; statusIcon = '✅'; }

                  return (
                    <div key={o.id} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '20px', boxShadow: theme.shadow, borderRight: `6px solid ${statusColor}`, position: 'relative', overflow: 'hidden' }}>
                      {isReady && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #27ae60, #2ecc71)', animation: 'pulse 1.5s infinite' }}></div>}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '18px', color: theme.text }}>طلب #{o.id}</strong>
                        <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '18px' }}>{o.totalPrice} ريال</span>
                      </div>
                      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: theme.gray }}>الفرع: {o.branch}</p>
                      
                      <div style={{ padding: '12px', backgroundColor: `${statusColor}15`, color: statusColor, borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        {statusIcon} {o.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي الاحترافي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: theme.card, display: 'flex', justifyContent: 'space-around', padding: '15px 10px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)', borderRadius: '30px 30px 0 0', zIndex: 100 }}>
        {[
          { id: 'home', icon: '🏪', label: 'الفروع' },
          { id: 'menu', icon: '🍔', label: 'المنيو' },
          { id: 'cart', icon: '🛒', label: 'السلة', badge: cart.length },
          { id: 'orders', icon: '🧾', label: 'طلباتي' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', color: view === tab.id ? theme.primary : theme.gray, position: 'relative', width: '60px' }}>
            <span style={{ fontSize: '24px', filter: view === tab.id ? 'grayscale(0)' : 'grayscale(1)', transform: view === tab.id ? 'scale(1.1)' : 'scale(1)', transition: '0.2s' }}>{tab.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: view === tab.id ? 'bold' : 'normal' }}>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '5px', backgroundColor: theme.primary, color: 'white', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

export default App;
