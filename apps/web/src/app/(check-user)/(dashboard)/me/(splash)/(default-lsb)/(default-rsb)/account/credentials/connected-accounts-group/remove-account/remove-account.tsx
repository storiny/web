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

import { RemoveAccountProps } from "./remove-account.props";
import {
  REMOVE_ACCOUNT_SCHEMA,
  RemoveAccountSchema
} from "./remove-account.schema";

const RemoveAccountModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
        This will disconnect your Apple account from your Storiny account, and
        you will no longer be able to sign in to Storiny with your Apple account
        unless you connect it again.
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
  const [updated, set_updated] = React.useState<boolean>(false);
  const form = use_form<RemoveAccountSchema>({
    resolver: zod_resolver(REMOVE_ACCOUNT_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [remove_account, { isLoading: is_loading }] =
    use_remove_account_mutation();

  const handle_submit: SubmitHandler<RemoveAccountSchema> = (values) => {
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
          set_updated(false);

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
        Disconnect
      </Button>
    ),
    <Form<RemoveAccountSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <RemoveAccountModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
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
        close_button: {
          style: {
            display: updated ? "none" : "flex"
          }
        },
        header: {
          decorator: <UnlinkIcon />,
          children: `Disconnect ${vendor}`
        }
      }
    }
  );

  return element;
};

export default RemoveAccount;
