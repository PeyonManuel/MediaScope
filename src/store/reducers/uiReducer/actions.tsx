import { createAction } from '@reduxjs/toolkit';

export const handleDarkMode = createAction('ui/handleDarkMode');
export const handleAccessibilityMode = createAction(
  'ui/handleAccessibilityMode'
);
export const markNotificationAsRead = createAction<string>(
  'ui/markNotificationAsRead'
);
