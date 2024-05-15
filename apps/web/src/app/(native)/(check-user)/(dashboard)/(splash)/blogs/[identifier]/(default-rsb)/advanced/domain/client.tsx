"use client";

import { BLOG_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import TitleBlock from "~/entities/title-block";
import { use_blog_slug_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../common/dashboard-group";
import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import ConnectDomain from "./connect-domain";
import {
  BLOG_SLUG_SETTINGS_SCHEMA,
  BlogSlugSettingsSchema
} from "./domain.schema";
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

// Custom domain group

const CustomDomainGroup = (): React.ReactElement => (
  <DashboardGroup>
    <TitleBlock title={"Custom domain"}>
      Map a custom domain name that you own to your blog.
    </TitleBlock>
    <Spacer orientation={"vertical"} size={3} />
    <ConnectDomain />
  </DashboardGroup>
);

const DomainSettingsClient = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<BlogSlugSettingsSchema>({
    resolver: zod_resolver(BLOG_SLUG_SETTINGS_SCHEMA),
    defaultValues: {
      slug: blog.slug
    }
  });
  const [mutate_blog_slug_settings, { isLoading: is_loading }] =
    use_blog_slug_settings_mutation();

  const handle_submit: SubmitHandler<BlogSlugSettingsSchema> = (values) => {
    mutate_blog_slug_settings({ ...values, blog_id: blog.id })
      .unwrap()
      .then(() => {
        blog.mutate(values);
        form.reset(values);
        toast("Settings successfully updated", "success");
      })
      .catch((error) => {
        handle_api_error(
          error,
          toast,
          form,
          "Could not update the domain settings"
        );
      });
  };

  return (
    <React.Fragment>
      <DashboardTitle>Domain</DashboardTitle>
      <DashboardWrapper>
        <DashboardGroup>
          <Form<BlogSlugSettingsSchema>
            className={clsx(css["flex-col"], styles.form)}
            disabled={is_loading}
            on_submit={handle_submit}
            provider_props={form}
          >
            <FormInput
              autoComplete={"off"}
              auto_size
              data-testid={"slug-input"}
              end_decorator={
                <Typography
                  aria-hidden={"true"}
                  as={"span"}
                  color={"minor"}
                  level={"body2"}
                  style={{ marginInline: "8px" }}
                >
                  .storiny.com
                </Typography>
              }
              helper_text={
                <>
                  We will not redirect traffic from your old subdomain to your
                  new one. Please be mindful when changing your blog&apos;s
                  subdomain.
                </>
              }
              label={"Storiny subdomain"}
              maxLength={BLOG_PROPS.slug.max_length}
              minLength={BLOG_PROPS.slug.min_length}
              name={"slug"}
              placeholder={""}
              required
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
              unstyled_end_decorator
            />
            <Spacer orientation={"vertical"} size={3} />
            <SaveButton is_loading={is_loading} />
          </Form>
        </DashboardGroup>
        <Divider />
        <CustomDomainGroup />
      </DashboardWrapper>
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default DomainSettingsClient;
