import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';

type NotificationType = 'info' | 'success' | 'warning' | 'error';
interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  duration?: number;
}
type Theme = 'light' | 'dark';
export interface UiState {
  theme: Theme;
  notifications: Notification[];
}

const getStoredTheme = () => {
  const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  return storedTheme ? storedTheme : 'dark'; // default
};

const initialState: UiState = {
  theme: getStoredTheme(),
  notifications: [],
};

const uiSlice = createSlice({
  name: 'slice',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      // Optional: Persist theme choice to localStorage
      localStorage.setItem('theme', action.payload);
    },
    setNotifications: (state, action: PayloadAction<Notification[] | null>) => {
      state.notifications = action.payload || [];
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications = [...state.notifications, action.payload];
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (noti) => noti.id !== action.payload
      );
    },
  },
});

export const {
  setTheme,
  setNotifications,
  addNotification,
  removeNotification,
} = uiSlice.actions;

export const selectTheme = (state: RootState) => state.ui.theme;
export const selectNotifications = (state: RootState) => state.ui.notifications;

export default uiSlice.reducer;
