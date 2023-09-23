import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormCheckbox from "~/components/FormCheckbox";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import TitleBlock from "~/entities/TitleBlock";
import { useMailNotificationSettingsMutation } from "~/redux/features";

import DashboardGroup from "../../../../dashboard-group";
import styles from "../styles.module.scss";
import { MailNotificationsProps } from "./mail-notifications.props";
import {
  MailNotificationsSchema,
  mailNotificationsSchema
} from "./mail-notifications.schema";

const MailNotifications = ({
  onSubmit,
  mail_features_and_updates,
  mail_login_activity,
  mail_newsletters,
  mail_digest
}: MailNotificationsProps): React.ReactElement => {
  const toast = useToast();
  const prevValuesRef = React.useRef<MailNotificationsSchema>();
  const form = useForm<MailNotificationsSchema>({
    resolver: zodResolver(mailNotificationsSchema),
    defaultValues: {
      "features-and-updates": mail_features_and_updates,
      "login-activity": mail_login_activity,
      digest: mail_digest,
      newsletters: mail_newsletters
    }
  });
  const [mutateMailNotificationSettings, { isLoading }] =
    useMailNotificationSettingsMutation();

  const handleSubmit: SubmitHandler<MailNotificationsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      mutateMailNotificationSettings(values)
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
          toast(
            e?.data?.error ||
              "Could not update your e-mail notification settings",
            "error"
          );
        });
    }
  };

  /**
   * Manually submits the form on checkbox mutations
   */
  const submitForm = (): void => {
    form.handleSubmit(handleSubmit)();
  };

  return (
    <DashboardGroup>
      <TitleBlock title={"E-mail notifications"}>
        You will still receive security and important e-mails regarding your
        account.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3.5} />
      <Form<MailNotificationsSchema>
        className={clsx("flex-col", styles.form)}
        disabled={isLoading}
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormCheckbox
          helperText={
            "Receive an e-mail for every successful login attempt made to your account."
          }
          label={"Login activity"}
          name={"login-activity"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helperText={
            "Receive an e-mail for new features and updates from Storiny."
          }
          label={"New features & updates"}
          name={"features-and-updates"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helperText={
            "Receive newsletters from the writers to whom you have subscribed."
          }
          label={"Newsletters"}
          name={"newsletters"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helperText={
            "Receive an email for suggested stories based on your reading history or those handpicked by the staff."
          }
          label={"Suggested stories"}
          name={"digest"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
      </Form>
    </DashboardGroup>
  );
};

export default MailNotifications;
