import clsx from "clsx";
import { Provider, useAtom } from "jotai";
import React from "react";

import IconButton from "~/components/IconButton";
import Modal from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import ScrollArea from "~/components/ScrollArea";
import TabPanel from "~/components/TabPanel";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChevronIcon from "~/icons/Chevron";
import FileIcon from "~/icons/file";
import ScriptIcon from "~/icons/Script";
import SeoIcon from "~/icons/seo";
import SettingsIcon from "~/icons/Settings";
import StoryIcon from "~/icons/Story";
import { breakpoints } from "~/theme/breakpoints";

import {
  navSegmentAtom,
  sidebarTabAtom,
  StoryMetadataModalSidebarTabsValue
} from "./core/atoms";
import GeneralTab from "./core/components/general";
import NavigationScreen from "./core/components/navigation-screen/navigation-screen";
import { useResetStoryMetadataModalAtoms } from "./core/hooks/use-reset-story-metadata-modal-atoms";
import styles from "./metadata-modal.module.scss";
import { StoryMetadataModalProps } from "./metadata-modal.props";

// Footer

const Footer = (): React.ReactElement => {
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  return (
    <>
      <ModalFooterButton compact={isSmallerThanTablet} variant={"ghost"}>
        Cancel
      </ModalFooterButton>
      <ModalFooterButton compact={isSmallerThanTablet}>
        Confirm
      </ModalFooterButton>
    </>
  );
};

const StoryMetadataModalImpl = (
  props: StoryMetadataModalProps
): React.ReactElement => {
  const { children, story } = props;
  const resetAtoms = useResetStoryMetadataModalAtoms();
  const [open, setOpen] = React.useState<boolean>(false);
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const [navSegment, setNavSegment] = useAtom(navSegmentAtom);
  const [value, setValue] = useAtom(sidebarTabAtom);

  /**
   * Resets the modal state
   */
  const reset = React.useCallback(() => {
    resetAtoms();
  }, [resetAtoms]);

  return (
    <Modal
      footer={<Footer />}
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
            <ModalSidebarItem decorator={<ScriptIcon />} value={"license"}>
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
          viewport: { className: clsx("flex-col", styles.x, styles.viewport) }
        }}
      >
        {isSmallerThanTablet ? (
          {
            home: <NavigationScreen />,
            general: <GeneralTab story={story} />,
            seo: <p>TAB</p>,
            license: <p>TAB</p>,
            settings: <p>Settings</p>
          }[navSegment]
        ) : (
          <React.Fragment>
            <TabPanel
              className={clsx("flex-col", styles.x, styles["tab-panel"])}
              tabIndex={-1}
              value={"general"}
            >
              <GeneralTab story={story} />
            </TabPanel>
          </React.Fragment>
        )}
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
