import { useState, useEffect } from 'react';

function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [orderType, setOrderType] = useState(''); 
  const [branch, setBranch] = useState('');
  
  const [branches, setBranches] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const colors = {
    primary: '#8b0000', 
    accent: '#f1c40f',  
    bg: '#f4f7f6',
    card: '#ffffff',
    textDark: '#2c3e50',
    textGray: '#7f8c8d'
  };

  const fetchData = () => {
    fetch('http://localhost:3000/api/categories' )
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) { 
          setCategories(data); 
          if (!activeCategory && data.length > 0) setActiveCategory(data[0].id); 
        }
      }).catch(() => {});
      
    fetch('http://localhost:3000/api/branches' )
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBranches(data); }).catch(() => {});

    if (user) {
      fetch('http://localhost:3000/api/orders' )
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMyOrders(data.filter(o => o.userId === user.id).reverse()); }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [user, activeCategory]);

  const handleAuth = (e) => {
    e.preventDefault();
    const url = isRegistering ? 'http://localhost:3000/api/register' : 'http://localhost:3000/api/login';
    const body = isRegistering ? { name, phone, password, role: "عميل" } : { phone, password };

    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ) })
    .then(res => res.json())
    .then(data => {
      if (data.error) return showToast(data.error);
      setUser(data);
      showToast(`أهلاً بك يا ${data.name} 👋`);
      setView('orderType'); 
    }).catch(() => showToast("خطأ في الاتصال بالخادم"));
  };

  const addToCart = (product) => {
    if (!product.isAvailable) return;
    setCart([...cart, product]);
    showToast(`تم إضافة ${product.name} للسلة 🛒`);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const checkout = () => {
    if (cart.length === 0) return;
    fetch('http://localhost:3000/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, customerName: user.name, orderType, branch, totalPrice, items: cart, paymentStatus: "مدفوع" } )
    }).then(() => {
      setCart([]); 
      fetchData();
      setView('success');
      setTimeout(() => setView('myOrders'), 3000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap' );
        * { font-family: 'Tajawal', sans-serif; box-sizing: border-box; }
        body { margin: 0; background-color: #e0e5ec; }
        .app-container { width: 100%; max-width: 480px; height: 100vh; margin: 0 auto; background-color: ${colors.bg}; position: relative; overflow: hidden; box-shadow: 0 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        .slide-up { animation: slideUp 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .glass-nav { background: rgba(255, 255, 255, 0.95); border-top: 1px solid #eee; }
        .btn-press:active { transform: scale(0.95); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .toast { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: ${colors.textDark}; color: white; padding: 12px 25px; border-radius: 30px; font-weight: bold; z-index: 1000; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
      `}</style>

      <div className="app-container" dir="rtl">
        
        {toast && <div className="toast fade-in">{toast}</div>}

        {view !== 'login' && view !== 'success' && (
          <div style={{ background: `linear-gradient(135deg, ${colors.primary}, #600000)`, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px', zIndex: 10 }}>
            <img src="/logo.png" alt="أبو مهل" onError={(e) => e.target.style.display='none'} style={{ height: '50px', width: '50px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>مطعم أبو مهل</h2>
              <p style={{ color: colors.accent, margin: 0, fontSize: '13px', fontWeight: 'bold' }}>الطعم الأصيل في خميس مشيط</p>
            </div>
          </div>
        )}

        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '100px' }}>
          
          {view === 'login' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '20px' }}>
              <img src="/logo.png" alt="شعار" onError={(e) => e.target.style.display='none'} style={{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '20px' }} />
              <h1 style={{ color: colors.primary, margin: '0 0 5px 0' }}>أبو مهل</h1>
              <p style={{ color: colors.textGray, marginBottom: '30px' }}>سجل دخولك واستمتع بألذ الوجبات</p>
              
              <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {isRegistering && <input type="text" placeholder="الاسم الكريم" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />}
                <input type="tel" placeholder="رقم الجوال" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />
                <input type="password" placeholder="الرقم السري" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '18px', borderRadius: '15px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />
                <button className="btn-press" type="submit" style={{ padding: '18px', background: `linear-gradient(135deg, ${colors.primary}, #600000)`, color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                  {isRegistering ? 'إنشاء حساب' : 'تسجيل الدخول'}
                </button>
              </form>
              <p onClick={() => setIsRegistering(!isRegistering)} style={{ color: colors.textDark, cursor: 'pointer', marginTop: '30px', fontWeight: 'bold' }}>
                {isRegistering ? 'لدي حساب بالفعل؟ دخول' : 'مستخدم جديد؟ سجل الآن'}
              </p>
            </div>
          )}

          {view === 'orderType' && (
            <div className="slide-up">
              <h2 style={{ color: colors.textDark, marginBottom: '5px' }}>مرحباً {user?.name} 👋</h2>
              <p style={{ color: colors.textGray, marginTop: 0, marginBottom: '25px' }}>حدد طريقة استلام طلبك</p>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <button disabled style={{ flex: 1, padding: '25px 10px', backgroundColor: '#e0e0e0', color: '#95a5a6', border: 'none', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <span style={{ fontSize: '35px', filter: 'grayscale(100%)' }}>🛵</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>توصيل</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#bdc3c7', color: 'white', padding: '4px 10px', borderRadius: '12px' }}>قريباً ⏳</span>
                </button>

                <button className="btn-press" onClick={() => setOrderType('استلام من الفرع')} style={{ flex: 1, padding: '25px 10px', backgroundColor: orderType === 'استلام من الفرع' ? colors.primary : 'white', color: orderType === 'استلام من الفرع' ? 'white' : colors.textDark, border: orderType === 'استلام من الفرع' ? 'none' : '2px solid transparent', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '35px' }}>🏪</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>استلام من الفرع</span>
                  <span style={{ fontSize: '12px', color: orderType === 'استلام من الفرع' ? colors.accent : colors.primary, fontWeight: 'bold' }}>متاح الآن ✅</span>
                </button>
              </div>

              {orderType === 'استلام من الفرع' && (
                <div className="slide-up" style={{ marginTop: '35px' }}>
                  <h3 style={{ color: colors.textDark, marginBottom: '15px' }}>اختر الفرع الأقرب لك:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {branches.map(b => (
                      <button key={b.id} className="btn-press" onClick={() => setBranch(b.name)} style={{ padding: '20px', backgroundColor: branch === b.name ? colors.primary : 'white', color: branch === b.name ? 'white' : colors.textDark, border: 'none', borderRadius: '15px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <span>📍 فرع {b.name}</span>
                        {branch === b.name && <span style={{ color: colors.accent }}>✔</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {orderType && branch && (
                <button className="btn-press slide-up" onClick={() => setView('menu')} style={{ width: '100%', padding: '20px', background: colors.textDark, color: 'white', border: 'none', borderRadius: '15px', marginTop: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                  تصفح المنيو 🍔
                </button>
              )}
            </div>
          )}

          {view === 'menu' && (
            <div className="fade-in">
              <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px', marginBottom: '25px' }}>
                {categories.map(c => (
                  <button key={c.id} className="btn-press" onClick={() => setActiveCategory(c.id)} style={{ padding: '12px 25px', whiteSpace: 'nowrap', backgroundColor: activeCategory === c.id ? colors.primary : 'white', color: activeCategory === c.id ? 'white' : colors.textDark, border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    {c.name}
                  </button>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {categories.find(c => c.id === activeCategory)?.products?.map(p => (
                  <div key={p.id} className="slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '18px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', opacity: p.isAvailable ? 1 : 0.5 }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: colors.textDark, fontSize: '18px', textDecoration: p.isAvailable ? 'none' : 'line-through' }}>{p.name}</h3>
                      <span style={{ color: p.isAvailable ? colors.primary : '#e74c3c', fontWeight: '900', fontSize: '16px' }}>
                        {p.isAvailable ? `${p.price} ريال` : 'نفدت الكمية ❌'}
                      </span>
                    </div>
                    
                    {p.isAvailable && (
                      <button className="btn-press" onClick={() => addToCart(p)} style={{ backgroundColor: '#fef0f0', color: colors.primary, border: 'none', width: '45px', height: '45px', borderRadius: '15px', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'cart' && (
            <div className="fade-in">
              <h2 style={{ color: colors.textDark, marginBottom: '20px' }}>سلة الطلبات 🛒</h2>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px', color: colors.textGray }}>
                  <div style={{ fontSize: '70px', marginBottom: '15px', opacity: 0.5 }}>🛒</div>
                  <h3>سلتك فارغة حالياً!</h3>
                  <button className="btn-press" onClick={() => setView('menu')} style={{ marginTop: '20px', padding: '12px 30px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold' }}>الذهاب للمنيو</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map((item, i) => (
                      <div key={i} className="slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                        <span style={{ fontWeight: 'bold', color: colors.textDark, fontSize: '16px' }}>{item.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <strong style={{ color: colors.primary }}>{item.price} ريال</strong>
                          <button className="btn-press" onClick={() => removeFromCart(i)} style={{ background: '#ffeeee', border: 'none', color: '#e74c3c', width: '35px', height: '35px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="slide-up" style={{ marginTop: '30px', padding: '25px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ display: 'flex', justifyContent: 'space-between', margin: '0 0 25px 0', color: colors.textDark }}>
                      <span>الإجمالي:</span> 
                      <span style={{ color: colors.primary, fontSize: '26px', fontWeight: '900' }}>{totalPrice} ريال</span>
                    </h3>
                    <button className="btn-press" onClick={checkout} style={{ width: '100%', padding: '20px', background: `linear-gradient(135deg, ${colors.primary}, #600000)`, color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
                      تأكيد وإرسال الطلب ✅
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {view === 'success' && (
            <div className="fade-in" style={{ textAlign: 'center', marginTop: '120px' }}>
              <div style={{ fontSize: '90px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{ color: '#27ae60', fontSize: '28px', margin: '0 0 10px 0' }}>تم استلام طلبك!</h2>
              <p style={{ color: colors.textGray, fontSize: '16px' }}>جاري تجهيز أشهى الوجبات لك...</p>
            </div>
          )}

          {view === 'myOrders' && (
            <div className="fade-in">
              <h2 style={{ color: colors.textDark, marginBottom: '20px' }}>طلباتي السابقة 🧾</h2>
              {myOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: colors.textGray, marginTop: '60px' }}>لم تقم بأي طلب حتى الآن.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {myOrders.map(o => (
                    <div key={o.id} className="slide-up" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRight: `6px solid ${o.status === 'جاهز' ? '#27ae60' : o.status === 'جاري التجهيز' ? '#f39c12' : colors.primary}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <strong style={{ color: colors.textDark, fontSize: '18px' }}>طلب #{o.id}</strong>
                        <span style={{ color: colors.primary, fontWeight: '900', fontSize: '18px' }}>{o.totalPrice} ريال</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.textGray, fontSize: '14px' }}>📍 {o.branch}</span>
                        <span style={{ backgroundColor: o.status === 'جاهز' ? '#e8f8f5' : o.status === 'جاري التجهيز' ? '#fef5e7' : '#fdedec', color: o.status === 'جاهز' ? '#27ae60' : o.status === 'جاري التجهيز' ? '#f39c12' : colors.primary, padding: '6px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {user && view !== 'success' && (
          <div className="glass-nav slide-up" style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', display: 'flex', padding: '15px 5px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)', zIndex: 100 }}>
            <button className="btn-press" onClick={() => setView('orderType')} style={{ flex: 1, border: 'none', background: 'none', color: view === 'orderType' ? colors.primary : colors.textGray, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '22px' }}>🏠</span>
              <span style={{ fontSize: '12px', fontWeight: view === 'orderType' ? 'bold' : 'normal' }}>الرئيسية</span>
            </button>
            <button className="btn-press" onClick={() => setView('menu')} style={{ flex: 1, border: 'none', background: 'none', color: view === 'menu' ? colors.primary : colors.textGray, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '22px' }}>🍔</span>
              <span style={{ fontSize: '12px', fontWeight: view === 'menu' ? 'bold' : 'normal' }}>المنيو</span>
            </button>
            <button className="btn-press" onClick={() => setView('cart')} style={{ flex: 1, border: 'none', background: 'none', color: view === 'cart' ? colors.primary : colors.textGray, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
              <span style={{ fontSize: '22px' }}>🛒</span>
              <span style={{ fontSize: '12px', fontWeight: view === 'cart' ? 'bold' : 'normal' }}>السلة</span>
              {cart.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '20px', backgroundColor: colors.primary, color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>{cart.length}</span>}
            </button>
            <button className="btn-press" onClick={() => setView('myOrders')} style={{ flex: 1, border: 'none', background: 'none', color: view === 'myOrders' ? colors.primary : colors.textGray, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '22px' }}>🧾</span>
              <span style={{ fontSize: '12px', fontWeight: view === 'myOrders' ? 'bold' : 'normal' }}>طلباتي</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
