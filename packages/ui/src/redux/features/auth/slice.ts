import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { API_VERSION } from "@storiny/shared";
import { User } from "@storiny/types";

import { AppState } from "~/redux/store";
import { clamp } from "~/utils/clamp";

export type AuthStatus = "idle" | "loading" | "complete" | "error";

export interface AuthState {
  loggedIn: boolean;
  status: AuthStatus;
  user: User | null;
}

export const authInitialState: AuthState = {
  status: "idle",
  loggedIn: false,
  user: null
};

/**
 * Fetch the user object from the server
 */
export const fetchUser = createAsyncThunk<User>(
  "auth/fetchUser",
  async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/me`
    );
    return res.json();
  },
  {
    condition: (_, { getState }) => {
      const {
        auth: { loggedIn, status, user }
      } = getState() as AppState;

      if (!loggedIn || user !== null || status === "loading") {
        // Do not send a request if logged out, a user object is already populated,
        // or the status is `loading`
        return false;
      }
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    /**
     * Mutates the user
     */
    mutateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user !== null) {
        state.user = { ...state.user, ...action.payload };
        return state;
      }
    },
    setSelfFollowerCount: (
      state,
      action: PayloadAction<(prevState: number) => number>
    ) => {
      if (state.user !== null) {
        const callback = action.payload;
        const newValue = callback(state.user.follower_count);
        state.user.follower_count = clamp(0, newValue, Infinity);
      }
    },
    setSelfFollowingCount: (
      state,
      action: PayloadAction<(prevState: number) => number>
    ) => {
      if (
        state.user !== null &&
        typeof state.user?.following_count === "number"
      ) {
        const callback = action.payload;
        const newValue = callback(state.user.following_count);
        state.user.following_count = clamp(0, newValue, Infinity);
      }
    },
    setSelfFriendCount: (
      state,
      action: PayloadAction<(prevState: number) => number>
    ) => {
      if (state.user !== null && typeof state.user?.friend_count === "number") {
        const callback = action.payload;
        const newValue = callback(state.user.friend_count);
        state.user.friend_count = clamp(0, newValue, Infinity);
      }
    }
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
  }
});

const {
  mutateUser,
  setSelfFollowingCount,
  setSelfFollowerCount,
  setSelfFriendCount
} = authSlice.actions;

export {
  mutateUser,
  setSelfFollowerCount,
  setSelfFollowingCount,
  setSelfFriendCount
};

export default authSlice.reducer;
