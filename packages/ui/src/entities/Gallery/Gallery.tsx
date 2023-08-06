import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Modal from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import Spacer from "~/components/Spacer";
import TabPanel from "~/components/TabPanel";
import AlbumIcon from "~/icons/Album";
import PenIcon from "~/icons/Pen";
import PexelsIcon from "~/icons/Pexels";
import PhotoSearchIcon from "~/icons/PhotoSearch";
import UploadIcon from "~/icons/Upload";

import { queryAtom, selectedAtom } from "./core/atoms";
import GalleryMasonry from "./core/components/Masonry";
import ImagePreview from "./core/components/Preview";
import SearchInput from "./core/components/SearchInput";
import Whiteboard from "./core/components/Whiteboard";
import styles from "./Gallery.module.scss";
import { GalleryProps } from "./Gallery.props";

const UploadsTab = dynamic(() => import("./core/components/Uploads"), {
  loading: () => <SuspenseLoader />
});

export type GallerySidebarTabsValue =
  | "pexels"
  | "whiteboard"
  | "library"
  | "upload";

// Footer

const GalleryFooter = (): React.ReactElement => {
  const selected = useAtomValue(selectedAtom);
  return (
    <>
      <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
      <ModalFooterButton disabled={!selected}>Confirm</ModalFooterButton>
    </>
  );
};

const Gallery = (props: GalleryProps): React.ReactElement => {
  const { children } = props;
  const [value, setValue] = React.useState<GallerySidebarTabsValue>("pexels");
  const setQuery = useSetAtom(queryAtom);
  const fullscreen = value === "whiteboard";

  return (
    <Modal
      footer={<GalleryFooter />}
      fullscreen={fullscreen}
      mode={"tabbed"}
      onOpenChange={(open): void => {
        if (!open) {
          // Reset values
          setValue("pexels");
          setQuery("");
        }
      }}
      sidebar={
        <>
          <SearchInput disabled={value !== "pexels"} />
          <Spacer orientation={"vertical"} size={1} />
          <ModalSidebarList>
            <ModalSidebarItem decorator={<PexelsIcon />} value={"pexels"}>
              Pexels
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<PenIcon />} value={"whiteboard"}>
              Whiteboard
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<AlbumIcon />} value={"library"}>
              Library
            </ModalSidebarItem>
            <ModalSidebarItem decorator={<UploadIcon />} value={"upload"}>
              Upload
            </ModalSidebarItem>
          </ModalSidebarList>
          <Spacer className={"f-grow"} orientation={"vertical"} size={4} />
          <ImagePreview />
        </>
      }
      slotProps={{
        tabs: {
          value,
          onValueChange: (newValue): void => {
            setValue(newValue as GallerySidebarTabsValue);
            setQuery("");
          }
        },
        sidebar: {
          style: {
            display: fullscreen ? "none" : "flex"
          }
        },
        content: {
          style: {
            minHeight: "45vh",
            minWidth: "40vw"
          }
        },
        body: {
          className: styles.body
        },
        closeButton: {
          style: { display: fullscreen ? "none" : "flex" }
        },
        header: {
          decorator: <PhotoSearchIcon />,
          children: "Gallery",
          style: { display: fullscreen ? "none" : "flex" }
        },
        footer: {
          style: { display: fullscreen ? "none" : "flex" }
        }
      }}
      trigger={children}
    >
      <TabPanel
        className={clsx("flex-center", styles["tab-panel"])}
        tabIndex={-1}
        value={"pexels"}
      >
        <GalleryMasonry tab={"pexels"} />
      </TabPanel>
      <TabPanel
        className={clsx("flex-center", styles["tab-panel"])}
        tabIndex={-1}
        value={"whiteboard"}
      >
        <Whiteboard
          onCancel={(): void => setValue("pexels")}
          onConfirm={(): void => setValue("pexels")}
        />
      </TabPanel>
      <TabPanel
        className={clsx("flex-center", styles["tab-panel"])}
        tabIndex={-1}
        value={"library"}
      >
        <GalleryMasonry tab={"library"} />
      </TabPanel>
      <TabPanel
        className={clsx("flex-center", styles["tab-panel"])}
        tabIndex={-1}
        value={"upload"}
      >
        <UploadsTab />
      </TabPanel>
    </Modal>
  );
};

export default Gallery;
