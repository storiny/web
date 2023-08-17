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
import { useDeleteAccountMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { DeleteAccountProps } from "./delete-account.props";
import {
  DeleteAccountSchema,
  deleteAccountSchema
} from "./delete-account.schema";

const DeleteAccountModal = ({
  deleted
}: {
  deleted?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        {deleted
          ? "Your account has been deleted and you have been logged out."
          : "To delete your account, you need to confirm your password. If you change your mind, you can recover your account by logging back in within 30 days of the deletion request."}
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={deleted ? 2 : 5} />
    {!deleted && (
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

const DeleteAccount = ({
  onSubmit
}: DeleteAccountProps): React.ReactElement => {
  const router = useRouter();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [deleted, setDeleted] = React.useState<boolean>(false);
  const form = useForm<DeleteAccountSchema>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();

  const handleSubmit: SubmitHandler<DeleteAccountSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      deleteAccount(values)
        .unwrap()
        .then(() => setDeleted(true))
        .catch((e) => {
          setDeleted(false);
          toast(e?.data?.error || "Could not delete your account", "error");
        });
    }
  };

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        color={"ruby"}
        onClick={openModal}
        variant={"hollow"}
      >
        Delete account
      </Button>
    ),
    <Form<DeleteAccountSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <DeleteAccountModal deleted={deleted} />
    </Form>,
    {
      onOpenChange: deleted ? (): void => undefined : undefined,
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          {!deleted && (
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            color={deleted ? "inverted" : "ruby"}
            compact={isSmallerThanMobile}
            disabled={!deleted && !form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (deleted) {
                router.push(`/logout/?to=${encodeURIComponent("/")}`);
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
              }
            }}
          >
            {deleted ? "Continue" : "Confirm"}
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
            display: deleted ? "none" : "flex"
          }
        },
        header: {
          decorator: <UserIcon />,
          children: "Delete your account"
        }
      }
    }
  );

  return element;
};

export default DeleteAccount;
