"use client";

import { BLOG_PROPS, ImageSize } from "@storiny/shared";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import FormTextarea from "~/components/form-textarea";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import EditIcon from "~/icons/edit";
import PhotoEditIcon from "~/icons/photo-edit";
import TrashIcon from "~/icons/trash";
import { use_blog_seo_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../common/dashboard-group";
import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import { BLOG_SEO_SETTINGS_SCHEMA, BlogSEOSettingsSchema } from "./seo.schema";
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

// Preview image

const PreviewImage = (): React.ReactElement => {
  const form = use_form_context<BlogSEOSettingsSchema>();
  const preview_image = form.watch("preview_image");
  return (
    <div className={clsx(css["flex-col"], styles["preview-image"])}>
      <Typography level={"body2"} weight={"bold"}>
        Preview image
      </Typography>
      <div className={clsx(css.flex, styles.container)}>
        <AspectRatio className={clsx(styles.x, styles.image)} ratio={1.9}>
          {preview_image ? (
            <React.Fragment>
              <Image alt={""} img_key={preview_image} size={ImageSize.W_320} />
              <div
                className={clsx(
                  "force-light-mode",
                  css["flex-col"],
                  styles.actions
                )}
              >
                <Gallery
                  on_confirm={(asset): void => {
                    form.setValue("preview_image", asset.key, {
                      shouldDirty: true
                    });
                  }}
                >
                  <IconButton
                    aria-label={"Change preview image"}
                    auto_size
                    title={"Change preview image"}
                  >
                    <EditIcon />
                  </IconButton>
                </Gallery>
                <Spacer orientation={"vertical"} />
                <IconButton
                  aria-label={"Reset preview image"}
                  auto_size
                  onClick={(): void => {
                    form.setValue("preview_image", null, { shouldDirty: true });
                  }}
                  title={"Reset preview image"}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </React.Fragment>
          ) : (
            <Gallery
              on_confirm={(asset): void => {
                form.setValue("preview_image", asset.key, {
                  shouldDirty: true
                });
              }}
            >
              <div
                aria-label={"Add a custom preview image"}
                className={clsx(
                  css["flex-center"],
                  css["full-h"],
                  css["full-w"],
                  styles.placeholder
                )}
                role={"button"}
                title={"Add a custom preview image"}
              >
                <PhotoEditIcon />
              </div>
            </Gallery>
          )}
        </AspectRatio>
      </div>
      <Typography color={"minor"} level={"body3"}>
        This image will serve as a preview for your blog when it is embedded on
        other platforms. Please use an image with exact dimensions of 1200px
        width and 630px height. By default, your blog’s logo will be used.
      </Typography>
    </div>
  );
};

// Sitemap group

const SitemapGroup = (): React.ReactElement => {
  const blog = use_blog_context();
  const blog_url = get_blog_url(blog);

  return (
    <DashboardGroup>
      <TitleBlock title={"Sitemap"}>
        Your blog&apos;s sitemap contains all the links to the stories published
        on your blog. You may want to submit it to search engine consoles to
        help crawlers in better understanding the structure of your blog.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <Typography
        className={clsx(styles.x, styles["sitemap-url"])}
        level={"body2"}
      >
        {blog_url}/sitemap.xml
      </Typography>
    </DashboardGroup>
  );
};

const SEOSettingsClient = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<BlogSEOSettingsSchema>({
    resolver: zod_resolver(BLOG_SEO_SETTINGS_SCHEMA),
    defaultValues: {
      seo_description: blog.seo_description,
      seo_title: blog.seo_title,
      preview_image: blog.preview_image
    }
  });
  const [mutate_blog_seo_settings, { isLoading: is_loading }] =
    use_blog_seo_settings_mutation();

  const handle_submit: SubmitHandler<BlogSEOSettingsSchema> = (values) => {
    mutate_blog_seo_settings({ ...values, blog_id: blog.id })
      .unwrap()
      .then(() => {
        blog.mutate(values);
        form.reset(values);
        toast("Settings updated successfully", "success");
      })
      .catch((error) => {
        handle_api_error(
          error,
          toast,
          form,
          "Could not update the SEO settings"
        );
      });
  };

  return (
    <React.Fragment>
      <DashboardTitle>Search optimization</DashboardTitle>
      <DashboardWrapper>
        <DashboardGroup>
          <Form<BlogSEOSettingsSchema>
            className={clsx(css["flex-col"], styles.form)}
            disabled={is_loading}
            on_submit={handle_submit}
            provider_props={form}
          >
            <FormInput
              autoComplete={"off"}
              auto_size
              data-testid={"seo-title-input"}
              helper_text={
                <>
                  Choose a concise title that outlines your blog. By default,
                  your blog’s name will be used.
                </>
              }
              label={"SEO title"}
              maxLength={BLOG_PROPS.seo_title.max_length}
              name={"seo_title"}
              placeholder={"40–60 characters"}
              slot_props={{
                container: {
                  className: styles.input
                }
              }}
            />
            <Spacer orientation={"vertical"} size={3} />
            <FormTextarea
              helper_text={
                <>
                  Summarize your blog to improve its visibility on search
                  results. By default, your blog’s description will be used.
                </>
              }
              label={"SEO description"}
              maxLength={BLOG_PROPS.seo_description.max_length}
              name={"seo_description"}
              placeholder={"80–120 characters"}
            />
            <Spacer orientation={"vertical"} size={3} />
            <PreviewImage />
            <Spacer orientation={"vertical"} size={3} />
            <SaveButton is_loading={is_loading} />
          </Form>
        </DashboardGroup>
        <Divider />
        <SitemapGroup />
      </DashboardWrapper>
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default SEOSettingsClient;
