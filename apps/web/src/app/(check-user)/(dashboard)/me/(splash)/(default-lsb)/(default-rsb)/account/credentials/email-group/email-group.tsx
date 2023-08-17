import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import TitleBlock from "~/entities/TitleBlock";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import MailIcon from "~/icons/Mail";
import PasswordIcon from "~/icons/Password";
import {
  mutateUser,
  selectUser,
  useEmailSettingsMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

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
          autoSize
          data-testid={"new-email-input"}
          formSlotProps={{
            formItem: {
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
          autoSize
          data-testid={"current-password-input"}
          decorator={<PasswordIcon />}
          formSlotProps={{
            formItem: {
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
  onSubmit,
  has_password
}: EmailGroupProps): React.ReactElement => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = useForm<EmailSettingsSchema>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      "new-email": "",
      "current-password": ""
    }
  });
  const [emailSettings, { isLoading }] = useEmailSettingsMutation();

  const handleSubmit: SubmitHandler<EmailSettingsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      emailSettings(values)
        .unwrap()
        .then(() => {
          setUpdated(true);
          dispatch(
            mutateUser({
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

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        disabled={!has_password}
        onClick={openModal}
        variant={"hollow"}
      >
        Change e-mail
      </Button>
    ),
    <Form<EmailSettingsSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <EmailSettingsModal updated={updated} />
    </Form>,
    {
      onOpenChange: updated ? (): void => undefined : undefined,
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          {!updated && (
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={isSmallerThanMobile}
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
      slotProps: {
        footer: {
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "350px"
          }
        },
        closeButton: {
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
  const user = useAppSelector(selectUser)!;

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
