import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import { clsx } from "clsx";
import { Provider, useAtom } from "jotai";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormNewPasswordInput from "~/components/FormNewPasswordInput";
import Link from "~/components/Link";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PasswordIcon from "~/icons/Password";
import {
  useAddPasswordMutation,
  useAddPasswordRequestVerificationMutation
} from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

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
  const [screen, setScreen] = useAtom(addPasswordScreenAtom);
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
            autoSize
            data-testid={"verification-code-input"}
            formSlotProps={{
              formItem: {
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
            autoSize
            data-testid={"new-password-input"}
            formSlotProps={{
              formItem: {
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

const Component = ({ onSubmit }: AddPasswordProps): React.ReactElement => {
  const router = useRouter();
  const toast = useToast();
  const [screen, setScreen] = useAtom(addPasswordScreenAtom);
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<AddPasswordSchema>({
    resolver: zodResolver(addPasswordSchema),
    defaultValues: {
      "verification-code": "",
      "new-password": ""
    }
  });
  const [addPassword, { isLoading: addPasswordLoading }] =
    useAddPasswordMutation();
  const [
    addPasswordRequestVerification,
    { isLoading: requestVerificationLoading }
  ] = useAddPasswordRequestVerificationMutation();

  /**
   * Requests verification code to be dispatched to the user's email
   */
  const requestVerification = (): void => {
    if (isTestEnv()) {
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
    if (onSubmit) {
      onSubmit(values);
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

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        onClick={openModal}
        variant={"hollow"}
      >
        Add a password
      </Button>
    ),
    <Form<AddPasswordSchema>
      className={clsx("flex-col")}
      disabled={addPasswordLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <AddPasswordModal />
    </Form>,
    {
      onOpenChange: screen === "finish" ? (): void => undefined : undefined,
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          {screen !== "finish" && (
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={isSmallerThanMobile}
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
      slotProps: {
        footer: {
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "350px"
          }
        },
        closeButton: {
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
