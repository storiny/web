import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import { Provider, useAtom as use_atom } from "jotai";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import FormNewPasswordInput from "~/components/form-new-password-input";
import Link from "~/components/link";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import PasswordIcon from "~/icons/password";
import {
  use_add_password_mutation,
  use_add_password_request_verification_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { AddPasswordProps } from "./add-password.props";
import {
  ADD_PASSWORD_SCHEMA,
  AddPasswordSchema,
  VERIFICATION_CODE_LENGTH
} from "./add-password.schema";
import { add_password_screen_atom, AddPasswordScreen } from "./atom";

const SCREEN_MESSAGE_MAP: Record<AddPasswordScreen, string> = {
  confirmation:
    "We'll need to verify that it's you before you can add a password to your account by sending a confirmation e-mail to the e-mail address associated with your account.",
  "verification-code":
    "Check your inbox for an email that we have just sent with a confirmation code inside. Enter that code here.",
  password:
    "Choose a long and secure password that is at least 6 characters long.",
  finish:
    "Your password has been added. You have been logged out and will need to log in again using your password."
};

const AddPasswordModal = (): React.ReactElement => {
  const [screen, set_screen] = use_atom(add_password_screen_atom);
  return (
    <React.Fragment>
      <Description asChild>
        <Typography className={css["t-minor"]} level={"body2"}>
          {SCREEN_MESSAGE_MAP[screen]}
        </Typography>
      </Description>
      <Spacer
        orientation={"vertical"}
        size={["confirmation", "finish"].includes(screen) ? 2 : 5}
      />
      {screen === "verification-code" ? (
        <React.Fragment>
          <FormInput
            autoFocus
            auto_size
            data-testid={"verification-code-input"}
            form_slot_props={{
              form_item: {
                className: css["f-grow"]
              }
            }}
            label={"Verification code"}
            maxLength={VERIFICATION_CODE_LENGTH}
            name={"verification_code"}
            required
          />
          <Spacer orientation={"vertical"} size={2} />
        </React.Fragment>
      ) : screen === "password" ? (
        <React.Fragment>
          <FormNewPasswordInput
            autoFocus
            auto_size
            data-testid={"new-password-input"}
            form_slot_props={{
              form_item: {
                className: css["f-grow"]
              }
            }}
            label={"Password"}
            name={"new_password"}
            placeholder={"6+ characters"}
            required
          />
          <Spacer orientation={"vertical"} size={3} />
          <Link
            className={css["t-center"]}
            href={"#"}
            level={"body2"}
            onClick={(event): void => {
              event.preventDefault();
              set_screen("verification-code");
            }}
            underline={"always"}
          >
            Change verification code
          </Link>
          <Spacer orientation={"vertical"} size={2} />
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};

const Component = ({ on_submit }: AddPasswordProps): React.ReactElement => {
  const router = use_router();
  const toast = use_toast();
  const [screen, set_screen] = use_atom(add_password_screen_atom);
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<AddPasswordSchema>({
    resolver: zod_resolver(ADD_PASSWORD_SCHEMA),
    defaultValues: {
      verification_code: "",
      new_password: ""
    }
  });
  const [add_password, { isLoading: add_password_loading }] =
    use_add_password_mutation();
  const [
    add_password_request_verification,
    { isLoading: request_verification_loading }
  ] = use_add_password_request_verification_mutation();

  /**
   * Requests verification code to be dispatched to the user's email
   */
  const request_verification = (): void => {
    if (is_test_env()) {
      set_screen("verification-code");
    } else {
      add_password_request_verification()
        .unwrap()
        .then(() => set_screen("verification-code"))
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            form,
            "Could not send the verification code"
          )
        );
    }
  };

  const handle_submit: SubmitHandler<AddPasswordSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      add_password(values)
        .unwrap()
        .then(() => set_screen("finish"))
        .catch((error) =>
          handle_api_error(error, toast, form, "Could not add your password")
        );
    }
  };

  React.useEffect(() => {
    if (form.formState.errors) {
      // Set screen to `verification` to show errors
      if (form.formState.errors["verification_code"]) {
        set_screen("verification-code");
      }
    }
  }, [form.formState.errors, set_screen]);

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        onClick={open_modal}
      >
        Add a password
      </Button>
    ),
    <Form<AddPasswordSchema>
      className={css["flex-col"]}
      disabled={add_password_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <AddPasswordModal />
    </Form>,
    {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      onOpenChange: screen === "finish" ? (): void => undefined : undefined,
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {screen !== "finish" && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={screen === "password" && !form.formState.isDirty}
            loading={request_verification_loading || add_password_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (screen === "confirmation") {
                request_verification();
              } else if (screen === "verification-code") {
                set_screen("password");
              } else if (screen === "finish") {
                router.push("/logout");
              } else {
                form.handleSubmit(handle_submit)(); // Submit manually
              }
            }}
          >
            Continue
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "350px"
          }
        },
        close_button: {
          style: {
            display: screen === "finish" ? "none" : "flex"
          }
        },
        header: {
          decorator: <PasswordIcon />,
          children: "Add a password"
        }
      }
    }
  );

  return element;
};

const AddPassword = (props: AddPasswordProps): React.ReactElement => (
  <Provider>
    <Component {...props} />
  </Provider>
);

export default AddPassword;
