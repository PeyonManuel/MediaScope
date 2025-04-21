import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, User } from '@supabase/supabase-js';
import { RootState } from '../../store';

type StatusType = 'idle' | 'authenticated' | 'unauthenticated';
export interface AuthState {
  session: Session | null;
  user: User | null;
  status: StatusType;
  error: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  session: null,
  user:
    localStorage.getItem('user') ?
      JSON.parse(localStorage.getItem('user'))
    : null,
  status: 'unauthenticated',
  error: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
      state.error = null;
      state.status = 'idle';
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.session = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
    logout: (state) => {
      state.session = null;
      state.user = null;
      state.status = 'unauthenticated';
      state.error = null;
    },
  },
});

export const { setUserSession, setAuthLoading, setAuthError, logout } =
  authSlice.actions;

export const selectAuthSession = (state: RootState) => state.auth.session;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === 'authenticated';
export const selectAuthError = (state: RootState) => state.auth.error || '';

export default authSlice.reducer;
