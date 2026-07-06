import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_NAMES = {
  student: 'তানভীর আহমেদ',
  teacher: 'আবরার হায়দার',
  parent: 'তানভীরের অভিভাবক',
  owner: 'কেন্দ্র অ্যাডমিন',
  superadmin: 'Leo HQ'
};

const initialState = {
  lang: 'bn',
  auth: null, // { role, name } | null
  centerName: '',
  brandColor: '#E8590C',
  payModel: 'A',
  toast: null,
  studentPaid: false // client-only: has the logged-in student paid this month's fee
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLang(state, action) { state.lang = action.payload; },
    toggleLang(state) { state.lang = state.lang === 'bn' ? 'en' : 'bn'; },
    setAuth(state, action) { state.auth = action.payload; },
    clearAuth(state) { state.auth = null; },
    setCenterName(state, action) { state.centerName = action.payload; },
    setBrandColor(state, action) { state.brandColor = action.payload; },
    setPayModel(state, action) { state.payModel = action.payload; },
    setToast(state, action) { state.toast = action.payload; },
    clearToast(state) { state.toast = null; },
    setStudentPaidFlag(state, action) { state.studentPaid = !!action.payload; }
  }
});

export const {
  setLang, toggleLang, setAuth, clearAuth,
  setCenterName, setBrandColor, setPayModel, setToast, clearToast, setStudentPaidFlag
} = uiSlice.actions;

export default uiSlice.reducer;

// ---------- thunks (side effects: localStorage, timers) ----------

export const hydrateAuth = () => (dispatch) => {
  try {
    const saved = localStorage.getItem('leo.auth');
    if (saved) dispatch(setAuth(JSON.parse(saved)));
  } catch (e) { /* ignore */ }
};

export const login = (role, name) => (dispatch) => {
  const session = { role, name: name || DEFAULT_NAMES[role] || 'User' };
  dispatch(setAuth(session));
  try { localStorage.setItem('leo.auth', JSON.stringify(session)); } catch (e) { /* ignore */ }
  return session;
};

export const logout = () => (dispatch) => {
  dispatch(clearAuth());
  try { localStorage.removeItem('leo.auth'); } catch (e) { /* ignore */ }
};

// single global timer so overlapping toasts don't clear each other early
let toastTimer;
export const showToast = (msg) => (dispatch) => {
  clearTimeout(toastTimer);
  dispatch(setToast(msg));
  toastTimer = setTimeout(() => dispatch(clearToast()), 2400);
};
