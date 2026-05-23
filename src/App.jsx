import { useState, useEffect, useCallback } from 'react';

/**
 * Abu Mahal Customer App - Professional Edition
 * Features: Branch Selection, Menu Browsing, Cart Management, Order Tracking
 */

export default function App() {
  // ================= 1. State Management =================
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('customer_user')) || null; } 
    catch { return null; }
  });

  const [view, setView] = useState('home'); // home, menu, cart, orders, login
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [auth, setAuth] = useState({ phone: '', password: '', name: '', isRegister: false });

  const API_URL = 'https://abumahal-backend.onrender.com';
  const theme = { primary: '#8b0000', secondary: '#f1c40f', bg: '#f8f9fa', card: '#ffffff', text: '#2c3e50' };

  // ================= 2. Utility Functions =================
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, branchesRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/branches`)
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (branchesRes.ok) setBranches(await branchesRes.json());
      
      if (user) {
        const ordersRes = await fetch(`${API_URL}/api/orders/user/${user.id}`);
        if (ordersRes.ok) setMyOrders((await ordersRes.json()).reverse());
      }
    } catch (error) { console.error(error); }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ================= 3. Handlers =================
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = auth.isRegister ? '/api/register' : '/api/login';
    const body = auth.isRegister ? { name: auth.name, phone: auth.phone, password: auth.password } : { phone: auth.phone, password: auth.password };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) return showToast(data.error);
      setUser(data);
      localStorage.setItem('customer_user', JSON.stringify(data));
      showToast(`أهلاً بك يا ${data.name}`);
      setView('home');
    } catch (error) { showToast("خطأ في الاتصال"); }
  };

  const addToCart = (product) => {
    if (!selectedBranch) return showToast("الرجاء اختيار الفرع أولاً");
    setCart([...cart, product]);
    showToast("تمت الإضافة للسلة 🛒");
  };

  const placeOrder = async () => {
    if (!user) return setView('login');
    if (cart.length === 0) return showToast("السلة فارغة");

    const orderData = {
      userId: user.id,
      customerName: user.name,
      orderType: 'سفري',
      branch: selectedBranch,
      totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
      items: cart,
      paymentStatus: 'عند الاستلام'
    };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        showToast("تم إرسال طلبك بنجاح! 🎉");
        setCart([]);
        setView('orders');
        fetchData();
      }
    } catch (error) { showToast("فشل إرسال الطلب"); }
  };

  // ================= 4. UI Components =================
  const Navbar = () => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', display: 'flex', justifyContent: 'space-around', padding: '15px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 100 }}>
      <button onClick={() => setView('home')} style={{ border: 'none', background: 'none', fontSize: '20px', color: view === 'home' ? theme.primary : '#ccc' }}>🏠</button>
      <button onClick={() => setView('menu')} style={{ border: 'none', background: 'none', fontSize: '20px', color: view === 'menu' ? theme.primary : '#ccc' }}>🍔</button>
      <button onClick={() => setView('cart')} style={{ border: 'none', background: 'none', fontSize: '20px', color: view === 'cart' ? theme.primary : '#ccc', position: 'relative' }}>
        🛒 {cart.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: theme.primary, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px' }}>{cart.length}</span>}
      </button>
      <button onClick={() => setView('orders')} style={{ border: 'none', background: 'none', fontSize: '20px', color: view === 'orders' ? theme.primary : '#ccc' }}>🧾</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, direction: 'rtl', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 25px', borderRadius: '25px', zIndex: 1000 }}>{toast}</div>}
      
      {/* Header */}
      <div style={{ background: theme.primary, color: '#fff', padding: '20px', textAlign: 'center', borderRadius: '0 0 25px 25px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>مطعم أبو محل 🍔</h1>
        <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.8 }}>أطيب الوجبات تصلك أينما كنت</p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Home View: Branch Selection */}
        {view === 'home' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2 style={{ color: theme.text }}>اختر الفرع الأقرب إليك 📍</h2>
            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
              {branches.map(b => (
                <div key={b.id} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} style={{ background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: selectedBranch === b.name ? `2px solid ${theme.primary}` : '2px solid transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{b.name}</span>
                  <span>{selectedBranch === b.name ? '✅' : '⬅️'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu View */}
        {view === 'menu' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>قائمة الطعام 🍽️</h2>
              <span style={{ fontSize: '12px', background: '#eee', padding: '5px 10px', borderRadius: '10px' }}>فرع: {selectedBranch || 'لم يتم الاختيار'}</span>
            </div>
            {categories.map(c => (
              <div key={c.id} style={{ marginBottom: '25px' }}>
                <h3 style={{ color: theme.primary, borderBottom: `2px solid ${theme.primary}`, paddingBottom: '5px', marginBottom: '15px' }}>{c.name}</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {c.products.filter(p => p.isAvailable).map(p => (
                    <div key={p.id} style={{ background: '#fff', padding: '15px', borderRadius: '15px', display: 'flex', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '80px', height: '80px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', lineHeight: '80px', fontSize: '30px' }}>🍔</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{p.name}</h4>
                        <p style={{ margin: 0, color: theme.primary, fontWeight: 'bold' }}>{p.price} ريال</p>
                        <button onClick={() => addToCart(p)} style={{ marginTop: '10px', width: '100%', padding: '8px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>إضافة للسلة +</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart View */}
        {view === 'cart' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2>سلة المشتريات 🛒</h2>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p style={{ fontSize: '50px' }}>🛒</p>
                <p>سلتك فارغة حالياً</p>
                <button onClick={() => setView('menu')} style={{ padding: '10px 20px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '10px' }}>اطلب الآن</button>
              </div>
            ) : (
              <>
                <div style={{ background: '#fff', borderRadius: '15px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  {cart.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i === cart.length - 1 ? 'none' : '1px solid #eee' }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: 'bold' }}>{item.price} ريال</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '20px', borderTop: '2px dashed #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
                    <span>الإجمالي:</span>
                    <span style={{ color: theme.primary }}>{cart.reduce((sum, item) => sum + item.price, 0)} ريال</span>
                  </div>
                </div>
                <button onClick={placeOrder} style={{ width: '100%', marginTop: '20px', padding: '15px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>تأكيد الطلب ✅</button>
              </>
            )}
          </div>
        )}

        {/* Orders View */}
        {view === 'orders' && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h2>طلباتي السابقة 🧾</h2>
            {!user ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <p>يرجى تسجيل الدخول لمشاهدة طلباتك</p>
                <button onClick={() => setView('login')} style={{ padding: '10px 20px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '10px' }}>تسجيل الدخول</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {myOrders.map(o => (
                  <div key={o.id} style={{ background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderRight: `5px solid ${o.status === 'جاهز' ? '#27ae60' : theme.secondary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>طلب #{o.id}</span>
                      <span style={{ color: theme.primary, fontWeight: 'bold' }}>{o.totalPrice} ريال</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>الحالة: <span style={{ color: theme.primary, fontWeight: 'bold' }}>{o.status}</span></div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>الفرع: {o.branch}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Login/Register View */}
        {view === 'login' && (
          <div style={{ animation: 'fadeIn 0.5s', background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: theme.primary }}>{auth.isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              {auth.isRegister && <input placeholder="الاسم الكامل" value={auth.name} onChange={e => setAuth({...auth, name: e.target.value})} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />}
              <input type="tel" placeholder="رقم الجوال" value={auth.phone} onChange={e => setAuth({...auth, phone: e.target.value})} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />
              <input type="password" placeholder="كلمة المرور" value={auth.password} onChange={e => setAuth({...auth, password: e.target.value})} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />
              <button type="submit" style={{ padding: '15px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{auth.isRegister ? 'تسجيل' : 'دخول'}</button>
              <p onClick={() => setAuth({...auth, isRegister: !auth.isRegister})} style={{ textAlign: 'center', fontSize: '14px', color: theme.primary, cursor: 'pointer' }}>{auth.isRegister ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ سجل الآن'}</p>
            </form>
          </div>
        )}
      </div>

      <Navbar />
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
