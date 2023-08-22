import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import IconButton from "~/components/IconButton";
import Modal from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import Spacer from "~/components/Spacer";
import TabPanel from "~/components/TabPanel";
import NavigationScreen from "~/entities/Gallery/core/components/NavigationScreen/NavigationScreen";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import AlbumIcon from "~/icons/Album";
import ChevronIcon from "~/icons/Chevron";
import PenIcon from "~/icons/Pen";
import PexelsIcon from "~/icons/Pexels";
import PhotoSearchIcon from "~/icons/PhotoSearch";
import UploadIcon from "~/icons/Upload";
import { breakpoints } from "~/theme/breakpoints";

import {
  GallerySidebarTabsValue,
  navSegmentAtom,
  queryAtom,
  selectedAtom,
  sidebarTabAtom
} from "./core/atoms";
import GalleryMasonry from "./core/components/Masonry";
import ImagePreview from "./core/components/Preview";
import SearchInput from "./core/components/SearchInput";
import Whiteboard from "./core/components/Whiteboard";
import WhiteboardUploader from "./core/components/Whiteboard/Uploader";
import { FileWithPreview } from "./core/types";
import styles from "./Gallery.module.scss";
import { GalleryProps } from "./Gallery.props";

const UploadsTab = dynamic(() => import("./core/components/Uploads"), {
  loading: dynamicLoader()
});

// Footer

const GalleryFooter = (
  props: Pick<GalleryProps, "onConfirm" | "onCancel">
): React.ReactElement => {
  const { onConfirm, onCancel } = props;
  const selected = useAtomValue(selectedAtom);
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));

  return (
    <>
      <ModalFooterButton
        compact={isSmallerThanTablet}
        onClick={(): void => {
          if (onCancel) {
            onCancel();
          }
        }}
        variant={"ghost"}
      >
        Cancel
      </ModalFooterButton>
      <ModalFooterButton
        compact={isSmallerThanTablet}
        disabled={!selected}
        onClick={(): void => {
          if (onConfirm) {
            onConfirm(selected!);
          }
        }}
      >
        Confirm
      </ModalFooterButton>
    </>
  );
};

const Gallery = (props: GalleryProps): React.ReactElement => {
  const { children, onConfirm, onCancel } = props;
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const uploadImageUrl = React.useRef<string | null>(null);
  const [navSegment, setNavSegment] = useAtom(navSegmentAtom);
  const [whiteboardUploading, setWhiteboardUploading] =
    React.useState<boolean>(false);
  const [uploaderProps, setUploaderProps] = React.useState<{
    alt: string;
    file: FileWithPreview;
  } | null>(null);
  const [value, setValue] = useAtom(sidebarTabAtom);
  const setQuery = useSetAtom(queryAtom);
  const fullscreen = value === "whiteboard" && !whiteboardUploading;

  return (
    <Modal
      footer={<GalleryFooter {...{ onConfirm, onCancel }} />}
      fullscreen={isSmallerThanTablet || fullscreen}
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
          <Spacer orientation={"vertical"} />
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
            display: fullscreen || isSmallerThanTablet ? "none" : "flex"
          }
        },
        content: {
          style: {
            minHeight: "45vh",
            width: "40vw",
            minWidth: fullscreen || isSmallerThanTablet ? "100%" : "640px"
          }
        },
        body: {
          className: styles.body
        },
        closeButton: {
          style: { display: fullscreen ? "none" : "flex" }
        },
        header: {
          decorator:
            !isSmallerThanTablet || navSegment === "home" ? (
              <PhotoSearchIcon />
            ) : (
              <IconButton
                aria-label={"Go to main screen"}
                onClick={(): void => setNavSegment("home")}
                variant={"ghost"}
              >
                <ChevronIcon rotation={-90} />
              </IconButton>
            ),
          children: "Gallery",
          style: { display: fullscreen ? "none" : "flex" }
        },
        footer: {
          compact: isSmallerThanTablet,
          style: {
            display: fullscreen ? "none" : "flex"
          }
        }
      }}
      trigger={children}
    >
      {isSmallerThanTablet ? (
        {
          home: <NavigationScreen />,
          pexels: <GalleryMasonry tab={"pexels"} />,
          library: <GalleryMasonry tab={"library"} />,
          upload: <UploadsTab disableWhiteboardPrompt />
        }[navSegment]
      ) : (
        <React.Fragment>
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
            {whiteboardUploading && uploaderProps ? (
              <WhiteboardUploader
                alt={uploaderProps.alt}
                file={uploaderProps.file}
                onReset={(): void => {
                  setUploaderProps(null);
                  setWhiteboardUploading(false);
                }}
              />
            ) : (
              <Whiteboard
                initialImageUrl={uploadImageUrl.current}
                onCancel={(): void => {
                  setUploaderProps(null);
                  setWhiteboardUploading(false);
                  setValue("pexels");
                }}
                onConfirm={(file, alt): void => {
                  Object.assign(file, { preview: URL.createObjectURL(file) });
                  setUploaderProps({ file, alt } as {
                    alt: string;
                    file: FileWithPreview;
                  });
                  setWhiteboardUploading(true);
                }}
                onMount={(): void => {
                  uploadImageUrl.current = null;
                }}
              />
            )}
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
            <UploadsTab
              onOpenInWhiteboard={(blobUrl): void => {
                uploadImageUrl.current = blobUrl;
                setValue("whiteboard");
              }}
            />
          </TabPanel>
        </React.Fragment>
      )}
    </Modal>
  );
};

export default Gallery;
