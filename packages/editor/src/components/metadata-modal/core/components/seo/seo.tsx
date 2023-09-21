import { ImageSize } from "@storiny/shared";
import { STORY_PROPS } from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import { useFormContext } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormTextarea from "~/components/FormTextarea";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Gallery from "~/entities/gallery";
import EditIcon from "~/icons/Edit";
import PhotoEditIcon from "~/icons/PhotoEdit";
import TrashIcon from "~/icons/Trash";

import imageStyles from "../common/image.module.scss";

// Preview image

const PreviewImage = (): React.ReactElement => {
  const form = useFormContext();
  const previewImage = form.watch("preview-image");

  return (
    <div className={clsx("flex-col", imageStyles.x, imageStyles.block)}>
      <Typography className={"t-bold"} level={"body2"}>
        Preview image
      </Typography>
      <Typography className={"t-minor"} level={"body3"}>
        This image will serve as a preview for your story when it is embedded on
        other platforms. Please use an image with exact dimensions of 1200px
        width and 630px height, or leave it to the default image.
      </Typography>
      <div
        className={clsx("flex-center", imageStyles.x, imageStyles.container)}
      >
        <AspectRatio
          className={clsx(imageStyles.x, imageStyles.image)}
          ratio={1.9}
        >
          {previewImage ? (
            <React.Fragment>
              <Image alt={""} imgId={previewImage} size={ImageSize.W_320} />
              <div
                className={clsx(
                  "force-light-mode",
                  "flex-col",
                  imageStyles.x,
                  imageStyles.actions
                )}
              >
                <Gallery
                  onConfirm={(asset): void => {
                    form.setValue("preview-image", asset.key, {
                      shouldDirty: true
                    });
                  }}
                >
                  <IconButton
                    aria-label={"Change preview image"}
                    autoSize
                    title={"Change preview image"}
                  >
                    <EditIcon />
                  </IconButton>
                </Gallery>
                <Spacer orientation={"vertical"} />
                <IconButton
                  aria-label={"Reset preview image"}
                  autoSize
                  onClick={(): void => {
                    form.setValue("preview-image", null, { shouldDirty: true });
                  }}
                  title={"Reset preview image"}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </React.Fragment>
          ) : (
            <Gallery
              onConfirm={(asset): void => {
                form.setValue("preview-image", asset.key, {
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
                  imageStyles.x,
                  imageStyles.placeholder
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
      autoSize
      helperText={
        <>
          The SEO title informs search engine crawlers about your story&apos;s
          topic and improves the likelihood of appearing in relevant search
          results. Choose a concise title that outlines your story or leave it
          blank to use a default title.
        </>
      }
      label={"SEO title"}
      maxLength={STORY_PROPS.seoTitle.maxLength}
      name={"seo-title"}
      placeholder={"40–60 characters"}
    />
    <Spacer orientation={"vertical"} size={4} />
    <FormTextarea
      helperText={
        <>
          Summarize your story while outlining keywords that form the raw
          structure of it. This will improve its visibility on search results.
        </>
      }
      label={"SEO description"}
      maxLength={STORY_PROPS.seoDescription.maxLength}
      name={"seo-description"}
      placeholder={"80–120 characters"}
    />
    <Spacer orientation={"vertical"} size={4} />
    <FormInput
      autoComplete={"url"}
      autoSize
      helperText={
        <>
          If you are republishing this story, please provide the link to the
          original source. This will allow search engine crawlers to index the
          original page and prevent duplicated content.
        </>
      }
      label={"Canonical URL"}
      maxLength={STORY_PROPS.canonicalUrl.maxLength}
      name={"canonical-url"}
      placeholder={"Link to the original source"}
    />
  </React.Fragment>
);

export default SeoTab;
