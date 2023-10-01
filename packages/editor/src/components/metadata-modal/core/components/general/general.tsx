import { ImageSize, StoryCategory } from "@storiny/shared";
import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP
} from "@storiny/shared/src/constants/category-icon-map";
import {
  MAX_STORY_TAGS,
  STORY_PROPS
} from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import { use_form_context } from "~/components/form";
import FormInput from "~/components/form-input";
import FormMultiSelect from "~/components/form-multi-select";
import FormSelect from "~/components/form-select";
import FormTextarea from "~/components/form-textarea";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Link from "~/components/link";
import { MultiSelectProps } from "~/components/multi-select";
import Option from "~/components/option";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import EditIcon from "~/icons/edit";
import PhotoPlusIcon from "~/icons/photo-plus";
import TrashIcon from "~/icons/trash";
import { use_lazy_get_tags_query } from "~/redux/features";
import css from "~/theme/main.module.scss";

import image_styles from "../common/image.module.scss";

/**
 * Debounces a function for the provided delay
 * @param fn Function
 * @param delay Delay (in ms)
 */
const debounce = <T extends (...args: any) => any>(fn: T, delay = 250): T => {
  let timeout: NodeJS.Timeout;
  return ((...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
};

// Splash

const Splash = (): React.ReactElement => {
  const form = use_form_context();
  const splash_id = form.watch("splash_id");
  const splash_hex = form.watch("splash_hex");

  return (
    <div className={clsx(css["flex-col"], image_styles.block)}>
      <Typography className={css["t-bold"]} level={"body2"}>
        Splash image
      </Typography>
      <Typography className={css["t-minor"]} level={"body3"}>
        Including a relevant splash image can attract more readers to your
        story. Please avoid using images with watermarks or low resolution.
        Additionally, ensure that the image adheres to our{" "}
        <Link href={"/guidelines"} target={"_blank"} underline={"always"}>
          Community Guidelines
        </Link>
        .
      </Typography>
      <div className={clsx(css["flex-center"], image_styles.container)}>
        <AspectRatio
          className={clsx(image_styles.x, image_styles.image)}
          ratio={1.77}
        >
          {splash_id ? (
            <React.Fragment>
              <Image
                alt={""}
                hex={splash_hex}
                img_key={splash_id}
                size={ImageSize.W_320}
              />
              <div
                className={clsx(
                  "force-light-mode",
                  css["flex-col"],
                  image_styles.actions
                )}
              >
                <Gallery
                  on_confirm={(asset): void => {
                    form.setValue("splash_id", asset.key, {
                      shouldDirty: true
                    });
                    form.setValue("splash_hex", asset.hex, {
                      shouldDirty: true
                    });
                  }}
                >
                  <IconButton
                    aria-label={"Change splash"}
                    auto_size
                    title={"Change splash"}
                  >
                    <EditIcon />
                  </IconButton>
                </Gallery>
                <Spacer orientation={"vertical"} />
                <IconButton
                  aria-label={"Remove splash"}
                  auto_size
                  onClick={(): void => {
                    form.setValue("splash_id", null, { shouldDirty: true });
                    form.setValue("splash_hex", null, { shouldDirty: true });
                  }}
                  title={"Remove splash"}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </React.Fragment>
          ) : (
            <Gallery
              on_confirm={(asset): void => {
                form.setValue("splash_id", asset.key, {
                  shouldDirty: true
                });
                form.setValue("splash_hex", asset.hex, {
                  shouldDirty: true
                });
              }}
            >
              <div
                aria-label={"Add a splash image"}
                className={clsx(
                  css["flex-center"],
                  css["full-h"],
                  css["full-w"],
                  image_styles.placeholder
                )}
                role={"button"}
                title={"Add a splash image"}
              >
                <PhotoPlusIcon />
              </div>
            </Gallery>
          )}
        </AspectRatio>
      </div>
    </div>
  );
};

// Tags

const Tags = (): React.ReactElement => {
  const [get_tags, { isError: is_error }] = use_lazy_get_tags_query();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load_options_debounced = React.useCallback(
    debounce(
      (
        input_value: Parameters<
          NonNullable<MultiSelectProps["loadOptions"]>
        >[0],
        callback: Parameters<NonNullable<MultiSelectProps["loadOptions"]>>[1]
      ) => {
        get_tags({ query: input_value || "" }, true).then(({ data = [] }) =>
          callback(data)
        );
      },
      500
    ),
    []
  );

  return (
    <FormMultiSelect
      auto_size
      color={is_error ? "ruby" : "inverted"}
      helper_text={
        <>
          Using tags can make it easier to focus your story on particular topics
          and boost its chances of being seen in search results and
          recommendations.
        </>
      }
      label={"Tags"}
      loadOptions={load_options_debounced}
      max={MAX_STORY_TAGS}
      menuPlacement={"top"}
      name={"tags"}
      noOptionsMessage={(): null => null}
      options={[]}
      placeholder={"Assign a tag"}
    />
  );
};

const GeneralTab = (): React.ReactElement => (
  <React.Fragment>
    <Splash />
    <Spacer orientation={"vertical"} size={3} />
    <FormInput
      auto_size
      helper_text={
        <>
          A title helps readers get a quick grasp of your story&apos;s content
          before they start reading. To create a good title, make it short,
          relevant, and to the point. Avoid adding unnecessary words or
          information.
        </>
      }
      label={"Title"}
      maxLength={STORY_PROPS.title.max_length}
      minLength={STORY_PROPS.title.min_length}
      name={"title"}
      placeholder={"A concise title"}
      required
    />
    <Spacer orientation={"vertical"} size={4} />
    <FormTextarea
      helper_text={
        <>
          Adding a brief description to your story is optional but can greatly
          enhance reader engagement. It offers a concise summary for readers to
          get a quick idea of what to expect.
        </>
      }
      label={"Description"}
      maxLength={STORY_PROPS.description.max_length}
      name={"description"}
      placeholder={"A brief description of what your story is all about"}
    />
    <Spacer orientation={"vertical"} size={4} />
    <Tags />
    <Spacer orientation={"vertical"} size={4} />
    <FormSelect
      auto_size
      helper_text={"Select a category that best describes this story."}
      label={"Category"}
      name={"category"}
      required
      slot_props={{
        trigger: {
          "aria-label": "Story category"
        },
        value: {
          placeholder: "Story category"
        },
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
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
  </React.Fragment>
);

export default GeneralTab;
