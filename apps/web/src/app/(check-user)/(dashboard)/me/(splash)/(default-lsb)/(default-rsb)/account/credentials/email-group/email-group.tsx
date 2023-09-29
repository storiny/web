import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
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
import MailIcon from "~/icons/Mail";
import PasswordIcon from "~/icons/Password";
import {
  mutate_user,
  select_user,
  use_email_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../../../dashboard-group";
import { EmailGroupProps } from "./email-group.props";
import { EmailSettingsSchema, emailSettingsSchema } from "./email-group.schema";

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
          maxLength={userProps.email.maxLength}
          minLength={userProps.email.minLength}
          name={"new-email"}
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
          name={"current-password"}
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
  const router = useRouter();
  const dispatch = use_app_dispatch();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = use_form<EmailSettingsSchema>({
    resolver: zod_resolver(emailSettingsSchema),
    defaultValues: {
      "new-email": "",
      "current-password": ""
    }
  });
  const [mutateEmailSettings, { isLoading }] = use_email_settings_mutation();

  const handleSubmit: SubmitHandler<EmailSettingsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateEmailSettings(values)
        .unwrap()
        .then(() => {
          setUpdated(true);
          dispatch(
            mutate_user({
              email: values["new-email"]
            })
          );
        })
        .catch((e) => {
          setUpdated(false);
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
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <EmailSettingsModal updated={updated} />
    </Form>,
    {
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
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (updated) {
                router.push("/logout");
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
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
