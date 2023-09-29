import clsx from "clsx";
import { Provider, useAtom } from "jotai";
import React from "react";

import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../ui/src/components/form";
import IconButton from "../../../../ui/src/components/icon-button";
import Modal from "../../../../ui/src/components/modal";
import ModalFooterButton from "../../../../ui/src/components/modal/footer-button";
import ModalSidebarItem from "../../../../ui/src/components/modal/sidebar-item";
import ModalSidebarList from "../../../../ui/src/components/modal/sidebar-list";
import ScrollArea from "../../../../ui/src/components/scroll-area";
import TabPanel from "../../../../ui/src/components/tab-panel";
import { use_toast } from "../../../../ui/src/components/toast";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import ChevronIcon from "~/icons/Chevron";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/Settings";
import StoryIcon from "~/icons/Story";
import { use_story_metadata_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import {
  nav_segment_atom,
  sidebar_tab_atom,
  StoryMetadataModalSidebarTabsValue
} from "./core/atoms";
import GeneralTab from "./core/components/general";
import LicenseTab from "./core/components/license";
import NavigationScreen from "./core/components/navigation-screen/navigation-screen";
import SeoTab from "./core/components/seo";
import SettingsTab from "./core/components/settings";
import { useResetStoryMetadataModalAtoms } from "./core/hooks/use-reset-story-metadata-modal-atoms";
import styles from "./metadata-modal.module.scss";
import { StoryMetadataModalProps } from "./metadata-modal.props";
import { StoryMetadataSchema, storyMetadataSchema } from "./schema";

const StoryMetadataModalImpl = (
  props: StoryMetadataModalProps
): React.ReactElement => {
  const { children, story, setStory } = props;
  const toast = use_toast();
  const resetAtoms = useResetStoryMetadataModalAtoms();
  const [open, setOpen] = React.useState<boolean>(false);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [navSegment, setNavSegment] = use_atom(nav_segment_atom);
  const [value, setValue] = use_atom(sidebar_tab_atom);
  const form = use_form<StoryMetadataSchema>({
    defaultValues: {
      "age-restriction": story.age_restriction,
      "canonical-url": story.canonical_url,
      category: story.category,
      description: story.description,
      "disable-comments": story.disable_comments,
      "disable-public-revision-history": story.disable_public_revision_history,
      "disable-toc": story.disable_toc,
      license: story.license,
      "preview-image": story.preview_image,
      "seo-description": story.seo_description,
      "seo-title": story.seo_title,
      "splash-hex": story.splash_hex,
      "splash-id": story.splash_id,
      tags: story.tags.map(({ name }) => name),
      title: story.title,
      visibility: story.visibility
    },
    resolver: zod_resolver(storyMetadataSchema)
  });
  const [mutateStoryMetadata, { isLoading }] = use_story_metadata_mutation();

  /**
   * Resets the modal state
   */
  const reset = React.useCallback(
    (values?: StoryMetadataSchema) => {
      resetAtoms();
      form.reset(values);
    },
    [form, resetAtoms]
  );

  const handleSubmit: SubmitHandler<StoryMetadataSchema> = (values) => {
    mutateStoryMetadata({ ...values, id: story.id })
      .unwrap()
      .then((res) => {
        setOpen(false);
        setStory(res);
        reset(values);
        toast("Story metadata updated", "success");
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not modify the story metadata", "error")
      );
  };

  return (
    <Modal
      footer={
        <>
          <ModalFooterButton compact={is_smaller_than_tablet} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_tablet}
            disabled={!form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      }
      fullscreen={is_smaller_than_tablet}
      mode={"tabbed"}
      onOpenChange={(open): void => {
        setOpen(open);
        if (!open) {
          reset();
        }
      }}
      open={open}
      sidebar={
        <>
          <ModalSidebarList>
            <ModalSidebarItem decorator={<FileIcon />} value={"general"}>
              General
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<SeoIcon />} value={"seo"}>
              SEO
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<LicenseIcon />} value={"license"}>
              License
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<SettingsIcon />} value={"settings"}>
              Settings
            </ModalSidebarItem>
          </ModalSidebarList>
        </>
      }
      slot_props={{
        tabs: {
          value,
          onValueChange: (newValue): void => {
            setValue(newValue as StoryMetadataModalSidebarTabsValue);
          }
        },
        sidebar: {
          style: {
            display: is_smaller_than_tablet ? "none" : "flex"
          }
        },
        content: {
          style: {
            width: is_smaller_than_tablet ? "100%" : "600px"
          }
        },
        body: {
          className: clsx(styles.x, styles.body)
        },
        header: {
          decorator:
            !is_smaller_than_tablet || navSegment === "home" ? (
              <StoryIcon />
            ) : (
              <IconButton
                aria-label={"Go to main screen"}
                onClick={(): void => setNavSegment("home")}
                variant={"ghost"}
              >
                <ChevronIcon rotation={-90} />
              </IconButton>
            ),
          children: "Story metadata"
        },
        footer: {
          compact: is_smaller_than_tablet
        }
      }}
      trigger={children}
    >
      <ScrollArea
        className={clsx(styles.x, styles["scroll-area"])}
        slot_props={{
          viewport: { className: clsx(styles.x, styles.viewport) }
        }}
      >
        <Form<StoryMetadataSchema>
          on_submit={handleSubmit}
          provider_props={form}
        >
          {is_smaller_than_tablet ? (
            {
              home: <NavigationScreen />,
              general: <GeneralTab />,
              seo: <SeoTab />,
              license: <LicenseTab />,
              settings: <SettingsTab />
            }[navSegment]
          ) : (
            <React.Fragment>
              <TabPanel
                className={clsx("flex-col", styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"general"}
              >
                <GeneralTab />
              </TabPanel>
              <TabPanel
                className={clsx("flex-col", styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"seo"}
              >
                <SeoTab />
              </TabPanel>
              <TabPanel
                className={clsx("flex-col", styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"license"}
              >
                <LicenseTab />
              </TabPanel>
              <TabPanel
                className={clsx("flex-col", styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"settings"}
              >
                <SettingsTab />
              </TabPanel>
            </React.Fragment>
          )}
        </Form>
      </ScrollArea>
    </Modal>
  );
};

const StoryMetadataModal = (
  props: StoryMetadataModalProps
): React.ReactElement => (
  <Provider>
    <StoryMetadataModalImpl {...props} />
  </Provider>
);

export default StoryMetadataModal;
