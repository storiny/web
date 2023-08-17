import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormNewPasswordInput from "~/components/FormNewPasswordInput";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PasswordIcon from "~/icons/Password";
import { useUpdatePasswordMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { UpdatePasswordProps } from "./update-password.props";
import {
  UpdatePasswordSchema,
  updatePasswordSchema
} from "./update-password.schema";

const UpdatePasswordModal = ({
  updated
}: {
  updated?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        {updated
          ? "Your password has been updated. You have been logged out and will need to log in again using your new password."
          : "Enter a new password that is at least 6 characters long, along with your current password."}
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={updated ? 2 : 5} />
    {!updated && (
      <React.Fragment>
        <FormPasswordInput
          autoFocus
          autoSize
          data-testid={"current-password-input"}
          formSlotProps={{
            formItem: {
              className: "f-grow"
            }
          }}
          label={"Current password"}
          name={"current-password"}
          placeholder={"Your current password"}
          required
        />
        <Spacer orientation={"vertical"} size={3} />
        <FormNewPasswordInput
          autoSize
          data-testid={"new-password-input"}
          formSlotProps={{
            formItem: {
              className: "f-grow"
            }
          }}
          label={"New password"}
          name={"new-password"}
          placeholder={"6+ characters"}
          required
        />
        <Spacer orientation={"vertical"} size={2} />
      </React.Fragment>
    )}
  </React.Fragment>
);

const UpdatePassword = ({
  onSubmit
}: UpdatePasswordProps): React.ReactElement => {
  const router = useRouter();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = useForm<UpdatePasswordSchema>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      "current-password": "",
      "new-password": ""
    }
  });
  const [updatePassword, { isLoading }] = useUpdatePasswordMutation();

  const handleSubmit: SubmitHandler<UpdatePasswordSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      updatePassword(values)
        .unwrap()
        .then(() => setUpdated(true))
        .catch((e) => {
          setUpdated(false);
          toast(e?.data?.error || "Could not update your password", "error");
        });
    }
  };

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        onClick={openModal}
        variant={"hollow"}
      >
        Update password
      </Button>
    ),
    <Form<UpdatePasswordSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <UpdatePasswordModal updated={updated} />
    </Form>,
    {
      onOpenChange: updated ? (): void => undefined : undefined,
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          {!updated && (
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={isSmallerThanMobile}
            disabled={!updated && !form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (updated) {
                router.push("/logout");
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
              }
            }}
          >
            {updated ? "Continue" : "Confirm"}
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
            display: updated ? "none" : "flex"
          }
        },
        header: {
          decorator: <PasswordIcon />,
          children: "Update your password"
        }
      }
    }
  );

  return element;
};

export default UpdatePassword;
