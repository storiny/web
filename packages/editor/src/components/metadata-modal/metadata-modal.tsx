import clsx from "clsx";
import { Provider, useAtom as use_atom } from "jotai";
import React from "react";

import { use_app_router } from "~/common/utils";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import IconButton from "~/components/icon-button";
import Modal from "~/components/modal";
import ModalFooterButton from "~/components/modal/footer-button";
import ModalSidebarItem from "~/components/modal/sidebar-item";
import ModalSidebarList from "~/components/modal/sidebar-list";
import ScrollArea from "~/components/scroll-area";
import TabPanel from "~/components/tab-panel";
import { use_toast } from "~/components/toast";
import { use_media_query } from "~/hooks/use-media-query";
import BlogIcon from "~/icons/blog";
import ChevronIcon from "~/icons/chevron";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/settings";
import StoryIcon from "~/icons/story";
import { use_story_metadata_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_form_dirty_fields } from "~/utils/get-form-dirty-fields";
import { handle_api_error } from "~/utils/handle-api-error";
import { is_form_error } from "~/utils/is-form-error";

import {
  nav_segment_atom,
  sidebar_tab_atom,
  StoryMetadataModalSidebarTabsValue
} from "./core/atoms";
import BlogTab from "./core/components/blog";
import GeneralTab from "./core/components/general";
import LicenseTab from "./core/components/license";
import NavigationScreen from "./core/components/navigation-screen/navigation-screen";
import SeoTab from "./core/components/seo";
import SettingsTab from "./core/components/settings";
import { use_reset_story_metadata_modal_atoms } from "./core/hooks/use-reset-story-metadata-modal-atoms";
import styles from "./metadata-modal.module.scss";
import { StoryMetadataModalProps } from "./metadata-modal.props";
import { STORY_METADATA_SCHEMA, StoryMetadataSchema } from "./schema";

const StoryMetadataModalImpl = (
  props: StoryMetadataModalProps
): React.ReactElement => {
  const { children, story, set_story } = props;
  const toast = use_toast();
  const router = use_app_router();
  const reset_atoms = use_reset_story_metadata_modal_atoms();
  const [open, set_open] = React.useState<boolean>(false);
  const [done, set_done] = React.useState<boolean>(false);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [nav_segment, set_nav_segment] = use_atom(nav_segment_atom);
  const [value, set_value] = use_atom(sidebar_tab_atom);
  // Since fields marked as `optional` in protobuf defs are returned as
  // `undefined`, we need to convert them to `null` values.
  const form = use_form<StoryMetadataSchema>({
    defaultValues: {
      age_restriction: story.age_restriction,
      canonical_url: story.canonical_url || null,
      category: story.category,
      description: story.description || null,
      disable_comments: story.disable_comments,
      disable_public_revision_history: story.disable_public_revision_history,
      disable_toc: story.disable_toc,
      license: story.license,
      preview_image: story.preview_image || null,
      seo_description: story.seo_description || null,
      seo_title: story.seo_title || null,
      splash_hex: story.splash_hex || null,
      splash_id: story.splash_id || null,
      tags: story.tags.map(({ name }) => name),
      title: story.title,
      visibility: story.visibility,
      blog_id: story.blog?.id
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
    const modified_values = get_form_dirty_fields(
      form.formState.dirtyFields,
      values
    );

    mutate_story_metadata({
      ...modified_values,
      // `splash_hex` is not needed in the request
      splash_hex: undefined,
      id: story.id
    })
      .unwrap()
      .then((res) => {
        reset(values);

        if (res.has_blog_modified) {
          set_done(true);

          return router.refresh();
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { blog_id: _, ...other } = values;

        set_open(false);
        set_story({
          ...story,
          ...other,
          id: story.id,
          // We simply use the tag's name as the ID since the ID part is not
          // used anywhere in the editor.
          tags: values.tags.map((tag) => ({ id: tag, name: tag }))
        });

        // Update document title
        document.title = `Editing ${values.title || story.title} — Storiny`;

        toast("Story metadata updated", "success");
      })
      .catch((error) => {
        if (is_form_error(error)) {
          const error_fields = error.data?.errors.map((item) => item[0]);

          if (
            (
              [
                "canonical_url",
                "seo_title",
                "seo_description"
              ] as (keyof StoryMetadataSchema)[]
            ).some((field) => error_fields.includes(field))
          ) {
            set_nav_segment("seo");
          } else if (
            error_fields.includes("license" as keyof StoryMetadataSchema)
          ) {
            set_nav_segment("license");
          } else if (
            (
              [
                "visibility",
                "disable_comments",
                "disable_toc",
                "disable_public_revision_history"
              ] as (keyof StoryMetadataSchema)[]
            ).some((field) => error_fields.includes(field))
          ) {
            set_nav_segment("settings");
          } else {
            set_nav_segment("general");
          }
        }

        handle_api_error(
          error,
          toast,
          form,
          "Could not modify the story metadata"
        );
      });
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
            disabled={done || !form.formState.isDirty}
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
            <ModalSidebarItem decorator={<BlogIcon />} value={"blog"}>
              Blog
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
          onValueChange: (next_value): void => {
            set_value(next_value as StoryMetadataModalSidebarTabsValue);
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
              blog: <BlogTab />,
              general: <GeneralTab />,
              seo: <SeoTab />,
              license: <LicenseTab />,
              settings: <SettingsTab />
            }[nav_segment]
          ) : (
            <React.Fragment>
              <TabPanel
                className={clsx(css["flex-col"], styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"general"}
              >
                <GeneralTab />
              </TabPanel>
              <TabPanel
                className={clsx(css["flex-col"], styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"blog"}
              >
                <BlogTab />
              </TabPanel>
              <TabPanel
                className={clsx(css["flex-col"], styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"seo"}
              >
                <SeoTab />
              </TabPanel>
              <TabPanel
                className={clsx(css["flex-col"], styles.x, styles["tab-panel"])}
                tabIndex={-1}
                value={"license"}
              >
                <LicenseTab />
              </TabPanel>
              <TabPanel
                className={clsx(css["flex-col"], styles.x, styles["tab-panel"])}
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
