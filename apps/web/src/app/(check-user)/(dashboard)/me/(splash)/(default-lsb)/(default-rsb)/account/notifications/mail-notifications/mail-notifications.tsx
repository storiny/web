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
  MAIL_NOTIFICATIONS_SCHEMA
} from "./mail-notifications.schema";

const MailNotifications = ({
  on_submit,
  mail_features_and_updates,
  mail_login_activity,
  mail_newsletters,
  mail_digest
}: MailNotificationsProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<MailNotificationsSchema>();
  const form = use_form<MailNotificationsSchema>({
    resolver: zod_resolver(MAIL_NOTIFICATIONS_SCHEMA),
    defaultValues: {
      features_and_updates: mail_features_and_updates,
      login_activity: mail_login_activity,
      digest: mail_digest,
      newsletters: mail_newsletters
    }
  });
  const [mutate_mail_notification_settings, { isLoading: is_loading }] =
    use_mail_notification_settings_mutation();

  const handle_submit: SubmitHandler<MailNotificationsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_mail_notification_settings(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((e) => {
          form.reset(prev_values_ref.current);
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
  const submit_form = (): void => {
    form.handleSubmit(handle_submit)();
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
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormCheckbox
          helper_text={
            "Receive an e-mail for every successful login attempt made to your account."
          }
          label={"Login activity"}
          name={"login_activity"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive an e-mail for new features and updates from Storiny."
          }
          label={"New features & updates"}
          name={"features_and_updates"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive newsletters from the writers to whom you have subscribed."
          }
          label={"Newsletters"}
          name={"newsletters"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive an email for suggested stories based on your reading history or those handpicked by the staff."
          }
          label={"Suggested stories"}
          name={"digest"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
      </Form>
    </DashboardGroup>
  );
};

export default MailNotifications;
