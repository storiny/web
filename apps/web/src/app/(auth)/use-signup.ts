import { DEFAULT_WPM } from "@storiny/shared";
import { usePostHog as use_posthog } from "posthog-js/react";

import { use_toast } from "~/components/toast";
import { use_signup_mutation } from "~/redux/features";
import { handle_api_error } from "~/utils/handle-api-error";
import { is_form_error } from "~/utils/is-form-error";

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
  const posthog = use_posthog();

  const handle_signup = (): void => {
    mutate_signup({
      ...state.signup,
      wpm: state.signup.wpm || DEFAULT_WPM
    })
      .unwrap()
      .then(() => {
        actions.set_signup_errors({
          base: undefined,
          username: undefined,
          wpm_manual: undefined
        });

        if (posthog) {
          posthog.capture("Signup", {
            username: state.signup.username,
            email: state.signup.email,
            name: state.signup.name,
            wpm: state.signup.wpm || DEFAULT_WPM
          });
        }

        actions.switch_segment("email_confirmation");
      })
      .catch((error) => {
        if (is_form_error(error)) {
          const error_fields = error.data?.errors.map((item) => item[0]);

          if (
            ["email", "name", "password"].some((item) =>
              error_fields.includes(item)
            )
          ) {
            actions.set_signup_errors({
              base: error
            });

            actions.switch_segment("signup_base");
          } else if (error_fields.includes("username")) {
            actions.set_signup_errors({
              username: error
            });

            actions.switch_segment("signup_username");
          } else if (error_fields.includes("wpm")) {
            actions.set_signup_errors({
              wpm_manual: error
            });

            actions.switch_segment("wpm_manual");
          }
        } else {
          handle_api_error(error, toast, null, "Could not sign you up");
        }
      });
  };

  return { handle_signup, is_loading };
};
