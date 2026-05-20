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
    primary: '#e31837', bg: '#f8f9fa', card: '#ffffff', text: '#2c3e50',
    gray: '#95a5a6', success: '#27ae60', warning: '#f39c12', shadow: '0 4px 15px rgba(0,0,0,0.05 )'
  };

  // دالة مساعدة للحصول على المعرف الصحيح
  const getId = (item) => item._id || item.id;

  useEffect(() => {
    if (user) localStorage.setItem('customer_user', JSON.stringify(user));
    else localStorage.removeItem('customer_user');
  }, [user]);

  useEffect(() => { localStorage.setItem('customer_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (selectedBranch) localStorage.setItem('selected_branch', selectedBranch); }, [selectedBranch]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const playSound = () => {
    try { new Audio('/notification.mp3').play().catch(()=>{}); } catch (e) {}
  };

  useEffect(() => {
    fetch(`${API_URL}/api/branches`).then(res => res.json()).then(data => { if(Array.isArray(data)) setBranches(data); }).catch(()=>{});
    fetch(`${API_URL}/api/categories`).then(res => res.json()).then(data => { if(Array.isArray(data)) setCategories(data); }).catch(()=>{});
    fetch(`${API_URL}/api/products`).then(res => res.json()).then(data => { if(Array.isArray(data)) setProducts(data); }).catch(()=>{});
  }, []);

  // التحديث الحي للطلبات
  useEffect(() => {
    if (!user) return;
    const fetchMyOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const userOrders = data.filter(o => o.userId === getId(user)).reverse();
          
          userOrders.forEach(newOrder => {
            const oldOrder = prevOrdersRef.current.find(o => getId(o) === getId(newOrder));
            if (oldOrder && oldOrder.status !== newOrder.status) {
              if (newOrder.status === 'جاهز') {
                showToast(`🎉 طلبك رقم #${getId(newOrder).toString().slice(-4)} جاهز للاستلام!`);
                playSound();
              } else if (newOrder.status === 'جاري التجهيز') {
                showToast(`👨‍🍳 بدأنا بتجهيز طلبك، انتظرنا قريباً!`);
              }
            }
          });
          
          prevOrdersRef.current = userOrders;
          setMyOrders(userOrders);
        }
      } catch (error) {}
    };

    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 1500);
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

  // 🚀 نظام السلة الجديد (إضافة / زيادة الكمية)
  const addToCart = (product) => {
    if (!product.isAvailable) return showToast("عذراً، نفدت الكمية!");
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => getId(item) === getId(product));
      if (existingItem) {
        return prevCart.map(item => 
          getId(item) === getId(product) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // 🚀 نظام السلة الجديد (نقصان الكمية / حذف)
  const removeFromCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => getId(item) === getId(product));
      if (existingItem.quantity === 1) {
        return prevCart.filter(item => getId(item) !== getId(product));
      }
      return prevCart.map(item => 
        getId(item) === getId(product) ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // الحصول على كمية منتج معين في السلة
  const getItemQuantity = (productId) => {
    const item = cart.find(item => getId(item) === productId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = async () => {
    if (!selectedBranch) { setView('home'); return showToast("الرجاء اختيار الفرع أولاً!"); }
    if (cart.length === 0) return showToast("السلة فارغة!");
    
    const orderData = { 
      userId: getId(user), 
      customerName: user.name, 
      orderType: 'استلام من الفرع', 
      branch: selectedBranch, 
      totalPrice: cartTotal, 
      items: cart, 
      paymentStatus: 'غير مدفوع' 
    };
    
    try {
      const res = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      if (res.ok) {
        setCart([]); 
        setView('orders'); 
        showToast("تم إرسال طلبك بنجاح! 🎉");
        playSound();
      } else {
        showToast("حدث خطأ أثناء إرسال الطلب");
      }
    } catch (error) { showToast("فشل الاتصال بالخادم"); }
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: '#333', color: 'white', padding: '15px 25px', borderRadius: '30px', zIndex: 1000, boxShadow: theme.shadow }}>{toast}</div>}
        <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: theme.shadow }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: theme.primary, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '30px' }}>🍔</div>
          <h2 style={{ color: theme.text, marginBottom: '30px' }}>{isRegistering ? 'حساب جديد' : 'تسجيل الدخول'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && <input placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '16px' }} />}
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '16px' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: '#f9f9f9', outline: 'none', fontSize: '16px' }} />
            <button type="submit" style={{ padding: '15px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>{isRegistering ? 'تسجيل' : 'دخول'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: theme.gray, cursor: 'pointer', marginTop: '25px', fontSize: '15px' }}>
            {isRegistering ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ سجل الآن'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', direction: 'rtl', backgroundColor: theme.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '12px 25px', borderRadius: '30px', zIndex: 1000, boxShadow: theme.shadow, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>{toast}</div>}
      
      <div style={{ backgroundColor: theme.card, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h2 style={{ margin: 0, color: theme.primary, fontSize: '22px', fontWeight: '900' }}>أبو مهل</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: theme.text, fontWeight: 'bold', fontSize: '14px' }}>{user.name}</span>
          <button onClick={() => setUser(null)} style={{ background: '#ffeeee', color: theme.primary, border: 'none', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>خروج</button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        {view === 'home' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>📍 اختر الفرع الأقرب لك</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {branches.map(b => (
                <div key={getId(b)} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} style={{ padding: '20px', backgroundColor: theme.card, border: selectedBranch === b.name ? `2px solid ${theme.primary}` : '2px solid transparent', borderRadius: '16px', cursor: 'pointer', boxShadow: theme.shadow, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: theme.text }}>فرع {b.name}</span>
                  <span style={{ fontSize: '24px' }}>🏪</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            {!selectedBranch ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray }}>الرجاء اختيار الفرع أولاً</div>
            ) : (
              <>
                <h3 style={{ color: theme.text, marginBottom: '20px' }}>المنيو - {selectedBranch}</h3>
                {categories.map(c => {
                  const catProducts = products.filter(p => p.categoryId === getId(c));
                  if (catProducts.length === 0) return null;
                  return (
                    <div key={getId(c)} style={{ marginBottom: '25px' }}>
                      <h4 style={{ color: theme.primary, borderBottom: `2px solid ${theme.primary}`, paddingBottom: '8px', display: 'inline-block', marginBottom: '15px' }}>{c.name}</h4>
                      <div style={{ display: 'grid', gap: '15px' }}>
                        {catProducts.map(p => {
                          const quantity = getItemQuantity(getId(p));
                          return (
                            <div key={getId(p)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: '15px', borderRadius: '16px', boxShadow: theme.shadow, opacity: p.isAvailable ? 1 : 0.6 }}>
                              <div>
                                <strong style={{ fontSize: '16px', color: theme.text, textDecoration: p.isAvailable ? 'none' : 'line-through' }}>{p.name}</strong>
                                <div style={{ color: theme.primary, fontWeight: 'bold', marginTop: '5px', fontSize: '15px' }}>{p.price} ريال</div>
                                {!p.isAvailable && <div style={{ color: theme.primary, fontSize: '12px', marginTop: '5px' }}>نفدت الكمية</div>}
                              </div>
                              
                              {/* 🚀 أزرار التحكم الذكية في المنيو */}
                              {p.isAvailable && (
                                quantity > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9f9f9', padding: '5px', borderRadius: '20px', border: '1px solid #eee' }}>
                                    <button onClick={() => removeFromCart(p)} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #ddd', color: theme.primary, fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                                    <span style={{ fontWeight: 'bold', fontSize: '16px', width: '20px', textAlign: 'center' }}>{quantity}</span>
                                    <button onClick={() => addToCart(p)} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: theme.primary, border: 'none', color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                                  </div>
                                ) : (
                                  <button onClick={() => addToCart(p)} style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: theme.primary, color: 'white', border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة</button>
                                )
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {view === 'cart' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>سلة المشتريات 🛒</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray, backgroundColor: theme.card, borderRadius: '16px' }}>السلة فارغة</div>
            ) : (
              <>
                <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '10px', boxShadow: theme.shadow }}>
                  {cart.map((item) => (
                    <div key={getId(item)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: theme.text, fontSize: '16px' }}>{item.name}</div>
                        <div style={{ color: theme.primary, fontSize: '14px', marginTop: '5px' }}>{item.price * item.quantity} ريال</div>
                      </div>
                      
                      {/* 🚀 أزرار التحكم في السلة */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f9f9f9', padding: '5px', borderRadius: '20px', border: '1px solid #eee' }}>
                        <button onClick={() => removeFromCart(item)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #ddd', color: theme.primary, fontSize: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => addToCart(item)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.primary, border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: theme.card, borderRadius: '16px', boxShadow: theme.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: theme.text }}>
                    <span>الإجمالي:</span>
                    <span style={{ color: theme.primary }}>{cartTotal} ريال</span>
                  </div>
                  <button onClick={placeOrder} style={{ width: '100%', padding: '15px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>تأكيد الطلب</button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'orders' && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h3 style={{ color: theme.text, marginBottom: '20px' }}>طلباتي 🧾</h3>
            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: theme.gray }}>لا توجد طلبات سابقة</div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {myOrders.map(o => {
                  const isReady = o.status === 'جاهز';
                  const isPreparing = o.status === 'جاري التجهيز' || o.status === 'قيد التجهيز';
                  
                  let statusColor = theme.gray;
                  if (isReady) statusColor = theme.success;
                  else if (isPreparing) statusColor = theme.warning;

                  return (
                    <div key={getId(o)} style={{ backgroundColor: theme.card, padding: '20px', borderRadius: '16px', boxShadow: theme.shadow, borderRight: `5px solid ${statusColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '16px', color: theme.text }}>طلب #{getId(o).toString().slice(-4)}</strong>
                        <span style={{ color: theme.primary, fontWeight: 'bold' }}>{o.totalPrice} ريال</span>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.gray }}>الفرع: {o.branch}</p>
                      <div style={{ padding: '8px', backgroundColor: `${statusColor}15`, color: statusColor, borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        {o.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: theme.card, display: 'flex', justifyContent: 'space-around', padding: '10px', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 100 }}>
        {[
          { id: 'home', icon: '🏪', label: 'الفروع' },
          { id: 'menu', icon: '🍔', label: 'المنيو' },
          { id: 'cart', icon: '🛒', label: 'السلة', badge: cartItemsCount },
          { id: 'orders', icon: '🧾', label: 'طلباتي' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: view === tab.id ? theme.primary : theme.gray, position: 'relative', width: '60px' }}>
            <span style={{ fontSize: '22px', filter: view === tab.id ? 'grayscale(0)' : 'grayscale(1)' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: view === tab.id ? 'bold' : 'normal' }}>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '8px', backgroundColor: theme.primary, color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

export default App;
