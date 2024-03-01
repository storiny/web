"use client";

import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import GitHubIcon from "~/icons/github";
import InstagramIcon from "~/icons/instagram";
import LinkedInIcon from "~/icons/linkedin";
import MailIcon from "~/icons/mail";
import TwitchIcon from "~/icons/twitch";
import TwitterIcon from "~/icons/twitter";
import WorldIcon from "~/icons/world";
import YouTubeIcon from "~/icons/youtube";
import { use_blog_connections_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../common/dashboard-group";
import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import { BlogConnectionsFormProps } from "./connections.props";
import {
  BLOG_CONNECTIONS_SCHEMA,
  BlogConnectionsSchema,
  CONNECTION_VALUE_MAX_LENGTH
} from "./connections.schema";
import styles from "./styles.module.scss";

// Save button

const SaveButton = ({
  is_loading
}: {
  is_loading: boolean;
}): React.ReactElement => {
  const { formState: form_state } = use_form_context();
  return (
    <div className={css["flex"]}>
      <Grow />
      <Button
        auto_size
        check_auth
        disabled={!form_state.isDirty}
        loading={is_loading}
        type={"submit"}
      >
        Save
      </Button>
    </div>
  );
};

const BlogConnectionsClient = ({
  on_submit
}: BlogConnectionsFormProps): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<BlogConnectionsSchema>({
    resolver: zod_resolver(BLOG_CONNECTIONS_SCHEMA),
    defaultValues: {
      github_url: blog.github_url,
      instagram_url: blog.instagram_url,
      linkedin_url: blog.linkedin_url,
      twitch_url: blog.twitch_url,
      website_url: blog.website_url,
      twitter_url: blog.twitter_url,
      youtube_url: blog.youtube_url,
      public_email: blog.public_email
    }
  });
  const [mutate_blog_connections, { isLoading: is_loading }] =
    use_blog_connections_mutation();

  const handle_submit: SubmitHandler<BlogConnectionsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_blog_connections({ ...values, blog_id: blog.id })
        .unwrap()
        .then(() => {
          blog.mutate(values);
          form.reset(values);
          toast("Connections updated successfully", "success");
        })
        .catch((error) => {
          handle_api_error(
            error,
            toast,
            form,
            "Could not update the blog connections"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <DashboardTitle>Connections</DashboardTitle>
      <DashboardWrapper>
        <DashboardGroup>
          <Typography color={"minor"} level={"body2"}>
            Link your social media accounts or website to display them on the
            home-page of your blog. If you can&apos;t find a provider or want to
            add a custom connection, add them on the{" "}
            <Link
              href={`/blogs/${blog.slug}/settings/sidebars`}
              underline={"always"}
            >
              sidebars
            </Link>{" "}
            page.
          </Typography>
          <Spacer orientation={"vertical"} size={5} />
          <Form<BlogConnectionsSchema>
            className={clsx(css["flex-col"], styles.form)}
            disabled={is_loading}
            on_submit={handle_submit}
            provider_props={form}
          >
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"website-url-input"}
              decorator={<WorldIcon />}
              label={"Your website"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"website_url"}
              placeholder={"https://my-website.com"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"email"}
              auto_size
              data-testid={"public-email-input"}
              decorator={<MailIcon />}
              helper_text={
                <>
                  Your email address will be accessible to everyone on your
                  blog&apos;s homepage. Be mindful when exposing your personal
                  email to the internet.
                </>
              }
              label={"Your e-mail address"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"public_email"}
              placeholder={"contact@me.com"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"linkedin-url-input"}
              decorator={<LinkedInIcon />}
              label={"Your LinkedIn profile"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"linkedin_url"}
              placeholder={"LinkedIn URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"youtube-url-input"}
              decorator={<YouTubeIcon />}
              label={"Your YouTube channel"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"youtube_url"}
              placeholder={"YouTube channel URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"twitch-url-input"}
              decorator={<TwitchIcon />}
              label={"Your Twitch channel"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"twitch_url"}
              placeholder={"Twitch channel URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"instagram-url-input"}
              decorator={<InstagramIcon />}
              label={"Your Instagram profile"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"instagram_url"}
              placeholder={"Instagram profile URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"twitter-url-input"}
              decorator={<TwitterIcon />}
              label={"Your Twitter profile"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"twitter_url"}
              placeholder={"Twitter profile URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <FormInput
              autoComplete={"url"}
              auto_size
              data-testid={"github-url-input"}
              decorator={<GitHubIcon />}
              label={"Your GitHub profile"}
              maxLength={CONNECTION_VALUE_MAX_LENGTH}
              name={"github_url"}
              placeholder={"GitHub profile or organization URL"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            {/* Spacer */}
            <span />
            <SaveButton is_loading={is_loading} />
          </Form>
        </DashboardGroup>
      </DashboardWrapper>
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default BlogConnectionsClient;
