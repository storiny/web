import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "../../../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormPasswordInput from "../../../../../../../../../../../../../../../packages/ui/src/components/form-password-input";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import PasswordIcon from "../../../../../../../../../../../../../../../packages/ui/src/icons/password";
import UserIcon from "../../../../../../../../../../../../../../../packages/ui/src/icons/user";
import { use_delete_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
          auto_size
          data-testid={"current-password-input"}
          decorator={<PasswordIcon />}
          form_slot_props={{
            form_item: {
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
  on_submit
}: DeleteAccountProps): React.ReactElement => {
  const router = useRouter();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [deleted, setDeleted] = React.useState<boolean>(false);
  const form = use_form<DeleteAccountSchema>({
    resolver: zod_resolver(deleteAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [deleteAccount, { isLoading }] = use_delete_account_mutation();

  const handleSubmit: SubmitHandler<DeleteAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
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

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        color={"ruby"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Delete account
      </Button>
    ),
    <Form<DeleteAccountSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <DeleteAccountModal deleted={deleted} />
    </Form>,
    {
      onOpenChange: deleted ? (): void => undefined : undefined,
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {!deleted && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            color={deleted ? "inverted" : "ruby"}
            compact={is_smaller_than_mobile}
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
