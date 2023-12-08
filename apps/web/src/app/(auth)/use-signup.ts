import { DEFAULT_WPM } from "@storiny/shared";

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

  const handle_signup = (): void => {
    mutate_signup({
      ...state.signup,
      wpm: state.signup.wpm || DEFAULT_WPM
    })
      .unwrap()
      .then(() => actions.switch_segment("email_confirmation"))
      .catch((error) => {
        if (is_form_error(error)) {
          const error_fields = error.errors.map((item) => item[0]);

          if (
            ["email", "name", "password"].some((item) =>
              error_fields.includes(item)
            )
          ) {
            const signup_base_form = state.forms.signup_base;
            handle_api_error(
              error,
              toast,
              signup_base_form,
              "Could not sign you up"
            );

            actions.switch_segment("signup_base");
          } else if (error_fields.includes("username")) {
            const signup_username_form = state.forms.signup_username;
            handle_api_error(
              error,
              toast,
              signup_username_form,
              "Could not sign you up"
            );

            actions.switch_segment("signup_username");
          }
        } else {
          handle_api_error(error, toast, null, "Could not sign you up");
        }
      });
  };

  return { handle_signup, is_loading };
};
