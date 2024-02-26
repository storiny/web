import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormPasswordInput from "~/components/form-password-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import LinkIcon from "~/icons/link";
import PasswordIcon from "~/icons/password";
import { use_add_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import {
  ACCOUNT_ACTION_SCHEMA,
  AccountActionSchema
} from "../account-action.schema";
import { AddAccountProps } from "./add-account.props";

const AddAccountModal = ({
  vendor
}: Pick<AddAccountProps, "vendor">): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography color={"minor"} level={"body2"}>
        This will add your {vendor} account to your Storiny account, and you
        will be able to sign in to Storiny using your {vendor}
        account.
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

const AddAccount = ({
  on_submit,
  vendor,
  disabled
}: AddAccountProps): React.ReactElement => {
  const toast = use_toast();
  const router = use_app_router();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [done, set_done] = React.useState<boolean>(false);
  const form = use_form<AccountActionSchema>({
    resolver: zod_resolver(ACCOUNT_ACTION_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [add_account, { isLoading: is_loading }] = use_add_account_mutation();

  const handle_submit: SubmitHandler<AccountActionSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      add_account({
        ...values,
        vendor: vendor.toLowerCase() as "google" | "apple"
      })
        .unwrap()
        .then((response) => {
          set_done(true);
          router.push(response.url);
        })
        .catch((error) => {
          set_done(false);
          handle_api_error(
            error,
            toast,
            form,
            `Could not add your ${vendor} account`
          );
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button auto_size check_auth disabled={disabled} onClick={open_modal}>
        Add
      </Button>
    ),
    <Form<AccountActionSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <AddAccountModal vendor={vendor} />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={done}
            variant={"ghost"}
          >
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={done || !form.formState.isDirty}
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
          decorator: <LinkIcon />,
          children: `Add your ${vendor} account`
        }
      }
    }
  );

  return element;
};

export default AddAccount;
