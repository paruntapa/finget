import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { alphaVantageApi } from './api/alphaVantageApi';
import { customApi } from './api/customApi';
import widgetsReducer from './slices/widgetsSlice';
import themeReducer from './slices/themeSlice';

// Redux persist config
const persistConfig = {
  key: 'FinGet',
  storage,
  whitelist: ['widgets', 'theme'], // Only persist these slices
  blacklist: ['alphaVantageApi', 'customApi'], // Don't persist API cache
};

const rootReducer = combineReducers({
  [alphaVantageApi.reducerPath]: alphaVantageApi.reducer,
  [customApi.reducerPath]: customApi.reducer,
  widgets: widgetsReducer,
  theme: themeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const persistedReducer = persistReducer(persistConfig, rootReducer);

export default rootReducer;
