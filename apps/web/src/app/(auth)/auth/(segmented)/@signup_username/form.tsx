"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../packages/ui/src/components/form-input";
import Grow from "../../../../../../../../packages/ui/src/components/grow";
import Spacer from "../../../../../../../../packages/ui/src/components/spacer";
import Spinner from "../../../../../../../../packages/ui/src/components/spinner";
import { use_debounce } from "../../../../../../../../packages/ui/src/hooks/use-debounce";
import { use_username_validation_mutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { SignupUsernameSchema, signupUsernameSchema } from "./schema";

interface Props {
  on_submit?: SubmitHandler<SignupUsernameSchema>;
  // Skip username validation for tests
  skipValidation?: boolean;
}

const UsernameField = ({
  setValid
}: {
  setValid: (newValue: boolean) => void;
}): React.ReactElement => {
  const mounted = React.useRef<boolean>(false);
  const { state } = useAuthState();
  const { watch, getFieldState } = use_form_context();
  const { invalid } = getFieldState("username");
  const [validateUsername, { isLoading, isError, isSuccess }] =
    use_username_validation_mutation();
  const username = watch("username", state.signup.username);
  const debouncedUsername = use_debounce(username);
  const loading =
    username.length >= userProps.username.minLength &&
    (isLoading || username !== debouncedUsername);

  React.useEffect(() => {
    if (
      !invalid &&
      debouncedUsername.length >= userProps.username.minLength &&
      // Skip fetching when switching between segments
      mounted.current
    ) {
      validateUsername({ username: debouncedUsername });
    }
  }, [validateUsername, debouncedUsername, invalid]);

  React.useEffect(
    () =>
      setValid(
        username.length < userProps.username.minLength
          ? true
          : loading
          ? false
          : !!isSuccess
      ),
    [isSuccess, loading, setValid, username.length]
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
        (username.length >= userProps.username.minLength && isError && !loading)
          ? "ruby"
          : "inverted"
      }
      data-testid={"username-input"}
      form_slot_props={{
        helper_text: {
          style: {
            color: loading
              ? "var(--fg-minor)"
              : isSuccess
              ? "var(--melon-100)"
              : "var(--ruby-500)"
          } as React.CSSProperties
        }
      }}
      helper_text={
        invalid ||
        username.length < userProps.username.minLength ? undefined : (
          <span className={"flex"} style={{ alignItems: "center" }}>
            {loading ? (
              <>
                <Spinner size={"xs"} />
                <Spacer size={0.75} />
                <span>Checking availability...</span>
              </>
            ) : isSuccess ? (
              "This username is available"
            ) : (
              "This username is not available"
            )}
          </span>
        )
      }
      label={"Username"}
      maxLength={userProps.username.maxLength}
      minLength={userProps.username.minLength}
      name={"username"}
      required
      size={"lg"}
    />
  );
};

const SignupUsernameForm = ({
  on_submit,
  skipValidation
}: Props): React.ReactElement => {
  const { state } = useAuthState();
  const form = use_form<SignupUsernameSchema>({
    resolver: zod_resolver(signupUsernameSchema),
    defaultValues: {
      username: state.signup.username
    }
  });
  const [valid, setValid] = React.useState<boolean>(false);

  const setValidImpl = React.useCallback(
    (newValue: boolean) => setValid(newValue),
    []
  );

  const handleSubmit: SubmitHandler<SignupUsernameSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    }
  };

  return (
    <Form<SignupUsernameSchema>
      className={clsx("flex-col", "full-h")}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <UsernameField setValid={setValidImpl} />
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={clsx("flex-col", "flex-center")}>
        <Button
          className={"full-w"}
          size={"lg"}
          type={"submit"}
          {...(!skipValidation && { disabled: !valid })}
        >
          Continue
        </Button>
      </div>
    </Form>
  );
};

export default SignupUsernameForm;
