import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import uiReducer from './uiSlice';

// `preloadedUi` lets the server hand over the session + language it already
// knows, so the first client render matches the server (no auth flicker).
export function makeStore(preloadedUi) {
  const ui = uiReducer(undefined, { type: '@@init' });
  const store = configureStore({
    reducer: {
      ui: uiReducer,
      [api.reducerPath]: api.reducer
    },
    preloadedState: preloadedUi ? { ui: { ...ui, ...preloadedUi } } : undefined,
    middleware: (getDefault) => getDefault().concat(api.middleware)
  });
  setupListeners(store.dispatch);
  return store;
}
