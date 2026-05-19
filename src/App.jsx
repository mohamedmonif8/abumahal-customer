import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [view, setView] = useState('home'); // home, menu, cart, orders
  const [toast, setToast] = useState(null);

  const API_URL = 'https://abumahal-backend.onrender.com'; // الرابط الجديد
  const colors = { primary: '#8b0000', bg: '#f9f9f9', card: '#ffffff' };

  const showToast = (msg ) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`${API_URL}/api/branches`).then(res => res.json()).then(data => { if(Array.isArray(data)) setBranches(data); }).catch(()=>{});
    fetch(`${API_URL}/api/categories`).then(res => res.json()).then(data => { if(Array.isArray(data)) setCategories(data); }).catch(()=>{});
    fetch(`${API_URL}/api/products`).then(res => res.json()).then(data => { if(Array.isArray(data)) setProducts(data); }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (user && view === 'orders') {
      fetch(`${API_URL}/api/orders`).then(res => res.json()).then(data => {
        if(Array.isArray(data)) setMyOrders(data.filter(o => o.userId === user.id).reverse());
      }).catch(()=>{});
    }
  }, [user, view]);

  const handleAuth = (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering ? { name, phone, password, role: 'عميل' } : { phone, password };
    
    fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(res => res.json()).then(data => {
      if (data.error) return showToast(data.error);
      setUser(data); showToast(`أهلاً بك يا ${data.name}`);
    }).catch(() => showToast("خطأ في الاتصال"));
  };

  const addToCart = (product) => {
    if (!product.isAvailable) return showToast("عذراً، نفدت الكمية!");
    setCart([...cart, product]); showToast("تمت الإضافة للسلة 🛒");
  };

  const placeOrder = () => {
    if (!selectedBranch) return showToast("الرجاء اختيار الفرع أولاً!");
    if (cart.length === 0) return showToast("السلة فارغة!");
    
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    const orderData = { userId: user.id, customerName: user.name, orderType: 'استلام من الفرع', branch: selectedBranch, totalPrice, items: cart, paymentStatus: 'غير مدفوع' };
    
    fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
    .then(() => { setCart([]); setView('orders'); showToast("تم إرسال طلبك بنجاح! 🎉"); });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', direction: 'rtl', backgroundColor: colors.bg }}>
        {toast && <div style={{ position: 'fixed', top: 20, background: '#333', color: 'white', padding: '15px', borderRadius: '10px' }}>{toast}</div>}
        <div style={{ backgroundColor: colors.card, padding: '30px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: colors.primary }}>{isRegistering ? 'حساب جديد' : 'تسجيل الدخول'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && <input placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />}
            <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ padding: '15px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{isRegistering ? 'تسجيل' : 'دخول'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: colors.primary, cursor: 'pointer', marginTop: '20px' }}>
            {isRegistering ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ سجل الآن'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', direction: 'rtl', backgroundColor: colors.bg, fontFamily: 'sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '15px', borderRadius: '10px', zIndex: 1000 }}>{toast}</div>}
      
      <div style={{ backgroundColor: colors.primary, color: 'white', padding: '20px', textAlign: 'center', borderRadius: '0 0 20px 20px' }}>
        <h2 style={{ margin: 0 }}>مطعم أبو مهل</h2>
      </div>

      <div style={{ padding: '20px' }}>
        {view === 'home' && (
          <div>
            <h3 style={{ color: colors.primary }}>اختر الفرع الأقرب لك:</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {branches.map(b => (
                <button key={b.id} onClick={() => { setSelectedBranch(b.name); setView('menu'); }} style={{ padding: '20px', backgroundColor: colors.card, border: selectedBranch === b.name ? `2px solid ${colors.primary}` : '1px solid #ddd', borderRadius: '15px', fontSize: '18px', cursor: 'pointer' }}>
                  📍 {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div>
            <h3 style={{ color: colors.primary }}>المنيو - فرع {selectedBranch}</h3>
            {categories.map(c => (
              <div key={c.id} style={{ marginBottom: '20px' }}>
                <h4 style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '10px' }}>{c.name}</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {products.filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: '15px', borderRadius: '10px', opacity: p.isAvailable ? 1 : 0.6 }}>
                      <div>
                        <strong style={{ textDecoration: p.isAvailable ? 'none' : 'line-through' }}>{p.name}</strong>
                        <div style={{ color: colors.primary, fontWeight: 'bold' }}>{p.price} ريال</div>
                        {!p.isAvailable && <div style={{ color: 'red', fontSize: '12px' }}>نفدت الكمية</div>}
                      </div>
                      <button onClick={() => addToCart(p)} disabled={!p.isAvailable} style={{ padding: '10px 20px', backgroundColor: p.isAvailable ? colors.primary : '#ccc', color: 'white', border: 'none', borderRadius: '10px', cursor: p.isAvailable ? 'pointer' : 'not-allowed' }}>+</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'cart' && (
          <div>
            <h3 style={{ color: colors.primary }}>السلة 🛒</h3>
            {cart.length === 0 ? <p>السلة فارغة</p> : (
              <>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: colors.card, padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
                    <span>{item.name}</span>
                    <strong>{item.price} ريال</strong>
                  </div>
                ))}
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: colors.card, borderRadius: '10px', textAlign: 'center' }}>
                  <h3>الإجمالي: {cart.reduce((sum, item) => sum + item.price, 0)} ريال</h3>
                  <button onClick={placeOrder} style={{ width: '100%', padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>تأكيد الطلب</button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'orders' && (
          <div>
            <h3 style={{ color: colors.primary }}>طلباتي السابقة 🧾</h3>
            {myOrders.map(o => (
              <div key={o.id} style={{ backgroundColor: colors.card, padding: '15px', borderRadius: '10px', marginBottom: '10px', borderRight: `5px solid ${o.status === 'جاهز' ? '#27ae60' : colors.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>طلب #{o.id}</strong>
                  <span style={{ color: colors.primary }}>{o.totalPrice} ريال</span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>الفرع: {o.branch}</p>
                <div style={{ marginTop: '10px', padding: '5px', backgroundColor: '#eee', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>{o.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', display: 'flex', justifyContent: 'space-around', padding: '15px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: view === 'home' ? colors.primary : '#999', fontWeight: 'bold', cursor: 'pointer' }}>🏠 الفروع</button>
        <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: view === 'menu' ? colors.primary : '#999', fontWeight: 'bold', cursor: 'pointer' }}>🍔 المنيو</button>
        <button onClick={() => setView('cart')} style={{ background: 'none', border: 'none', color: view === 'cart' ? colors.primary : '#999', fontWeight: 'bold', cursor: 'pointer' }}>🛒 السلة ({cart.length})</button>
        <button onClick={() => setView('orders')} style={{ background: 'none', border: 'none', color: view === 'orders' ? colors.primary : '#999', fontWeight: 'bold', cursor: 'pointer' }}>🧾 طلباتي</button>
      </div>
    </div>
  );
}
export default App;
