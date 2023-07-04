import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Notification } from "@storiny/types";

import {
  changeEntityValue,
  selectReadNotification,
  toggleEntityValue
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";
import { AppState } from "~/redux/store";

export type UnreadNotificationsStatus =
  | "idle"
  | "loading"
  | "complete"
  | "error";

export interface NotificationsState {
  readNotifications: Record<string, boolean>;
  status: UnreadNotificationsStatus;
  unreadCount: number;
}

type SyncableNotification = Pick<Notification, "id" | "read_at">;

/**
 * Fetch unread notifications count from the server
 */
export const fetchUnreadNotificationsCount = createAsyncThunk(
  "notifications/fetchUnreadNotificationsCount",
  async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/me/unread-notifications`
    );
    return res.json();
  },
  {
    condition: (_, { getState }) => {
      const {
        auth: { loggedIn, status: authStatus },
        notifications: { status: notificationsStatus }
      } = getState() as AppState;

      if (
        !loggedIn ||
        authStatus === "loading" ||
        notificationsStatus === "loading"
      ) {
        // Do not send a request if logged out or status is `loading`
        return false;
      }
    }
  }
);

export const notificationsInitialState: NotificationsState = {
  readNotifications: {},
  unreadCount: 0,
  status: "idle"
};

/**
 * Sync incoming notification to the store
 * @param state App state
 * @param notification Incoming notification
 */
const syncWithNotificationImpl = (
  state: NotificationsState,
  notification: SyncableNotification
): void => {
  if (typeof notification.read_at !== "undefined") {
    state.readNotifications[notification.id] = Boolean(notification.read_at);
  }
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: notificationsInitialState,
  reducers: {
    // Predicate
    toggleReadNotification:
      toggleEntityValue<NotificationsState>("readNotifications"),
    // Integral
    decrementUnreadNotificationCount: changeEntityValue<NotificationsState>(
      "unreadCount",
      "decrement"
    ),
    // Syncing
    syncWithNotification: (
      state,
      action: PayloadAction<SyncableNotification>
    ) => syncWithNotificationImpl(state, action.payload),
    // Misc
    markAllAsRead: (state) => {
      Object.keys(state.readNotifications).forEach((id) => {
        state.readNotifications[id] = true;
      });

      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadNotificationsCount.fulfilled, (state, action) => {
        state.status = "complete";
        state.unreadCount = action.payload || 0;
      })
      .addCase(fetchUnreadNotificationsCount.pending, (state) => {
        state.unreadCount = 0;
        state.status = "loading";
      })
      .addCase(fetchUnreadNotificationsCount.rejected, (state) => {
        state.status = "error";
        state.unreadCount = 0;
      });
  }
});

const {
  markAllAsRead,
  toggleReadNotification,
  syncWithNotification,
  decrementUnreadNotificationCount
} = notificationsSlice.actions;

export const addNotificationsListeners = (
  startListening: AppStartListening
): void => {
  /**
   * Decrement unread notification count
   */
  startListening({
    actionCreator: toggleReadNotification,
    effect: ({ payload }, listenerApi) => {
      const isRead = selectReadNotification(payload)(listenerApi.getState());

      if (!isRead) {
        listenerApi.dispatch(decrementUnreadNotificationCount(payload));
      }
    }
  });
};

export {
  decrementUnreadNotificationCount,
  markAllAsRead,
  syncWithNotification,
  toggleReadNotification
};

export default notificationsSlice.reducer;
