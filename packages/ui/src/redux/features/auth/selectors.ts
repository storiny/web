import { User } from "@storiny/types";

import { AuthStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

// Predicate

export const selectLoggedIn = (state: AppState): boolean => state.auth.loggedIn;
export const selectIsPrivateAccount = (state: AppState): boolean =>
  Boolean(state.auth.user?.is_private);

// Misc

export const selectUser = (state: AppState): User | null => state.auth.user;
export const selectAuthStatus = (state: AppState): AuthStatus =>
  state.auth.status;
