"use client";

import { USER_PROPS } from "@storiny/shared";
import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
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
import FormTextarea from "~/components/form-textarea";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import {
  mutate_user,
  select_user,
  use_profile_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./general-form.module.scss";
import { BlogGeneralFormProps } from "./general-form.props";
import { BLOG_GENERAL_SCHEMA, BlogGeneralSchema } from "./general-form.schema";

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

const BlogGeneralForm = ({
  on_submit
}: BlogGeneralFormProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<BlogGeneralSchema>({
    resolver: zod_resolver(BLOG_GENERAL_SCHEMA),
    defaultValues: {
      name: blog.name,
      category: blog.category,
      description: blog.description
    }
  });
  const [mutate_profile_settings, { isLoading: is_loading }] =
    use_profile_settings_mutation();

  const handle_submit: SubmitHandler<BlogGeneralSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_profile_settings(values)
        .unwrap()
        .then(() => {
          dispatch(mutate_user(values));
          form.reset(values);
          toast("Profile updated successfully", "success");
        })
        .catch((error) => {
          handle_api_error(
            error,
            toast,
            form,
            "Could not update your profile settings"
          );
        });
    }
  };

  return (
    <Form<AccountGeneralSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <div className={clsx(css["flex-center"], styles["input-row"])}>
        <FormInput
          autoComplete={"name"}
          auto_size
          data-testid={"name-input"}
          form_slot_props={{
            form_item: {
              className: css["f-grow"]
            }
          }}
          helper_text={
            "Provide a name that you are commonly known by, such as your full name or nickname, to help others find you easily."
          }
          label={"Name"}
          maxLength={USER_PROPS.name.max_length}
          minLength={USER_PROPS.name.min_length}
          name={"name"}
          placeholder={"Your name"}
          required
        />
        <FormInput
          autoComplete={"country-name"}
          auto_size
          data-testid={"location-input"}
          form_slot_props={{
            form_item: {
              className: css["f-grow"]
            }
          }}
          helper_text={
            "Your location helps us improve your home feed and is also displayed on your public profile."
          }
          label={"Location"}
          maxLength={USER_PROPS.location.max_length}
          name={"location"}
          placeholder={"Your location"}
        />
      </div>
      <Spacer orientation={"vertical"} size={3} />
      <FormTextarea
        data-testid={"bio-textarea"}
        helper_text={
          <React.Fragment>
            You can format your bio using select markdown features such as **
            <b>bold</b>** and *<em>italics</em>*, and you can also mention{" "}
            <span className={css["t-medium"]}>@someone</span>.{" "}
            <Link
              href={SUPPORT_ARTICLE_MAP.FORMATTING_BIO}
              target={"_blank"}
              underline={"always"}
            >
              Learn more about formatting your bio
            </Link>
            .
          </React.Fragment>
        }
        label={"Bio"}
        maxLength={USER_PROPS.bio.max_length}
        name={"bio"}
        placeholder={"Your bio"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <SaveButton is_loading={is_loading} />
    </Form>
  );
};

export default BlogGeneralForm;
