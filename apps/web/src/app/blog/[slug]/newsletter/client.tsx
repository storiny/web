"use client";

import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import PlusPattern from "~/brand/plus-pattern";
import { GetBlogNewsletterInfoResponse } from "~/common/grpc";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import MailPlusIcon from "~/icons/mail-plus";
import { use_add_newsletter_subscription_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import {
  NEWSLETTER_SUBSCRIBE_SCHEMA,
  NewsletterSubscribeSchema
} from "./schema";
import styles from "./styles.module.scss";

type Props = GetBlogNewsletterInfoResponse;

const Client = (props: Props): React.ReactElement => {
  const toast = use_toast();
  const { id, newsletter_splash_id, name, description, user, is_subscribed } =
    props;
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
    add_newsletter_subscription({ ...values, blog_id: id })
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

  return (
    <React.Fragment>
      <div
        className={clsx(
          css["full-w"],
          css["full-h"],
          styles.splash,
          newsletter_splash_id && styles["has-splash"]
        )}
        role={"presentation"}
        style={
          {
            "--splash-url": newsletter_splash_id
              ? "url(https://images.unsplash.com/photo-1710291703020-cc2412538d4d?q=80&w=3425&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)"
              : undefined
          } as React.CSSProperties
        }
      >
        {!newsletter_splash_id && <PlusPattern />}
      </div>
      <div className={clsx(css["flex-col"], styles.content)}>
        <Typography as={"h1"} scale={"xl"}>
          {name}
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <Persona
          avatar={{
            alt: `${user?.name}'s avatar`,
            hex: user?.avatar_hex,
            avatar_id: user?.avatar_id,
            label: user?.name
          }}
          primary_text={
            <span>
              <Typography as={"span"} color={"minor"}>
                By
              </Typography>{" "}
              <Link
                fixed_color
                href={`${process.env.NEXT_PUBLIC_WEB_URL}/${user?.username}`}
                target={"_blank"}
                title={`View ${user?.name}'s profile`}
              >
                {user?.name}
              </Link>
            </span>
          }
        />
        {Boolean((description || "").trim().length) && (
          <React.Fragment>
            <Spacer orientation={"vertical"} size={3} />
            <Typography color={"minor"} level={"body2"}>
              {description}
            </Typography>
          </React.Fragment>
        )}
        <Spacer className={css["f-grow"]} orientation={"vertical"} size={10} />
        {is_success ? (
          <React.Fragment>
            <Divider />
            <Spacer orientation={"vertical"} size={3} />
            <Typography level={"body2"}>
              We&apos;ve just sent you a confirmation e-mail. Check your inbox
              to finish subscribing.
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
        )}
        <Spacer orientation={"vertical"} size={2} />
      </div>
    </React.Fragment>
  );
};

export default Client;
