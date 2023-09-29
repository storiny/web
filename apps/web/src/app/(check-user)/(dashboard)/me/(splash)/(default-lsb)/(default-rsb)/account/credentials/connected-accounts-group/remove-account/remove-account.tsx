import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormPasswordInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-password-input";
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
import UnlinkIcon from "~/icons/Unlink";
import { use_remove_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { RemoveAccountProps } from "./remove-account.props";
import {
  RemoveAccountSchema,
  removeAccountSchema
} from "./remove-account.schema";

const RemoveAccountModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
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
);

const RemoveAccount = ({
  on_submit,
  vendor,
  onRemove
}: RemoveAccountProps): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = use_form<RemoveAccountSchema>({
    resolver: zod_resolver(removeAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [removeAccount, { isLoading }] = use_remove_account_mutation();

  const handleSubmit: SubmitHandler<RemoveAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      removeAccount({
        ...values,
        vendor: vendor.toLowerCase() as "google" | "apple"
      })
        .unwrap()
        .then(() => {
          close_modal();
          toast(`Removed your ${vendor} account`, "success");
          onRemove();
        })
        .catch((e) => {
          setUpdated(false);
          toast(
            e?.data?.error || `Could not remove your ${vendor} account`,
            "error"
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
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
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
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
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
