import { DEFAULT_WPM } from "@storiny/shared";

import { useToast } from "~/components/Toast";
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
  const toast = useToast();

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
