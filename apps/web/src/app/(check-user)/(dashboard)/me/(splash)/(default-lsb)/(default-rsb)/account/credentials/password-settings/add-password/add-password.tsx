import { is_test_env } from "../../../../../../../../../../../../../../packages/shared/src/utils/is-test-env";
import { clsx } from "clsx";
import { Provider, useAtom } from "jotai";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "../../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-input";
import FormNewPasswordInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-new-password-input";
import Link from "../../../../../../../../../../../../../../packages/ui/src/components/link";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import PasswordIcon from "~/icons/Password";
import {
  use_add_password_mutation,
  use_add_password_request_verification_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { AddPasswordProps } from "./add-password.props";
import {
  AddPasswordSchema,
  addPasswordSchema,
  VERIFICATION_CODE_MAX_LENGTH,
  VERIFICATION_CODE_MIN_LENGTH
} from "./add-password.schema";
import { AddPasswordScreen, addPasswordScreenAtom } from "./atom";

const screenToMessageMap: Record<AddPasswordScreen, string> = {
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
  const [screen, setScreen] = use_atom(addPasswordScreenAtom);
  return (
    <React.Fragment>
      <Description asChild>
        <Typography className={"t-minor"} level={"body2"}>
          {screenToMessageMap[screen]}
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
                className: "f-grow"
              }
            }}
            label={"Verification code"}
            maxLength={VERIFICATION_CODE_MAX_LENGTH}
            minLength={VERIFICATION_CODE_MIN_LENGTH}
            name={"verification-code"}
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
                className: "f-grow"
              }
            }}
            label={"Password"}
            name={"new-password"}
            placeholder={"6+ characters"}
            required
          />
          <Spacer orientation={"vertical"} size={3} />
          <Link
            className={"t-center"}
            href={"#"}
            level={"body2"}
            onClick={(): void => setScreen("verification-code")}
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
  const router = useRouter();
  const toast = use_toast();
  const [screen, setScreen] = use_atom(addPasswordScreenAtom);
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<AddPasswordSchema>({
    resolver: zod_resolver(addPasswordSchema),
    defaultValues: {
      "verification-code": "",
      "new-password": ""
    }
  });
  const [addPassword, { isLoading: addPasswordLoading }] =
    use_add_password_mutation();
  const [
    addPasswordRequestVerification,
    { isLoading: requestVerificationLoading }
  ] = use_add_password_request_verification_mutation();

  /**
   * Requests verification code to be dispatched to the user's email
   */
  const requestVerification = (): void => {
    if (is_test_env()) {
      setScreen("verification-code");
    } else {
      addPasswordRequestVerification()
        .unwrap()
        .then(() => setScreen("verification-code"))
        .catch((e) =>
          toast(
            e?.data?.error || "Could not send the verification code",
            "error"
          )
        );
    }
  };

  const handleSubmit: SubmitHandler<AddPasswordSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      addPassword(values)
        .unwrap()
        .then(() => setScreen("finish"))
        .catch((e) =>
          toast(e?.data?.error || "Could not add your password", "error")
        );
    }
  };

  React.useEffect(() => {
    if (form.formState.errors) {
      // Set screen to `verification` to show errors
      if (form.formState.errors["verification-code"]) {
        setScreen("verification-code");
      }
    }
  }, [form.formState.errors, setScreen]);

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Add a password
      </Button>
    ),
    <Form<AddPasswordSchema>
      className={clsx("flex-col")}
      disabled={addPasswordLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <AddPasswordModal />
    </Form>,
    {
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
            loading={requestVerificationLoading || addPasswordLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (screen === "confirmation") {
                requestVerification();
              } else if (screen === "verification-code") {
                setScreen("password");
              } else if (screen === "finish") {
                router.push("/logout");
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
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
