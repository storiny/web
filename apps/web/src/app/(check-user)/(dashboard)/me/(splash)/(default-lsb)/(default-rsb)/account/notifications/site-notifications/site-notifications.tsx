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
import { use_site_notification_settings_mutation } from "~/redux/features";

import DashboardGroup from "../../../../dashboard-group";
import styles from "../styles.module.scss";
import { SiteNotificationsProps } from "./site-notifications.props";
import {
  SiteNotificationsSchema,
  siteNotificationsSchema
} from "./site-notifications.schema";

const SiteNotifications = ({
  on_submit,
  features_and_updates,
  friend_requests,
  tags,
  replies,
  new_followers,
  stories,
  comments
}: SiteNotificationsProps): React.ReactElement => {
  const toast = use_toast();
  const prevValuesRef = React.useRef<SiteNotificationsSchema>();
  const form = use_form<SiteNotificationsSchema>({
    resolver: zod_resolver(siteNotificationsSchema),
    defaultValues: {
      "friend-requests": friend_requests,
      "features-and-updates": features_and_updates,
      "new-followers": new_followers,
      replies,
      comments,
      tags,
      stories
    }
  });
  const [mutateSiteNotificationSettings, { isLoading }] =
    use_site_notification_settings_mutation();

  const handleSubmit: SubmitHandler<SiteNotificationsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateSiteNotificationSettings(values)
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
          toast(
            e?.data?.error ||
              "Could not update your site notification settings",
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
      <TitleBlock title={"Site notifications"}>
        Settings for the notifications that you receive on the site.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3.5} />
      <Form<SiteNotificationsSchema>
        className={clsx("flex-col", styles.form)}
        disabled={isLoading}
        on_submit={handleSubmit}
        provider_props={form}
      >
        <FormCheckbox
          helper_text={
            "Receive notifications for new product features, tips, and updates from Storiny."
          }
          label={"Features & updates"}
          name={"features-and-updates"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when your friends or the writers you follow, and have subscribed to, publish a new story."
          }
          label={"Stories"}
          name={"stories"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when a new story gets published in one of the tags that you follow."
          }
          label={"Tags"}
          name={"tags"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone leaves a comment on your stories."
          }
          label={"Comments"}
          name={"comments"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone replies to your comment."
          }
          label={"Replies"}
          name={"replies"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone starts following you."
          }
          label={"New followers"}
          name={"new-followers"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone sends you a friend request or when your friend request is accepted."
          }
          label={"Friend requests"}
          name={"friend-requests"}
          onCheckedChange={submitForm}
          size={"lg"}
        />
      </Form>
    </DashboardGroup>
  );
};

export default SiteNotifications;
