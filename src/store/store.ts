import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authentication/infraestructure/store/authSlice';
import uiReducer from './features/ui/uiSlice';

const reducer = {
  ui: uiReducer,
  auth: authReducer,
};

export const store = configureStore({
  reducer,
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
