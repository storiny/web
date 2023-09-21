import clsx from "clsx";
import { Provider, useAtom } from "jotai";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import IconButton from "~/components/IconButton";
import Modal from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import ScrollArea from "~/components/ScrollArea";
import TabPanel from "~/components/TabPanel";
import { useToast } from "~/components/Toast";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChevronIcon from "~/icons/Chevron";
import FileIcon from "~/icons/file";
import LicenseIcon from "~/icons/license";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/Settings";
import StoryIcon from "~/icons/Story";
import { useStoryMetadataMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import {
  navSegmentAtom,
  sidebarTabAtom,
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
  const toast = useToast();
  const resetAtoms = useResetStoryMetadataModalAtoms();
  const [open, setOpen] = React.useState<boolean>(false);
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const [navSegment, setNavSegment] = useAtom(navSegmentAtom);
  const [value, setValue] = useAtom(sidebarTabAtom);
  const form = useForm<StoryMetadataSchema>({
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
    resolver: zodResolver(storyMetadataSchema)
  });
  const [storyMetadata, { isLoading }] = useStoryMetadataMutation();

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
    storyMetadata({ ...values, id: story.id })
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
          <ModalFooterButton compact={isSmallerThanTablet} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanTablet}
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
      fullscreen={isSmallerThanTablet}
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
      slotProps={{
        tabs: {
          value,
          onValueChange: (newValue): void => {
            setValue(newValue as StoryMetadataModalSidebarTabsValue);
          }
        },
        sidebar: {
          style: {
            display: isSmallerThanTablet ? "none" : "flex"
          }
        },
        content: {
          style: {
            width: isSmallerThanTablet ? "100%" : "600px"
          }
        },
        body: {
          className: clsx(styles.x, styles.body)
        },
        header: {
          decorator:
            !isSmallerThanTablet || navSegment === "home" ? (
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
          compact: isSmallerThanTablet
        }
      }}
      trigger={children}
    >
      <ScrollArea
        className={clsx(styles.x, styles["scroll-area"])}
        slotProps={{
          viewport: { className: clsx(styles.x, styles.viewport) }
        }}
      >
        <Form<StoryMetadataSchema> onSubmit={handleSubmit} providerProps={form}>
          {isSmallerThanTablet ? (
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
