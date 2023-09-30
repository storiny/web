import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Button from "../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../../../../../../packages/ui/src/components/form-input";
import FormPasswordInput from "../../../../../../../../../../../../../packages/ui/src/components/form-password-input";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../packages/ui/src/components/typography";
import TitleBlock from "../../../../../../../../../../../../../packages/ui/src/entities/title-block";
import { use_media_query } from "../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import MailIcon from "../../../../../../../../../../../../../packages/ui/src/icons/mail";
import PasswordIcon from "../../../../../../../../../../../../../packages/ui/src/icons/password";
import {
  mutate_user,
  select_user,
  use_email_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../../../dashboard-group";
import { EmailGroupProps } from "./email-group.props";
import {
  EmailSettingsSchema,
  EMAIL_SETTINGS_SCHEMA
} from "./email-group.schema";

const EmailSettingsModal = ({
  updated
}: {
  updated?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        {updated
          ? "Your e-mail has been updated. You have been logged out and will need to log in again using your new e-mail."
          : "Enter your new e-mail address along with your current password."}
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={updated ? 2 : 5} />
    {!updated && (
      <React.Fragment>
        <FormInput
          autoComplete={"email"}
          auto_size
          data-testid={"new-email-input"}
          form_slot_props={{
            form_item: {
              className: "f-grow"
            }
          }}
          label={"New e-mail"}
          maxLength={USER_PROPS.email.max_length}
          minLength={USER_PROPS.email.min_length}
          name={"new_email"}
          placeholder={"Your new e-mail"}
          required
        />
        <Spacer orientation={"vertical"} size={3} />
        <FormPasswordInput
          auto_size
          data-testid={"current-password-input"}
          decorator={<PasswordIcon />}
          form_slot_props={{
            form_item: {
              className: "f-grow"
            }
          }}
          label={"Current password"}
          name={"current_password"}
          placeholder={"Your current password"}
          required
        />
        <Spacer orientation={"vertical"} size={2} />
      </React.Fragment>
    )}
  </React.Fragment>
);

// Export for testing
export const EmailSettings = ({
  on_submit,
  has_password
}: EmailGroupProps): React.ReactElement => {
  const router = use_router();
  const dispatch = use_app_dispatch();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [updated, set_updated] = React.useState<boolean>(false);
  const form = use_form<EmailSettingsSchema>({
    resolver: zod_resolver(EMAIL_SETTINGS_SCHEMA),
    defaultValues: {
      new_email: "",
      current_password: ""
    }
  });
  const [mutate_email_settings, { isLoading: is_loading }] =
    use_email_settings_mutation();

  const handle_submit: SubmitHandler<EmailSettingsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_email_settings(values)
        .unwrap()
        .then(() => {
          set_updated(true);
          dispatch(
            mutate_user({
              email: values["new_email"]
            })
          );
        })
        .catch((e) => {
          set_updated(false);
          toast(e?.data?.error || "Could not update your e-mail", "error");
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        disabled={!has_password}
        onClick={open_modal}
        variant={"hollow"}
      >
        Change e-mail
      </Button>
    ),
    <Form<EmailSettingsSchema>
      className={clsx("flex-col")}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <EmailSettingsModal updated={updated} />
    </Form>,
    {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      onOpenChange: updated ? (): void => undefined : undefined,
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {!updated && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!updated && !form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (updated) {
                router.push("/logout");
              } else {
                form.handleSubmit(handle_submit)(); // Submit manually
              }
            }}
          >
            {updated ? "Continue" : "Confirm"}
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
          decorator: <MailIcon />,
          children: "Change your e-mail"
        }
      }
    }
  );

  return element;
};

const CredentialsEmailGroup = (props: EmailGroupProps): React.ReactElement => {
  const { has_password } = props;
  const user = use_app_selector(select_user)!;

  return (
    <DashboardGroup>
      <TitleBlock title={"E-mail"}>
        The email address associated with your account is{" "}
        <span className={"t-medium"}>{user.email || "-"}</span>, and it is
        always kept private.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4.5} />
      <EmailSettings has_password={has_password} />
      {!has_password && (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={1.5} />
          <Typography className={"t-minor"} level={"body3"}>
            To modify e-mail, you need to add a password to your account.
          </Typography>
        </React.Fragment>
      )}
    </DashboardGroup>
  );
};

export default CredentialsEmailGroup;
