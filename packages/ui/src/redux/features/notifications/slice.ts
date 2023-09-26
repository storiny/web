import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { API_VERSION } from "@storiny/shared";
import { Notification } from "@storiny/types";

import { AppStartListening } from "~/redux/listenerMiddleware";
import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

export type UnreadNotificationsStatus =
  | "idle"
  | "loading"
  | "complete"
  | "error";

export interface NotificationsState {
  read_notifications: Record<string, boolean>;
  status: UnreadNotificationsStatus;
  unread_count: number;
}

type SyncableNotification = Pick<Notification, "id" | "read_at">;

/**
 * Fetch unread notifications count from the server
 */
export const fetchUnreadNotificationsCount = createAsyncThunk(
  "notifications/fetchUnreadNotificationsCount",
  async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/me/unread-notifications`
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

export const notifications_initial_state: NotificationsState = {
  read_notifications: /**/ {},
  unread_count: /*      */ 0,
  status: /*            */ "idle"
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
    state.read_notifications[notification.id] = Boolean(notification.read_at);
  }
};

export const notifications_slice = createSlice({
  name: "notifications",
  initialState: notifications_initial_state,
  reducers: {
    set_read_notification: (
      state,
      action: PayloadAction<[string, boolean]>
    ) => {
      const [notification_id, value] = action.payload;
      state.read_notifications[notification_id] = value;
    },
    decrement_unread_notification_count: (state) => {
      state.unread_count = clamp(0, state.unread_count--, Infinity);
    },
    // Syncing
    syncWithNotification: (
      state,
      action: PayloadAction<SyncableNotification>
    ) => syncWithNotificationImpl(state, action.payload),
    // Misc
    markAllAsRead: (state) => {
      Object.keys(state.read_notifications).forEach((id) => {
        state.read_notifications[id] = true;
      });

      state.unread_count = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadNotificationsCount.fulfilled, (state, action) => {
        state.status = "complete";
        state.unread_count = action.payload || 0;
      })
      .addCase(fetchUnreadNotificationsCount.pending, (state) => {
        state.unread_count = 0;
        state.status = "loading";
      })
      .addCase(fetchUnreadNotificationsCount.rejected, (state) => {
        state.status = "error";
        state.unread_count = 0;
      });
  }
});

const {
  decrement_unread_notification_count,
  set_read_notification,
  markAllAsRead,
  syncWithNotification
} = notifications_slice.actions;

export const add_notifications_listeners = (
  start_listening: AppStartListening
): void => {
  /**
   * Decrement unread notification count
   */
  start_listening({
    actionCreator: set_read_notification,
    effect: ({ payload }, listener_api) => {
      const [, has_read] = payload;
      if (has_read) {
        listener_api.dispatch(decrement_unread_notification_count());
      }
    }
  });
};

export {
  decrement_unread_notification_count,
  markAllAsRead,
  set_read_notification,
  syncWithNotification
};

export default notifications_slice.reducer;
