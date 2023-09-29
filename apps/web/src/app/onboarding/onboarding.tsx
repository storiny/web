import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  StoryCategory
} from "@storiny/shared";
import { clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
import React from "react";

import Logo from "../../../../../packages/ui/src/brand/logo";
import SuspenseLoader from "~/common/suspense-loader";
import Chip from "../../../../../packages/ui/src/components/chip";
import Divider from "../../../../../packages/ui/src/components/divider";
import Grow from "../../../../../packages/ui/src/components/grow";
import Modal, {
  ModalFooterButton
} from "../../../../../packages/ui/src/components/modal";
import ScrollArea from "../../../../../packages/ui/src/components/scroll-area";
import Spacer from "../../../../../packages/ui/src/components/spacer";
import Stepper from "../../../../../packages/ui/src/components/stepper";
import Typography from "../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../packages/ui/src/entities/error-state";
import { use_media_query } from "../../../../../packages/ui/src/hooks/use-media-query";
import CheckIcon from "../../../../../packages/ui/src/icons/check";
import PlusIcon from "../../../../../packages/ui/src/icons/plus";
import {
  boolean_action,
  get_query_error_type,
  GetOnboardingTagsResponse,
  use_get_onboarding_tags_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./onboarding.module.scss";

// Segment block

const Segment = ({
  title,
  description,
  children
}: {
  children: React.ReactNode;
  description: React.ReactNode;
  title: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <Typography as={"p"} className={"t-center"} level={"h3"}>
      {title}
    </Typography>
    <Spacer orientation={"vertical"} />
    <Typography className={clsx("t-center", "t-minor")} level={"body2"}>
      {description}
    </Typography>
    <Spacer orientation={"vertical"} size={7} />
    {children}
    <Spacer className={"f-grow"} orientation={"vertical"} size={7} />
  </React.Fragment>
);

// Categories segment

const CategoriesSegment = ({
  selectedCategories,
  setSelectedCategories
}: {
  selectedCategories: Set<StoryCategory>;
  setSelectedCategories: React.Dispatch<
    React.SetStateAction<Set<StoryCategory>>
  >;
}): React.ReactElement => (
  <Segment
    description={"Please select at least three categories that interest you."}
    title={"Personalize your experience"}
  >
    <div className={clsx("flex-center", styles.categories)}>
      {Object.values(StoryCategory).map((category) =>
        category === StoryCategory.OTHERS ? null : (
          <Chip
            decorator={CATEGORY_ICON_MAP[category]}
            key={category}
            onClick={(): void =>
              setSelectedCategories((prev_state) => {
                if (prev_state.has(category)) {
                  prev_state.delete(category);
                } else {
                  prev_state.add(category);
                }

                return new Set(prev_state);
              })
            }
            size={"lg"}
            type={"clickable"}
            variant={selectedCategories.has(category) ? "rigid" : "soft"}
          >
            {CATEGORY_LABEL_MAP[category]}
          </Chip>
        )
      )}
    </div>
  </Segment>
);

// Tag component

const Tag = ({
  tagName,
  tagId
}: {
  tagId: string;
  tagName: string;
}): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const isFollowing = use_app_selector(
    (state) => state.entities.followedTags[tagId]
  );

  return (
    <Chip
      className={clsx("flex-center", styles.tag)}
      onClick={(): void => {
        dispatch(boolean_action("followed_tags", tagId));
      }}
      type={"clickable"}
      variant={isFollowing ? "rigid" : "soft"}
    >
      {tagName}
      {isFollowing ? <CheckIcon /> : <PlusIcon />}
    </Chip>
  );
};

// Tags segment

const TagsSegment = ({
  categoriesHash
}: {
  categoriesHash: string;
}): React.ReactElement => {
  const { data, isLoading, is_fetching, isError, error, refetch } =
    use_get_onboarding_tags_query(categoriesHash);

  return (
    <Segment
      description={
        <>
          You can narrow down your interests by following some tags we curated
          based on the categories you selected in the previous step.
        </>
      }
      title={"Follow some tags"}
    >
      <ScrollArea
        slot_props={{
          scrollbar: {
            className: clsx(styles.x, styles["scroll-area-scrollbar"])
          },
          viewport: {
            className: clsx(
              "flex-center",
              styles.x,
              styles["scroll-area-viewport"]
            )
          }
        }}
      >
        {isLoading ? (
          <SuspenseLoader />
        ) : isError ? (
          <ErrorState
            auto_size
            component_props={{
              button: { loading: is_fetching }
            }}
            retry={refetch}
            type={get_query_error_type(error)}
          />
        ) : (
          <div className={"flex-col"}>
            {Object.entries(data || ({} as GetOnboardingTagsResponse)).map(
              ([category, tags]) => (
                <React.Fragment key={category}>
                  <div
                    className={clsx(
                      "flex-col",
                      styles["category-tags-container"]
                    )}
                  >
                    <div className={styles["category-tags-label"]}>
                      {CATEGORY_ICON_MAP[category]}
                      <Typography
                        className={clsx("t-minor", "t-medium")}
                        level={"body2"}
                      >
                        {CATEGORY_LABEL_MAP[category]}
                      </Typography>
                    </div>
                    <div
                      className={clsx(
                        "flex-center",
                        styles["category-tags-content"]
                      )}
                    >
                      {tags.map((tag) => (
                        <Tag key={tag.id} tagId={tag.id} tagName={tag.name} />
                      ))}
                    </div>
                  </div>
                  <Divider className={"hide-last"} />
                </React.Fragment>
              )
            )}
          </div>
        )}
      </ScrollArea>
    </Segment>
  );
};

const Onboarding = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [open, setOpen] = React.useState<boolean>(true);
  const [segment, setSegment] = React.useState<
    "categories" | "tags" | "writers"
  >("tags"); // TODO: change
  const [selectedCategories, setSelectedCategories] = React.useState<
    Set<StoryCategory>
  >(new Set([]));
  const categoriesHash = React.useMemo(
    () =>
      compressToEncodedURIComponent(Array.from(selectedCategories).join("|")),
    [selectedCategories]
  );

  const setSelectedCategoriesImpl = React.useCallback(setSelectedCategories, [
    setSelectedCategories
  ]);

  return (
    <Modal
      footer={
        <React.Fragment>
          {!is_smaller_than_mobile && segment === "categories" ? (
            <React.Fragment>
              <Typography className={"t-minor"} level={"body2"}>
                {selectedCategories.size <= 3
                  ? `${selectedCategories.size} of 3 selected`
                  : `${selectedCategories.size} selected`}
              </Typography>
              <Grow />
            </React.Fragment>
          ) : null}
          {segment !== "writers" && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Skip
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={selectedCategories.size < 3}
            onClick={(event): void => {
              if (segment === "categories") {
                event.preventDefault();
                setSegment("tags");
              } else if (segment === "tags") {
                event.preventDefault();
                setSegment("writers");
              }
            }}
          >
            {segment === "writers" ? "Finish" : "Continue"}
          </ModalFooterButton>
        </React.Fragment>
      }
      fullscreen={is_smaller_than_mobile}
      onOpenChange={setOpen}
      open={open}
      slot_props={{
        header: {
          decorator: <Logo size={16} />,
          children: "Welcome to Storiny"
        },
        footer: {
          compact: is_smaller_than_mobile
        },
        body: {
          className: "flex-col"
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "600px"
          }
        }
      }}
    >
      {
        {
          categories: (
            <CategoriesSegment
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategoriesImpl}
            />
          ),
          tags: <TagsSegment categoriesHash={categoriesHash} />
        }[segment]
      }
      <Stepper
        active_steps={segment === "categories" ? 1 : segment === "tags" ? 2 : 3}
        total_steps={3}
      />
    </Modal>
  );
};

export default Onboarding;
