import {
  createAsyncThunk as create_async_thunk,
  createSlice as create_slice,
  PayloadAction
} from "@reduxjs/toolkit";
import { API_VERSION } from "@storiny/shared";
import { User } from "@storiny/types";

import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

export type AuthStatus = "idle" | "loading" | "complete" | "error";

type NumberActionPayload = "increment" | "decrement" | number;

export interface AuthState {
  logged_in: boolean;
  status: AuthStatus;
  user: User | null;
}

export const auth_initial_state: AuthState = {
  status: /*   */ "idle",
  logged_in: /**/ false,
  user: /*     */ null
};

/**
 * Fetch the user object from the server
 */
export const fetch_user = create_async_thunk<User>(
  "auth/fetch_user",
  async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/me`
    );
    return res.json();
  },
  {
    condition: (_, { getState: get_state }) => {
      const {
        auth: { logged_in, user, status }
      } = get_state() as AppState;

      // TODO: Should we send the request even if the user object is present in the cache? It currently breaks the purpose of refreshing the user (in `<Initializer />`) as no requests are sent to the server.
      if (!logged_in || status === "loading" || user !== null) {
        // Do not send a request if logged out or the status is `loading`
        return false;
      }
    }
  }
);

/**
 * Computes the next number value based on the supplied action payload and the previous state
 * @param supplied_value Supplied value
 * @param prev_value Previous value
 */
const get_next_value = (
  supplied_value: NumberActionPayload,
  prev_value: number
): number =>
  supplied_value === "increment"
    ? prev_value + 1
    : supplied_value === "decrement"
    ? prev_value - 1
    : supplied_value;

export const auth_slice = create_slice({
  name: "auth",
  initialState: auth_initial_state,
  reducers: {
    /**
     * Mutates the user
     */
    mutate_user: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user !== null) {
        state.user = { ...state.user, ...action.payload };
        return state;
      }
    },
    set_self_follower_count: (
      state,
      action: PayloadAction<NumberActionPayload>
    ) => {
      if (state.user !== null) {
        const value = action.payload;
        const prev_value = state.user.follower_count;
        const next_value = get_next_value(value, prev_value);
        state.user.follower_count = clamp(0, next_value, Infinity);
      }
    },
    set_self_following_count: (
      state,
      action: PayloadAction<NumberActionPayload>
    ) => {
      if (
        state.user !== null &&
        typeof state.user?.following_count === "number"
      ) {
        const value = action.payload;
        const prev_value = state.user.following_count;
        const next_value = get_next_value(value, prev_value);
        state.user.following_count = clamp(0, next_value, Infinity);
      }
    },
    set_self_friend_count: (
      state,
      action: PayloadAction<NumberActionPayload>
    ) => {
      if (state.user !== null && typeof state.user?.friend_count === "number") {
        const value = action.payload;
        const prev_value = state.user.friend_count;
        const next_value = get_next_value(value, prev_value);
        state.user.friend_count = clamp(0, next_value, Infinity);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetch_user.fulfilled, (state, action) => {
        state.status = "complete";
        state.user = action.payload;
      })
      .addCase(fetch_user.pending, (state) => {
        if (state.user === null) {
          state.status = "loading";
        }
      })
      .addCase(fetch_user.rejected, (state) => {
        state.status = "error";
        state.user = null;
      });
  }
});

const {
  mutate_user,
  set_self_following_count,
  set_self_follower_count,
  set_self_friend_count
} = auth_slice.actions;

export {
  mutate_user,
  set_self_follower_count,
  set_self_following_count,
  set_self_friend_count
};

export default auth_slice.reducer;
