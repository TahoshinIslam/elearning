import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import uiReducer from './uiSlice';

export function makeStore() {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
      [api.reducerPath]: api.reducer
    },
    middleware: (getDefault) => getDefault().concat(api.middleware)
  });
  setupListeners(store.dispatch);
  return store;
}
