import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { customApi } from './api/customApi';
import { indianApi } from './api/indianApi';
import { coinbaseApi } from './api/coinbaseApi';
import widgetsReducer from './slices/widgetsSlice';
import themeReducer from './slices/themeSlice';

// Redux persist config
const persistConfig = {
  key: 'FinGet',
  storage,
  whitelist: ['widgets', 'theme'], // Only persist these slices
  blacklist: ['customApi', 'indianApi', 'coinbaseApi'], // Don't persist API cache
};

const rootReducer = combineReducers({
  [customApi.reducerPath]: customApi.reducer,
  [indianApi.reducerPath]: indianApi.reducer,
  [coinbaseApi.reducerPath]: coinbaseApi.reducer,
  widgets: widgetsReducer,
  theme: themeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const persistedReducer = persistReducer(persistConfig, rootReducer);

export default rootReducer;