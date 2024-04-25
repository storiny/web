"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Checkbox from "~/components/checkbox";
import Divider from "~/components/divider";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import CheckIcon from "~/icons/check";
import MailPlusIcon from "~/icons/mail-plus";
import {
  select_is_logged_in,
  use_add_newsletter_subscription_mutation,
  use_update_newsletter_subscription_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { use_blog_newsletter_info_context } from "./context";
import {
  NEWSLETTER_SUBSCRIBE_SCHEMA,
  NewsletterSubscribeSchema
} from "./schema";

const LoggedOutForm = ({
  blog_id
}: {
  blog_id: string;
}): React.ReactElement => {
  const toast = use_toast();
  const form = use_form<NewsletterSubscribeSchema>({
    resolver: zod_resolver(NEWSLETTER_SUBSCRIBE_SCHEMA),
    defaultValues: {
      email: ""
    }
  });
  const [
    add_newsletter_subscription,
    { isLoading: is_loading, isSuccess: is_success }
  ] = use_add_newsletter_subscription_mutation();

  const handle_submit: SubmitHandler<NewsletterSubscribeSchema> = (values) => {
    add_newsletter_subscription({ ...values, blog_id })
      .unwrap()
      .then(() => {
        form.reset();
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          form,
          "Could not subscribe to this newsletter"
        )
      );
  };

  return is_success ? (
    <React.Fragment>
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      <Typography level={"body2"}>
        We&apos;ve just sent you a confirmation e-mail. Check your inbox to
        finish subscribing.
      </Typography>
    </React.Fragment>
  ) : (
    <Form<NewsletterSubscribeSchema>
      className={clsx(css["flex-col"], css["full-w"])}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
      style={{ textAlign: "left" }}
    >
      <FormInput
        autoComplete={"email"}
        autoFocus
        data-testid={"email-input"}
        maxLength={USER_PROPS.email.max_length}
        minLength={USER_PROPS.email.min_length}
        name={"email"}
        placeholder={"Your e-mail address"}
        required
        size={"lg"}
        type={"email"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <Button
        className={css["full-w"]}
        decorator={<MailPlusIcon />}
        loading={is_loading}
        size={"lg"}
        type={"submit"}
      >
        Subscribe
      </Button>
    </Form>
  );
};

const LoggedInForm = ({
  blog_id,
  is_subscribed,
  user_name
}: {
  blog_id: string;
  is_subscribed: boolean;
  user_name: string;
}): React.ReactElement => {
  const toast = use_toast();
  const router = use_app_router();
  const [
    update_newsletter_subscription,
    { isLoading: is_loading, isSuccess: is_success }
  ] = use_update_newsletter_subscription_mutation();
  const [agreed, set_agreed] = React.useState<boolean>(true);

  /**
   * Subscribes to the newsletter.
   */
  const handle_subscribe = (): void => {
    update_newsletter_subscription({ blog_id, action: "subscribe" })
      .unwrap()
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not subscribe to this newsletter"
        )
      );
  };

  /**
   * Unsubscribes from the newsletter.
   */
  const handle_unsubscribe = (): void => {
    update_newsletter_subscription({ blog_id, action: "unsubscribe" })
      .unwrap()
      .then(router.refresh)
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not unsubscribe from this newsletter"
        )
      );
  };

  return is_subscribed ? (
    <React.Fragment>
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      <Typography level={"body2"}>
        You have already subscribed to this newsletter.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <Button
        className={css["full-w"]}
        disabled={is_success}
        loading={is_loading}
        onClick={handle_unsubscribe}
        size={"lg"}
        variant={"hollow"}
      >
        Unsubscribe
      </Button>
    </React.Fragment>
  ) : is_success ? (
    <React.Fragment>
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      <Typography
        className={css["flex-center"]}
        level={"body2"}
        style={{ gap: "8px" }}
      >
        <CheckIcon size={16} />
        You have subscribed to this newsletter
      </Typography>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <Checkbox
        checked={agreed}
        disabled={is_loading}
        label={`I agree to share my e-mail with ${user_name}`}
        onCheckedChange={(checked): void => set_agreed(Boolean(checked))}
      />
      <Spacer orientation={"vertical"} size={3} />
      <Button
        className={css["full-w"]}
        decorator={<MailPlusIcon />}
        disabled={!agreed}
        loading={is_loading}
        onClick={handle_subscribe}
        size={"lg"}
      >
        Subscribe
      </Button>
    </React.Fragment>
  );
};

const Client = (): React.ReactElement => {
  const { id, user, is_subscribed } = use_blog_newsletter_info_context();
  const logged_in = use_app_selector(select_is_logged_in);

  return (
    <React.Fragment>
      {logged_in ? (
        <LoggedInForm
          blog_id={id}
          is_subscribed={is_subscribed}
          user_name={user?.name || ""}
        />
      ) : (
        <LoggedOutForm blog_id={id} />
      )}
    </React.Fragment>
  );
};

export default Client;
