"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_debounce } from "~/hooks/use-debounce";
import { use_username_validation_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../actions";
import { SIGNUP_USERNAME_SCHEMA, SignupUsernameSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupUsernameSchema>;
  // Skip username validation for tests
  skip_validation?: boolean;
}

const UsernameField = ({
  set_valid
}: {
  set_valid: (next_value: boolean) => void;
}): React.ReactElement => {
  const mounted = React.useRef<boolean>(false);
  const { state } = use_auth_state();
  const { watch, getFieldState: get_field_state } = use_form_context();
  const { invalid } = get_field_state("username");
  const [
    validate_username,
    { isLoading: is_loading, isError: is_error, isSuccess: is_success }
  ] = use_username_validation_mutation();
  const username = watch("username", state.signup.username);
  const debounced_username = use_debounce(username);
  const loading =
    username.length >= USER_PROPS.username.min_length &&
    (is_loading || username !== debounced_username);

  React.useEffect(() => {
    if (
      !invalid &&
      debounced_username.length >= USER_PROPS.username.min_length &&
      // Skip fetching when switching between segments
      mounted.current
    ) {
      validate_username({ username: debounced_username });
    }
  }, [validate_username, debounced_username, invalid]);

  React.useEffect(
    () =>
      set_valid(
        username.length < USER_PROPS.username.min_length
          ? true
          : loading
          ? false
          : !!is_success
      ),
    [is_success, loading, set_valid, username.length]
  );

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <FormInput
      autoComplete={"username"}
      color={
        invalid ||
        (username.length >= USER_PROPS.username.min_length &&
          is_error &&
          !loading)
          ? "ruby"
          : "inverted"
      }
      data-testid={"username-input"}
      form_slot_props={{
        helper_text: {
          style: {
            color: loading
              ? "var(--fg-minor)"
              : is_success
              ? "var(--melon-100)"
              : "var(--ruby-500)"
          } as React.CSSProperties
        }
      }}
      helper_text={
        invalid ||
        username.length < USER_PROPS.username.min_length ? undefined : (
          <span className={css["flex"]} style={{ alignItems: "center" }}>
            {loading ? (
              <>
                <Spinner size={"xs"} />
                <Spacer size={0.75} />
                <span>Checking availability...</span>
              </>
            ) : is_success ? (
              "This username is available"
            ) : (
              "This username is not available"
            )}
          </span>
        )
      }
      label={"Username"}
      maxLength={USER_PROPS.username.max_length}
      minLength={USER_PROPS.username.min_length}
      name={"username"}
      required
      size={"lg"}
    />
  );
};

const SignupUsernameForm = ({
  on_submit,
  skip_validation
}: Props): React.ReactElement => {
  const { state } = use_auth_state();
  const form = use_form<SignupUsernameSchema>({
    resolver: zod_resolver(SIGNUP_USERNAME_SCHEMA),
    defaultValues: {
      username: state.signup.username
    }
  });
  const [valid, set_valid] = React.useState<boolean>(false);

  const set_valid_impl = React.useCallback(
    (next_value: boolean) => set_valid(next_value),
    []
  );

  const handle_submit: SubmitHandler<SignupUsernameSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    }
  };

  return (
    <Form<SignupUsernameSchema>
      className={clsx(css["flex-col"], css["full-h"])}
      on_submit={handle_submit}
      provider_props={form}
    >
      <UsernameField set_valid={set_valid_impl} />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button
          className={css["full-w"]}
          size={"lg"}
          type={"submit"}
          {...(!skip_validation && { disabled: !valid })}
        >
          Continue
        </Button>
      </div>
    </Form>
  );
};

export default SignupUsernameForm;
