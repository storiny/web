import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { User } from "@storiny/types";

import { AppState } from "~/redux/store";

export type AuthStatus = "idle" | "loading" | "complete" | "error";

export interface AuthState {
  loggedIn: boolean;
  status: AuthStatus;
  user: User | null;
}

export const authInitialState: AuthState = {
  status: "idle",
  loggedIn: false,
  user: null,
};

/**
 * Fetch the user object from the server
 */
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/me`);
    return res.json();
  },
  {
    condition: (userId, { getState }) => {
      const {
        auth: { loggedIn, status, user },
      } = getState() as AppState;

      if (!loggedIn || user !== null || status === "loading") {
        // Do not send a request if logged out, user object is already populated or status is `loading`
        return false;
      }
    },
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    /**
     * Increments follower count
     */
    incrementSelfFollowerCount: (state) => {
      if (state.user !== null) {
        state.user.follower_count++;
      }
    },
    /**
     * Increments following count
     */
    incrementSelfFollowingCount: (state) => {
      if (
        state.user !== null &&
        typeof state.user?.following_count === "number"
      ) {
        state.user.following_count++;
      }
    },
    /**
     * Increments friend count
     */
    incrementSelfFriendCount: (state) => {
      if (state.user !== null && typeof state.user?.friend_count === "number") {
        state.user.friend_count++;
      }
    },
    /**
     * Decrements follower count
     */
    decrementSelfFollowerCount: (state) => {
      if (state.user !== null && state.user.follower_count > 0) {
        state.user.follower_count--;
      }
    },
    /**
     * Decrements following count
     */
    decrementSelfFollowingCount: (state) => {
      if (
        state.user !== null &&
        typeof state.user?.following_count === "number" &&
        state.user.following_count > 0
      ) {
        state.user.following_count--;
      }
    },
    /**
     * Decrements friend count
     */
    decrementSelfFriendCount: (state) => {
      if (
        state.user !== null &&
        typeof state.user?.friend_count === "number" &&
        state.user.friend_count > 0
      ) {
        state.user.friend_count--;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "complete";
        state.user = action.payload;
      })
      .addCase(fetchUser.pending, (state) => {
        state.user = null;
        state.status = "loading";
      })
      .addCase(fetchUser.rejected, (state) => {
        state.status = "error";
        state.user = null;
      });
  },
});

const {
  incrementSelfFriendCount,
  incrementSelfFollowingCount,
  incrementSelfFollowerCount,
  decrementSelfFriendCount,
  decrementSelfFollowingCount,
  decrementSelfFollowerCount,
} = authSlice.actions;

export {
  decrementSelfFollowerCount,
  decrementSelfFollowingCount,
  decrementSelfFriendCount,
  incrementSelfFollowerCount,
  incrementSelfFollowingCount,
  incrementSelfFriendCount,
};

export default authSlice.reducer;
