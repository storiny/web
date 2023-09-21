import { ImageSize, StoryCategory } from "@storiny/shared";
import { CATEGORY_ICON_MAP } from "@storiny/shared/src/constants/category-icon-map";
import {
  MAX_STORY_TAGS,
  STORY_PROPS
} from "@storiny/shared/src/constants/story";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import { useFormContext } from "~/components/Form";
import FormMultiSelect from "~/components/form-multi-select";
import FormInput from "~/components/FormInput";
import FormSelect from "~/components/FormSelect";
import FormTextarea from "~/components/FormTextarea";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Link from "~/components/Link";
import { MultiSelectProps } from "~/components/MultiSelect";
import Option from "~/components/Option";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import Gallery from "~/entities/gallery";
import EditIcon from "~/icons/Edit";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import TrashIcon from "~/icons/Trash";
import { useLazyGetTagsQuery } from "~/redux/features";

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
  const form = useFormContext();
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
                imgId={splashId}
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
                  onConfirm={(asset): void => {
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
                    autoSize
                    title={"Change splash"}
                  >
                    <EditIcon />
                  </IconButton>
                </Gallery>
                <Spacer orientation={"vertical"} />
                <IconButton
                  aria-label={"Remove splash"}
                  autoSize
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
              onConfirm={(asset): void => {
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
  const [getTags, { isError }] = useLazyGetTagsQuery();
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
      autoSize
      color={isError ? "ruby" : "inverted"}
      helperText={
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
      autoSize
      helperText={
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
      helperText={
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
      autoSize
      helperText={"Select a category that best describes this story."}
      label={"Category"}
      name={"category"}
      required
      slotProps={{
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
      <Option decorator={CATEGORY_ICON_MAP.others} value={StoryCategory.OTHERS}>
        Others
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP["science-and-technology"]}
        value={StoryCategory.SCIENCE_AND_TECHNOLOGY}
      >
        Science & technology
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP.programming}
        value={StoryCategory.PROGRAMMING}
      >
        Programming
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP.lifestyle}
        value={StoryCategory.LIFESTYLE}
      >
        Lifestyle
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP["health-and-wellness"]}
        value={StoryCategory.HEALTH_AND_WELLNESS}
      >
        Health & wellness
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP.entertainment}
        value={StoryCategory.ENTERTAINMENT}
      >
        Entertainment
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP["digital-graphics"]}
        value={StoryCategory.DIGITAL_GRAPHICS}
      >
        Digital graphics
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.travel} value={StoryCategory.TRAVEL}>
        Travel
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.diy} value={StoryCategory.DIY}>
        DIY
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.news} value={StoryCategory.NEWS}>
        News
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.sports} value={StoryCategory.SPORTS}>
        Sports
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.gaming} value={StoryCategory.GAMING}>
        Gaming
      </Option>
      <Option decorator={CATEGORY_ICON_MAP.music} value={StoryCategory.MUSIC}>
        Music
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP.learning}
        value={StoryCategory.LEARNING}
      >
        Learning
      </Option>
      <Option
        decorator={CATEGORY_ICON_MAP["business-and-finance"]}
        value={StoryCategory.BUSINESS_AND_FINANCE}
      >
        Business & finance
      </Option>
    </FormSelect>
  </React.Fragment>
);

export default GeneralTab;
