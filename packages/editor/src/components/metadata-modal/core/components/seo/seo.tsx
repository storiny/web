import { ImageSize } from "@storiny/shared";
import { STORY_PROPS } from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "../../../../../../../ui/src/components/aspect-ratio";
import { use_form_context } from "../../../../../../../ui/src/components/form";
import FormInput from "../../../../../../../ui/src/components/form-input";
import FormTextarea from "../../../../../../../ui/src/components/form-textarea";
import IconButton from "../../../../../../../ui/src/components/icon-button";
import Image from "../../../../../../../ui/src/components/image";
import Spacer from "../../../../../../../ui/src/components/spacer";
import Typography from "../../../../../../../ui/src/components/typography";
import Gallery from "~/entities/gallery";
import EditIcon from "../../../../../../../ui/src/icons/edit";
import PhotoEditIcon from "../../../../../../../ui/src/icons/photo-edit";
import TrashIcon from "../../../../../../../ui/src/icons/trash";

import image_styles from "../common/image.module.scss";

// Preview image

const PreviewImage = (): React.ReactElement => {
  const form = use_form_context();
  const preview_image = form.watch("preview_image");
  return (
    <div className={clsx("flex-col", image_styles.x, image_styles.block)}>
      <Typography className={"t-bold"} level={"body2"}>
        Preview image
      </Typography>
      <Typography className={"t-minor"} level={"body3"}>
        This image will serve as a preview for your story when it is embedded on
        other platforms. Please use an image with exact dimensions of 1200px
        width and 630px height, or leave it to the default image.
      </Typography>
      <div
        className={clsx("flex-center", image_styles.x, image_styles.container)}
      >
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
                  "flex-col",
                  image_styles.x,
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
                  "flex-center",
                  "full-h",
                  "full-w",
                  image_styles.x,
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
      maxLength={STORY_PROPS.seoTitle.max_length}
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
      maxLength={STORY_PROPS.seoDescription.max_length}
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
      maxLength={STORY_PROPS.canonicalUrl.max_length}
      name={"canonical_url"}
      placeholder={"Link to the original source"}
    />
  </React.Fragment>
);

export default SeoTab;
