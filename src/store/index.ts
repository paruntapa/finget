import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { customApi } from './api/customApi';
import { indianApi } from './api/indianApi';
import { coinbaseApi } from './api/coinbaseApi';
import { persistedReducer, RootState } from './rootReducer';

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      customApi.middleware,
      indianApi.middleware,
      coinbaseApi.middleware
    ),
});

export const persistor = persistStore(store);

// Enable listener behavior for the store
setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type { RootState };

// Typed hooks
export { useDispatch, useSelector } from 'react-redux';
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';

export const useAppDispatch = () => useReduxDispatch<AppDispatch>();
export const useAppSelector = <TResult>(selector: (state: RootState) => TResult) => useReduxSelector(selector);
