import { clsx } from "clsx";
import React from "react";

import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../packages/ui/src/components/form";
import FormCheckbox from "../../../../../../../../../../../../../packages/ui/src/components/form-checkbox";
import Spacer from "../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../packages/ui/src/components/toast";
import TitleBlock from "../../../../../../../../../../../../../packages/ui/src/entities/title-block";
import { use_mail_notification_settings_mutation } from "~/redux/features";

import DashboardGroup from "../../../../dashboard-group";
import styles from "../styles.module.scss";
import { MailNotificationsProps } from "./mail-notifications.props";
import {
  MailNotificationsSchema,
  mailNotificationsSchema
} from "./mail-notifications.schema";

const MailNotifications = ({
  on_submit,
  mail_features_and_updates,
  mail_login_activity,
  mail_newsletters,
  mail_digest
}: MailNotificationsProps): React.ReactElement => {
  const toast = use_toast();
  const prevValuesRef = React.useRef<MailNotificationsSchema>();
  const form = use_form<MailNotificationsSchema>({
    resolver: zod_resolver(mailNotificationsSchema),
    defaultValues: {
      "features-and-updates": mail_features_and_updates,
      "login-activity": mail_login_activity,
      digest: mail_digest,
      newsletters: mail_newsletters
    }
  });
  const [mutateMailNotificationSettings, { isLoading }] =
    use_mail_notification_settings_mutation();

  const handleSubmit: SubmitHandler<MailNotificationsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
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
        on_submit={handleSubmit}
        provider_props={form}
      >
        <FormCheckbox
          helper_text={
            "Receive an e-mail for every successful login attempt made to your account."
          }
          label={"Login activity"}
          name={"login-activity"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive an e-mail for new features and updates from Storiny."
          }
          label={"New features & updates"}
          name={"features-and-updates"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive newsletters from the writers to whom you have subscribed."
          }
          label={"Newsletters"}
          name={"newsletters"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
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
