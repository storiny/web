import {
  CATEGORY_ICON_MAP,
  CATEGORY_LABEL_MAP,
  StoryCategory
} from "@storiny/shared";
import { clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
import React from "react";

import Logo from "~/brand/Logo";
import SuspenseLoader from "~/common/suspense-loader";
import Chip from "~/components/Chip";
import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import Modal, { ModalFooterButton } from "~/components/Modal";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Stepper from "~/components/Stepper";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CheckIcon from "~/icons/Check";
import PlusIcon from "~/icons/Plus";
import {
  boolean_action,
  GetOnboardingTagsResponse,
  getQueryErrorType,
  useGetOnboardingTagsQuery
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

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
              setSelectedCategories((prevState) => {
                if (prevState.has(category)) {
                  prevState.delete(category);
                } else {
                  prevState.add(category);
                }

                return new Set(prevState);
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
  const dispatch = useAppDispatch();
  const isFollowing = useAppSelector(
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
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetOnboardingTagsQuery(categoriesHash);

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
        slotProps={{
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
            autoSize
            componentProps={{
              button: { loading: isFetching }
            }}
            retry={refetch}
            type={getQueryErrorType(error)}
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
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
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
          {!isSmallerThanMobile && segment === "categories" ? (
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
            <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
              Skip
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={isSmallerThanMobile}
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
      fullscreen={isSmallerThanMobile}
      onOpenChange={setOpen}
      open={open}
      slotProps={{
        header: {
          decorator: <Logo size={16} />,
          children: "Welcome to Storiny"
        },
        footer: {
          compact: isSmallerThanMobile
        },
        body: {
          className: "flex-col"
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "600px"
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
        activeSteps={segment === "categories" ? 1 : segment === "tags" ? 2 : 3}
        totalSteps={3}
      />
    </Modal>
  );
};

export default Onboarding;
