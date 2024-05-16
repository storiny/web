"use client";

import { BLOG_PROPS, StoryCategory, USER_PROPS } from "@storiny/shared";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP
} from "@storiny/shared/src/constants/category-icon-map";
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
import FormSelect from "~/components/form-select";
import FormTextarea from "~/components/form-textarea";
import Grow from "~/components/grow";
import Option from "~/components/option";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { use_blog_general_settings_mutation } from "~/redux/features";
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
  const [mutate_general_settings, { isLoading: is_loading }] =
    use_blog_general_settings_mutation();

  const handle_submit: SubmitHandler<BlogGeneralSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_general_settings({ ...values, blog_id: blog.id })
        .unwrap()
        .then(() => {
          blog.mutate(values);
          form.reset(values);
          toast("Blog updated successfully", "success");
        })
        .catch((error) => {
          handle_api_error(
            error,
            toast,
            form,
            "Could not update the blog settings"
          );
        });
    }
  };

  return (
    <Form<BlogGeneralSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <div className={clsx(css["flex-center"], styles["input-row"])}>
        <FormInput
          autoComplete={"off"}
          auto_size
          data-testid={"name-input"}
          form_slot_props={{
            form_item: {
              className: css["f-grow"]
            }
          }}
          helper_text={
            "Provide a name for your blog. This does not affect the URL of your blog."
          }
          label={"Name"}
          maxLength={BLOG_PROPS.name.max_length}
          minLength={BLOG_PROPS.name.min_length}
          name={"name"}
          placeholder={"Blog name"}
          required
        />
        <FormSelect
          auto_size
          form_slot_props={{
            form_item: {
              className: css["f-grow"]
            }
          }}
          helper_text={
            "Choose a category that best fits your blog to help users find it easily across Storiny."
          }
          label={"Category"}
          name={"category"}
          required
          slot_props={{
            trigger: {
              "aria-label": "Blog category"
            },
            value: {
              placeholder: "Blog category"
            }
          }}
        >
          {(
            [
              StoryCategory.OTHERS,
              StoryCategory.SCIENCE_AND_TECHNOLOGY,
              StoryCategory.PROGRAMMING,
              StoryCategory.LIFESTYLE,
              StoryCategory.HEALTH_AND_WELLNESS,
              StoryCategory.ENTERTAINMENT,
              StoryCategory.DIGITAL_GRAPHICS,
              StoryCategory.TRAVEL,
              StoryCategory.DIY,
              StoryCategory.NEWS,
              StoryCategory.SPORTS,
              StoryCategory.GAMING,
              StoryCategory.MUSIC,
              StoryCategory.LEARNING,
              StoryCategory.BUSINESS_AND_FINANCE
            ] as StoryCategory[]
          ).map((category) => (
            <Option
              decorator={CATEGORY_ICON_MAP[category]}
              key={category}
              value={category}
            >
              {CATEGORY_LABEL_MAP[category]}
            </Option>
          ))}
        </FormSelect>
      </div>
      <Spacer orientation={"vertical"} size={3} />
      <FormTextarea
        data-testid={"description-textarea"}
        label={"Description"}
        maxLength={USER_PROPS.bio.max_length}
        name={"description"}
        placeholder={"Tell readers what your blog is all about"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <SaveButton is_loading={is_loading} />
    </Form>
  );
};

export default BlogGeneralForm;
