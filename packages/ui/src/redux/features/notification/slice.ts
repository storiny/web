import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { NotificationIcon } from "~/components/Notification";

export interface NotificationState {
  icon?: NotificationIcon;
  message: string;
  open: boolean;
  primaryText?: string;
  secondaryText?: string;
}

export const notificationInitialState: NotificationState = {
  open: false,
  message: ""
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState: notificationInitialState,
  reducers: {
    setNotificationOpen: (state, action: PayloadAction<boolean>) => {
      state.open = action.payload;
    },
    renderNotification: (
      state,
      action: PayloadAction<{
        icon?: NotificationIcon;
        message: string;
        primaryText?: string;
        secondaryText?: string;
      }>
    ) => {
      const { message, icon, primaryText, secondaryText } = action.payload;

      state.open = true;
      state.message = message;
      state.icon = icon;
      state.primaryText = primaryText;
      state.secondaryText = secondaryText;
    }
  }
});

const { setNotificationOpen, renderNotification } = notificationSlice.actions;

export { renderNotification, setNotificationOpen };

export default notificationSlice.reducer;
