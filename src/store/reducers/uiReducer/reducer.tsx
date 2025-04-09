interface Notification {
  id: string;
  heading: string;
  content: string;
  read: boolean;
}

interface UIInitialState {
  darkMode: boolean;
  accessibilityMode: boolean;
  notifications: Notification[];
}

const initialState: UIInitialState = {
  darkMode: false,
  accessibilityMode: false,
  notifications: [],
};
