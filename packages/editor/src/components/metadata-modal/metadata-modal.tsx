import clsx from "clsx";
import { Provider, useAtom as use_atom } from "jotai";
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
import ChevronIcon from "../../../../ui/src/icons/chevron";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "../../../../ui/src/icons/settings";
import StoryIcon from "../../../../ui/src/icons/story";
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
import { use_reset_story_metadata_modal_atoms } from "./core/hooks/use-reset-story-metadata-modal-atoms";
import styles from "./metadata-modal.module.scss";
import { StoryMetadataModalProps } from "./metadata-modal.props";
import { StoryMetadataSchema, STORY_METADATA_SCHEMA } from "./schema";

const StoryMetadataModalImpl = (
  props: StoryMetadataModalProps
): React.ReactElement => {
  const { children, story, set_story } = props;
  const toast = use_toast();
  const reset_atoms = use_reset_story_metadata_modal_atoms();
  const [open, set_open] = React.useState<boolean>(false);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [nav_segment, set_nav_segment] = use_atom(nav_segment_atom);
  const [value, set_value] = use_atom(sidebar_tab_atom);
  const form = use_form<StoryMetadataSchema>({
    defaultValues: {
      age_restriction: story.age_restriction,
      canonical_url: story.canonical_url,
      category: story.category,
      description: story.description,
      disable_comments: story.disable_comments,
      disable_public_revision_history: story.disable_public_revision_history,
      disable_toc: story.disable_toc,
      license: story.license,
      preview_image: story.preview_image,
      seo_description: story.seo_description,
      seo_title: story.seo_title,
      splash_hex: story.splash_hex,
      splash_id: story.splash_id,
      tags: story.tags.map(({ name }) => name),
      title: story.title,
      visibility: story.visibility
    },
    resolver: zod_resolver(STORY_METADATA_SCHEMA)
  });
  const [mutate_story_metadata, { isLoading: is_loading }] =
    use_story_metadata_mutation();

  /**
   * Resets the modal state
   */
  const reset = React.useCallback(
    (values?: StoryMetadataSchema) => {
      reset_atoms();
      form.reset(values);
    },
    [form, reset_atoms]
  );

  const handle_submit: SubmitHandler<StoryMetadataSchema> = (values) => {
    mutate_story_metadata({ ...values, id: story.id })
      .unwrap()
      .then((res) => {
        set_open(false);
        set_story(res);
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
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      }
      fullscreen={is_smaller_than_tablet}
      mode={"tabbed"}
      onOpenChange={(open): void => {
        set_open(open);
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
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          onValueChange: (
            next_value: StoryMetadataModalSidebarTabsValue
          ): void => {
            set_value(next_value);
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
            !is_smaller_than_tablet || nav_segment === "home" ? (
              <StoryIcon />
            ) : (
              <IconButton
                aria-label={"Go to main screen"}
                onClick={(): void => set_nav_segment("home")}
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
          on_submit={handle_submit}
          provider_props={form}
        >
          {is_smaller_than_tablet ? (
            {
              home: <NavigationScreen />,
              general: <GeneralTab />,
              seo: <SeoTab />,
              license: <LicenseTab />,
              settings: <SettingsTab />
            }[nav_segment]
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
