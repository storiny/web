import { User } from "@storiny/types";

import { AuthStatus } from "~/redux/features";
import { AppState } from "~/redux/store";

export const select_is_logged_in = (state: AppState): boolean =>
  state.auth.logged_in;

export const select_is_private_account = (state: AppState): boolean =>
  Boolean(state.auth.user?.is_private);

export const select_user = (state: AppState): User | null => state.auth.user;

export const select_auth_status = (state: AppState): AuthStatus =>
  state.auth.status;
