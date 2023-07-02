"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, {
  SubmitHandler,
  useForm,
  useFormContext,
  zodResolver
} from "~/components/Form";
import FormInput from "~/components/FormInput";
import Grow from "~/components/Grow";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import { useDebounce } from "~/hooks/useDebounce";
import { useUsernameValidationMutation } from "~/redux/features";

import { useAuthState } from "../../../actions";
import { SignupUsernameSchema, signupUsernameSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<SignupUsernameSchema>;
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
  const { watch, getFieldState } = useFormContext();
  const { invalid } = getFieldState("username");
  const [validateUsername, { isLoading, isError, isSuccess }] =
    useUsernameValidationMutation();
  const username = watch("username", state.signup.username);
  const debouncedUsername = useDebounce(username);
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
      formSlotProps={{
        helperText: {
          style: {
            color: loading
              ? "var(--fg-minor)"
              : isSuccess
              ? "var(--melon-100)"
              : "var(--ruby-500)"
          } as React.CSSProperties
        }
      }}
      helperText={
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
      type={"text"}
    />
  );
};

const SignupUsernameForm = ({
  onSubmit,
  skipValidation
}: Props): React.ReactElement => {
  const { state } = useAuthState();
  const form = useForm<SignupUsernameSchema>({
    resolver: zodResolver(signupUsernameSchema),
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
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form<SignupUsernameSchema>
      className={clsx("flex-col", "full-h")}
      onSubmit={handleSubmit}
      providerProps={form}
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
