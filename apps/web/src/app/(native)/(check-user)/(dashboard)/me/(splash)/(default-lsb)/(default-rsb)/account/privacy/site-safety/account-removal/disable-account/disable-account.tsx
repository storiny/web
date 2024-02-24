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
import PasswordIcon from "~/icons/password";
import UserIcon from "~/icons/user";
import { use_disable_account_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { DisableAccountProps } from "./disable-account.props";
import {
  DISABLE_ACCOUNT_SCHEMA,
  DisableAccountSchema
} from "./disable-account.schema";

const DisableAccountModal = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
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
    )}
  </React.Fragment>
);

const DisableAccount = ({
  on_submit
}: DisableAccountProps): React.ReactElement => {
  const router = use_app_router();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [disabled, set_disabled] = React.useState<boolean>(false);
  const form = use_form<DisableAccountSchema>({
    resolver: zod_resolver(DISABLE_ACCOUNT_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [disable_account, { isLoading: is_loading }] =
    use_disable_account_mutation();

  const handle_submit: SubmitHandler<DisableAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      disable_account(values)
        .unwrap()
        .then(() => set_disabled(true))
        .catch((error) => {
          set_disabled(false);

          handle_api_error(
            error,
            toast,
            form,
            "Could not disable your account"
          );
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        color={"ruby"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Temporarily disable account
      </Button>
    ),
    <Form<DisableAccountSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <DisableAccountModal disabled={disabled} />
    </Form>,
    {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (disabled) {
                router.push(`/logout/?to=${encodeURIComponent("/")}`);
              } else {
                form.handleSubmit(handle_submit)(); // Submit manually
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
