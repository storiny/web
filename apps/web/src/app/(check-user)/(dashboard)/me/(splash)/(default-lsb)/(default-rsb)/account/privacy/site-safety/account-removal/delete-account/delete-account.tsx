import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormPasswordInput from "~/components/form-password-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import PasswordIcon from "~/icons/password";
import UserIcon from "~/icons/user";
import { use_delete_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { DeleteAccountProps } from "./delete-account.props";
import {
  DELETE_ACCOUNT_SCHEMA,
  DeleteAccountSchema
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
          name={"current_password"}
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
  const router = use_router();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [deleted, set_deleted] = React.useState<boolean>(false);
  const form = use_form<DeleteAccountSchema>({
    resolver: zod_resolver(DELETE_ACCOUNT_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [delete_account, { isLoading: is_loading }] =
    use_delete_account_mutation();

  const handle_submit: SubmitHandler<DeleteAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      delete_account(values)
        .unwrap()
        .then(() => set_deleted(true))
        .catch((e) => {
          set_deleted(false);
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
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <DeleteAccountModal deleted={deleted} />
    </Form>,
    {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (deleted) {
                router.push(`/logout/?to=${encodeURIComponent("/")}`);
              } else {
                form.handleSubmit(handle_submit)(); // Submit manually
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
