import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  ImageSize,
  StoryCategory
} from "@storiny/shared";
import {
  MAX_STORY_TAGS,
  STORY_PROPS
} from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "../../../../../../../ui/src/components/aspect-ratio";
import { use_form_context } from "../../../../../../../ui/src/components/form";
import FormMultiSelect from "~/components/form-multi-select";
import FormInput from "../../../../../../../ui/src/components/form-input";
import FormSelect from "../../../../../../../ui/src/components/form-select";
import FormTextarea from "../../../../../../../ui/src/components/form-textarea";
import IconButton from "../../../../../../../ui/src/components/icon-button";
import Image from "../../../../../../../ui/src/components/image";
import Link from "../../../../../../../ui/src/components/link";
import { MultiSelectProps } from "../../../../../../../ui/src/components/multi-select";
import Option from "../../../../../../../ui/src/components/option";
import Spacer from "../../../../../../../ui/src/components/spacer";
import Typography from "../../../../../../../ui/src/components/typography";
import Gallery from "~/entities/gallery";
import EditIcon from "~/icons/Edit";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import TrashIcon from "~/icons/Trash";
import { use_lazy_get_tags_query } from "~/redux/features";

import imageStyles from "../common/image.module.scss";

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
  const splashId = form.watch("splash-id");
  const splashHex = form.watch("splash-hex");

  return (
    <div className={clsx("flex-col", imageStyles.x, imageStyles.block)}>
      <Typography className={"t-bold"} level={"body2"}>
        Splash image
      </Typography>
      <Typography className={"t-minor"} level={"body3"}>
        Including a relevant splash image can attract more readers to your
        story. Please avoid using images with watermarks or low resolution.
        Additionally, ensure that the image adheres to our{" "}
        <Link href={"/guidelines"} target={"_blank"} underline={"always"}>
          Community Guidelines
        </Link>
        .
      </Typography>
      <div
        className={clsx("flex-center", imageStyles.x, imageStyles.container)}
      >
        <AspectRatio
          className={clsx(imageStyles.x, imageStyles.image)}
          ratio={1.77}
        >
          {splashId ? (
            <React.Fragment>
              <Image
                alt={""}
                hex={splashHex}
                img_key={splashId}
                size={ImageSize.W_320}
              />
              <div
                className={clsx(
                  "force-light-mode",
                  "flex-col",
                  imageStyles.x,
                  imageStyles.actions
                )}
              >
                <Gallery
                  on_confirm={(asset): void => {
                    form.setValue("splash-id", asset.key, {
                      shouldDirty: true
                    });
                    form.setValue("splash-hex", asset.hex, {
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
                    form.setValue("splash-id", null, { shouldDirty: true });
                    form.setValue("splash-hex", null, { shouldDirty: true });
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
                form.setValue("splash-id", asset.key, {
                  shouldDirty: true
                });
                form.setValue("splash-hex", asset.hex, {
                  shouldDirty: true
                });
              }}
            >
              <div
                aria-label={"Add a splash image"}
                className={clsx(
                  "flex-center",
                  "full-h",
                  "full-w",
                  imageStyles.x,
                  imageStyles.placeholder
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
  const [getTags, { isError }] = use_lazy_get_tags_query();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadOptionsDebounced = React.useCallback(
    debounce(
      (
        inputValue: Parameters<NonNullable<MultiSelectProps["loadOptions"]>>[0],
        callback: Parameters<NonNullable<MultiSelectProps["loadOptions"]>>[1]
      ) => {
        getTags({ query: inputValue || "" }, true).then(({ data = [] }) =>
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
      color={isError ? "ruby" : "inverted"}
      helper_text={
        <>
          Using tags can make it easier to focus your story on particular topics
          and boost its chances of being seen in search results and
          recommendations.
        </>
      }
      label={"Tags"}
      loadOptions={loadOptionsDebounced}
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
      maxLength={STORY_PROPS.title.maxLength}
      minLength={STORY_PROPS.title.minLength}
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
      maxLength={STORY_PROPS.description.maxLength}
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
