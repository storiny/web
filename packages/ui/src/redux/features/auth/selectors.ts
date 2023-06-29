import { User } from "@storiny/types";

import { AuthStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

export const selectLoggedIn = (state: AppState): boolean => state.auth.loggedIn;
export const selectUser = (state: AppState): User | null => state.auth.user;
export const selectAuthStatus = (state: AppState): AuthStatus =>
  state.auth.status;
