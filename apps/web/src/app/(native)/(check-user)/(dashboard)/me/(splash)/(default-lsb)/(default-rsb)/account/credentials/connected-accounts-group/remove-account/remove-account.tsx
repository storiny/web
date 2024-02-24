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
import UnlinkIcon from "~/icons/unlink";
import { use_remove_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import {
  ACCOUNT_ACTION_SCHEMA,
  AccountActionSchema
} from "../account-action.schema";
import { RemoveAccountProps } from "./remove-account.props";

const RemoveAccountModal = ({
  vendor
}: Pick<RemoveAccountProps, "vendor">): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
        This will remove your {vendor} account from your Storiny account, and
        you will no longer be able to sign in to Storiny with your {vendor}
        account unless you add it again.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormPasswordInput
      auto_size
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      form_slot_props={{
        form_item: {
          className: css["f-grow"]
        }
      }}
      label={"Password"}
      name={"current_password"}
      placeholder={"Your password"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const RemoveAccount = ({
  on_submit,
  vendor,
  on_remove
}: RemoveAccountProps): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<AccountActionSchema>({
    resolver: zod_resolver(ACCOUNT_ACTION_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [remove_account, { isLoading: is_loading }] =
    use_remove_account_mutation();

  const handle_submit: SubmitHandler<AccountActionSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      remove_account({
        ...values,
        vendor: vendor.toLowerCase() as "google" | "apple"
      })
        .unwrap()
        .then(() => {
          close_modal();
          toast(`Removed your ${vendor} account`, "success");
          on_remove();
        })
        .catch((error) => {
          handle_api_error(
            error,
            toast,
            form,
            `Could not remove your ${vendor} account`
          );
        });
    }
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        color={"ruby"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Remove
      </Button>
    ),
    <Form<AccountActionSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <RemoveAccountModal vendor={vendor} />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            color={"ruby"}
            compact={is_smaller_than_mobile}
            disabled={!form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Confirm
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
        header: {
          decorator: <UnlinkIcon />,
          children: `Remove your ${vendor} account`
        }
      }
    }
  );

  return element;
};

export default RemoveAccount;
