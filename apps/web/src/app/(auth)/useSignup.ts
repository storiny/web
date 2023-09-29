import { DEFAULT_WPM } from "@storiny/shared";

import { use_toast } from "../../../../../packages/ui/src/components/toast";
import { use_signup_mutation } from "~/redux/features";

import { useAuthState } from "./actions";

/**
 * Handles signup network logic
 */
export const useSignup = (): {
  handleSignup: () => void;
  isLoading: boolean;
} => {
  const { state, actions } = useAuthState();
  const [mutateSignup, { isLoading }] = use_signup_mutation();
  const toast = use_toast();

  const handleSignup = (): void => {
    mutateSignup({
      ...state.signup,
      wpm: state.signup.wpm || DEFAULT_WPM
    })
      .unwrap()
      .then(() => actions.switchSegment("email_confirmation"))
      .catch((e) => toast(e?.data?.error || "Could not sign you up", "error"));
  };

  return { handleSignup, isLoading };
};
