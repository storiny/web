import { DEFAULT_WPM } from "@storiny/shared";

import { use_signup_mutation } from "~/redux/features";

import { use_toast } from "../../../../../packages/ui/src/components/toast";
import { use_auth_state } from "./actions";

/**
 * Handles signup network logic
 */
export const use_signup = (): {
  handle_signup: () => void;
  is_loading: boolean;
} => {
  const { state, actions } = use_auth_state();
  const [mutate_signup, { isLoading: is_loading }] = use_signup_mutation();
  const toast = use_toast();

  const handle_signup = (): void => {
    mutate_signup({
      ...state.signup,
      wpm: state.signup.wpm || DEFAULT_WPM
    })
      .unwrap()
      .then(() => actions.switch_segment("email_confirmation"))
      .catch((e) => toast(e?.data?.error || "Could not sign you up", "error"));
  };

  return { handle_signup, is_loading };
};
