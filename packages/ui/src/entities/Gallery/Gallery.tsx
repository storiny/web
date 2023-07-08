import React from "react";

import Modal from "~/components/Modal";
import { Description } from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import Spacer from "~/components/Spacer";
import TabPanel from "~/components/TabPanel";
import AlbumIcon from "~/icons/Album";
import PexelsIcon from "~/icons/Pexels";
import PhotoSearchIcon from "~/icons/PhotoSearch";
import UploadIcon from "~/icons/Upload";

import ImagePreview from "./core/components/Preview";
import SearchInput from "./core/components/SearchInput";
import PexelsTab from "./core/tabs/Pexels";
import styles from "./Gallery.module.scss";
import { GalleryProps } from "./Gallery.props";

export type GallerySidebarTabsValue = "pexels" | "library" | "upload";

const Gallery = (props: GalleryProps): React.ReactElement => {
  const { children } = props;
  const [value, setValue] = React.useState<GallerySidebarTabsValue>("pexels");

  return (
    <Modal
      footer={
        <>
          <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
          <ModalFooterButton>Confirm</ModalFooterButton>
        </>
      }
      mode={"tabbed"}
      open
      sidebar={
        <>
          <SearchInput disabled={value !== "pexels"} />
          <Spacer orientation={"vertical"} size={1} />
          <ModalSidebarList>
            <ModalSidebarItem decorator={<PexelsIcon />} value={"pexels"}>
              Pexels
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
        tabs: { defaultValue: "pexels" },
        content: { style: { minHeight: "45vh", minWidth: "40vw" } },
        body: {
          className: styles.body
        },
        container: {
          value,
          onValueChange: (newValue) =>
            setValue(newValue as GallerySidebarTabsValue)
        },
        header: { decorator: <PhotoSearchIcon />, children: "Gallery" }
      }}
      trigger={children}
    >
      <TabPanel className={styles["tab-panel"]} value={"pexels"}>
        <PexelsTab />
      </TabPanel>
      <TabPanel value={"library"}>
        <Description>Second tab panel</Description>
      </TabPanel>
      <TabPanel value={"upload"}>
        <Description>Third tab panel</Description>
      </TabPanel>
    </Modal>
  );
};

export default Gallery;
