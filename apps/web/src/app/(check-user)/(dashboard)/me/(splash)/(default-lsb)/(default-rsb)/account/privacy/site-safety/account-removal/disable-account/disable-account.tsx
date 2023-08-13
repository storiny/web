import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PasswordIcon from "~/icons/Password";
import UserIcon from "~/icons/User";
import { useDisableAccountMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { DisableAccountProps } from "./disable-account.props";
import {
  DisableAccountSchema,
  disableAccountSchema
} from "./disable-account.schema";

const DisableAccountModal = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        {disabled
          ? "Your account has been disabled and you have been logged out."
          : "You need to confirm your password to temporarily disable your account. You can log back in at any time to re-enable your account."}
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={disabled ? 2 : 5} />
    {!disabled && (
      <React.Fragment>
        <FormPasswordInput
          autoSize
          data-testid={"current-password-input"}
          decorator={<PasswordIcon />}
          formSlotProps={{
            formItem: {
              className: "f-grow"
            }
          }}
          label={"Password"}
          name={"current-password"}
          placeholder={"Your password"}
          required
        />
        <Spacer orientation={"vertical"} size={2} />
      </React.Fragment>
    )}
  </React.Fragment>
);

const DisableAccount = ({
  onSubmit
}: DisableAccountProps): React.ReactElement => {
  const router = useRouter();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [disabled, setDisabled] = React.useState<boolean>(false);
  const form = useForm<DisableAccountSchema>({
    resolver: zodResolver(disableAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [disableAccount, { isLoading }] = useDisableAccountMutation();

  const handleSubmit: SubmitHandler<DisableAccountSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      disableAccount(values)
        .unwrap()
        .then(() => setDisabled(true))
        .catch((e) => {
          setDisabled(false);
          toast(e?.data?.error || "Could not disable your account", "error");
        });
    }
  };

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        className={"fit-w"}
        color={"ruby"}
        onClick={openModal}
        variant={"hollow"}
      >
        Temporarily disable account
      </Button>
    ),
    <Form<DisableAccountSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <DisableAccountModal disabled={disabled} />
    </Form>,
    {
      onOpenChange: disabled ? (): void => undefined : undefined,
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          {!disabled && (
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            color={disabled ? "inverted" : "ruby"}
            compact={isSmallerThanMobile}
            disabled={!disabled && !form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (disabled) {
                router.push(`/logout/?to=${encodeURIComponent("/")}`);
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
              }
            }}
          >
            {disabled ? "Continue" : "Confirm"}
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
            display: disabled ? "none" : "flex"
          }
        },
        header: {
          decorator: <UserIcon />,
          children: "Disable your account"
        }
      }
    }
  );

  return element;
};

export default DisableAccount;
