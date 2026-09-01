import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lang: 'bn',
  auth: null, // { id, role, name, email, permissions, ... } | null
  authReady: false, // true once hydrateAuth has resolved (avoids guard flash)
  centerName: '',
  brandColor: '#E8590C',
  payModel: 'A',
  toast: null,
  studentPaid: false, // client-only: has the logged-in student paid this month's fee
  cart: [], // shopping cart items (client-only, persisted to localStorage)
  cartOpen: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLang(state, action) { state.lang = action.payload; },
    toggleLang(state) { state.lang = state.lang === 'bn' ? 'en' : 'bn'; },
    setAuth(state, action) { state.auth = action.payload; },
    clearAuth(state) { state.auth = null; },
    setAuthReady(state, action) { state.authReady = action.payload !== false; },
    setCenterName(state, action) { state.centerName = action.payload; },
    setBrandColor(state, action) { state.brandColor = action.payload; },
    setPayModel(state, action) { state.payModel = action.payload; },
    setToast(state, action) { state.toast = action.payload; },
    clearToast(state) { state.toast = null; },
    setStudentPaidFlag(state, action) { state.studentPaid = !!action.payload; },
    setCart(state, action) { state.cart = action.payload; },
    setCartOpen(state, action) { state.cartOpen = !!action.payload; }
  }
});

export const {
  setLang, toggleLang, setAuth, clearAuth, setAuthReady,
  setCenterName, setBrandColor, setPayModel, setToast, clearToast, setStudentPaidFlag,
  setCart, setCartOpen
} = uiSlice.actions;

export default uiSlice.reducer;

// ---------- auth thunks (server-backed: httpOnly session cookie) ----------

// Rehydrate the session from the server on load. The session lives in an
// httpOnly cookie, so the client can't read it directly — it asks /api/auth/me.
export const hydrateAuth = () => async (dispatch) => {
  try {
    const res = await fetch('/api/auth/me');
    const { user } = await res.json();
    dispatch(setAuth(user || null));
  } catch (e) {
    dispatch(setAuth(null));
  } finally {
    dispatch(setAuthReady(true));
  }
};

// Real credential login. Throws with a machine-readable code on failure.
export const login = (email, password) => async (dispatch) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'login_failed');
  dispatch(setAuth(data.user));
  return data.user;
};

// Self-service signup (student/parent) — returns the freshly-created session.
export const register = (payload) => async (dispatch) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'register_failed');
  dispatch(setAuth(data.user));
  return data.user;
};

export const logout = () => async (dispatch) => {
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
  dispatch(clearAuth());
};

// Infer a toast colour from the message when the caller doesn't pass a kind,
// so existing calls get action-appropriate colours for free.
function inferKind(msg) {
  const s = String(msg || '');
  if (/মুছ|সরানো|বাতিল|রিফান্|নিষ্ক্রিয়|delete|deleted|remove|removed|cancel|refund|disable|fail|error|ভুল|failed/i.test(s)) return 'error';
  if (/যোগ|তৈরি|নতুন|খোলা|ইস্যু|added|created|create|new|issued|enrolled|ভর্তি/i.test(s)) return 'success';
  if (/আপডেট|সেভ|পরিবর্ত|অ্যাসাইন|updated|saved|update|changed|assign|রেকর্ড/i.test(s)) return 'info';
  if (/সফল|success|signed in|লগইন/i.test(s)) return 'success';
  return 'default';
}

// single global timer so overlapping toasts don't clear each other early
let toastTimer;
export const showToast = (msg, kind) => (dispatch) => {
  clearTimeout(toastTimer);
  dispatch(setToast({ msg, kind: kind || inferKind(msg) }));
  toastTimer = setTimeout(() => dispatch(clearToast()), 2600);
};

// ---------- shopping cart (client-only, persisted to localStorage) ----------
const CART_KEY = 'leo_cart';
function persistCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
}
export const hydrateCart = () => (dispatch) => {
  try { const raw = localStorage.getItem(CART_KEY); if (raw) dispatch(setCart(JSON.parse(raw))); } catch { /* ignore */ }
};
export const addToCart = (course) => (dispatch, getState) => {
  const cart = getState().ui.cart;
  if (cart.some((x) => x.id === course.id)) { dispatch(setCartOpen(true)); return; }
  const next = [...cart, {
    id: course.id, title: course.title, price: course.price ?? 0,
    thumb: course.thumb || null, slug: course.slug, instructor: course.instructor || null
  }];
  persistCart(next);
  dispatch(setCart(next));
  dispatch(setCartOpen(true));
};
export const removeFromCart = (courseId) => (dispatch, getState) => {
  const next = getState().ui.cart.filter((x) => x.id !== courseId);
  persistCart(next);
  dispatch(setCart(next));
};
export const clearCart = () => (dispatch) => {
  persistCart([]);
  dispatch(setCart([]));
};
