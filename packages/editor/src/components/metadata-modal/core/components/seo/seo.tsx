import { ImageSize } from "@storiny/shared";
import { STORY_PROPS } from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import { use_form_context } from "~/components/form";
import FormInput from "~/components/form-input";
import FormTextarea from "~/components/form-textarea";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import EditIcon from "~/icons/edit";
import PhotoEditIcon from "~/icons/photo-edit";
import TrashIcon from "~/icons/trash";
import css from "~/theme/main.module.scss";

import { StoryMetadataSchema } from "../../../schema";
import image_styles from "../common/image.module.scss";

// Preview image

const PreviewImage = (): React.ReactElement => {
  const form = use_form_context<StoryMetadataSchema>();
  const preview_image = form.watch("preview_image");
  return (
    <div className={clsx(css["flex-col"], image_styles.block)}>
      <Typography className={css["t-bold"]} level={"body2"}>
        Preview image
      </Typography>
      <Typography className={css["t-minor"]} level={"body3"}>
        This image will serve as a preview for your story when it is embedded on
        other platforms. Please use an image with exact dimensions of 1200px
        width and 630px height, or leave it to the default image.
      </Typography>
      <div className={clsx(css["flex-center"], image_styles.container)}>
        <AspectRatio
          className={clsx(image_styles.x, image_styles.image)}
          ratio={1.9}
        >
          {preview_image ? (
            <React.Fragment>
              <Image alt={""} img_key={preview_image} size={ImageSize.W_320} />
              <div
                className={clsx(
                  "force-light-mode",
                  css["flex-col"],
                  image_styles.actions
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
                  image_styles.placeholder
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
    </div>
  );
};

const SeoTab = (): React.ReactElement => (
  <React.Fragment>
    <PreviewImage />
    <Spacer orientation={"vertical"} size={3} />
    <FormInput
      auto_size
      helper_text={
        <>
          The SEO title informs search engine crawlers about your story&apos;s
          topic and improves the likelihood of appearing in relevant search
          results. Choose a concise title that outlines your story or leave it
          blank to use a default title.
        </>
      }
      label={"SEO title"}
      maxLength={STORY_PROPS.seo_title.max_length}
      name={"seo_title"}
      placeholder={"40–60 characters"}
    />
    <Spacer orientation={"vertical"} size={4} />
    <FormTextarea
      helper_text={
        <>
          Summarize your story while outlining keywords that form the raw
          structure of it. This will improve its visibility on search results.
        </>
      }
      label={"SEO description"}
      maxLength={STORY_PROPS.seo_description.max_length}
      name={"seo_description"}
      placeholder={"80–120 characters"}
    />
    <Spacer orientation={"vertical"} size={4} />
    <FormInput
      autoComplete={"url"}
      auto_size
      helper_text={
        <>
          If you are republishing this story, please provide the link to the
          original source. This will allow search engine crawlers to index the
          original page and prevent duplicated content.
        </>
      }
      label={"Canonical URL"}
      maxLength={STORY_PROPS.canonical_url.max_length}
      name={"canonical_url"}
      placeholder={"Link to the original source"}
    />
  </React.Fragment>
);

export default SeoTab;
