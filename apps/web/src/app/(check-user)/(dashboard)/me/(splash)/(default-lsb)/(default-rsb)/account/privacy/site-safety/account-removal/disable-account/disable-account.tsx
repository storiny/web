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
import PasswordIcon from "~/icons/Password";
import UserIcon from "~/icons/User";
import { use_disable_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

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

const DisableAccount = ({
  on_submit
}: DisableAccountProps): React.ReactElement => {
  const router = useRouter();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [disabled, setDisabled] = React.useState<boolean>(false);
  const form = use_form<DisableAccountSchema>({
    resolver: zod_resolver(disableAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [disableAccount, { isLoading }] = use_disable_account_mutation();

  const handleSubmit: SubmitHandler<DisableAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
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
        Temporarily disable account
      </Button>
    ),
    <Form<DisableAccountSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <DisableAccountModal disabled={disabled} />
    </Form>,
    {
      onOpenChange: disabled ? (): void => undefined : undefined,
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {!disabled && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            color={disabled ? "inverted" : "ruby"}
            compact={is_smaller_than_mobile}
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
