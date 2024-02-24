import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormCheckbox from "~/components/form-checkbox";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";
import { use_site_notification_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../dashboard-group";
import styles from "../styles.module.scss";
import { SiteNotificationsProps } from "./site-notifications.props";
import {
  SITE_NOTIFICATIONS_SCHEMA,
  SiteNotificationsSchema
} from "./site-notifications.schema";

const SiteNotifications = ({
  on_submit,
  features_and_updates,
  friend_requests,
  tags,
  replies,
  new_followers,
  stories,
  comments,
  story_likes
}: SiteNotificationsProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<SiteNotificationsSchema>();
  const form = use_form<SiteNotificationsSchema>({
    resolver: zod_resolver(SITE_NOTIFICATIONS_SCHEMA),
    defaultValues: {
      friend_requests,
      features_and_updates,
      new_followers,
      replies,
      comments,
      tags,
      stories,
      story_likes
    }
  });
  const [mutate_site_notification_settings, { isLoading: is_loading }] =
    use_site_notification_settings_mutation();

  const handle_submit: SubmitHandler<SiteNotificationsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_site_notification_settings(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((error) => {
          form.reset(prev_values_ref.current);

          handle_api_error(
            error,
            toast,
            form,
            "Could not update your site notification settings"
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
      <TitleBlock title={"Site notifications"}>
        Settings for the notifications that you receive on the site.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3.5} />
      <Form<SiteNotificationsSchema>
        className={clsx(css["flex-col"], styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormCheckbox
          helper_text={
            "Receive notifications for new product features, tips, and updates from Storiny."
          }
          label={"Features & updates"}
          name={"features_and_updates"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when your friends or the writers you follow, and have subscribed to, publish a new story."
          }
          label={"Stories"}
          name={"stories"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={"Receive a notification when someone likes your story."}
          label={"Story likes"}
          name={"story_likes"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when a new story gets published in one of the tags that you follow."
          }
          label={"Tags"}
          name={"tags"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone leaves a comment on your stories."
          }
          label={"Comments"}
          name={"comments"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone replies to your comment."
          }
          label={"Replies"}
          name={"replies"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone starts following you."
          }
          label={"New followers"}
          name={"new_followers"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
        <FormCheckbox
          helper_text={
            "Receive a notification when someone sends you a friend request or when your friend request is accepted."
          }
          label={"Friend requests"}
          name={"friend_requests"}
          onCheckedChange={submit_form}
          size={"lg"}
        />
      </Form>
    </DashboardGroup>
  );
};

export default SiteNotifications;
