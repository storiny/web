import { Asset } from "@storiny/types";
import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import { Provider, useAtom, useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import IconButton from "~/components/IconButton";
import Modal from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import ModalSidebarItem from "~/components/Modal/SidebarItem";
import ModalSidebarList from "~/components/Modal/SidebarList";
import Spacer from "~/components/Spacer";
import TabPanel from "~/components/TabPanel";
import { useResetGalleryAtoms } from "~/entities/gallery/core/hooks/use-reset-gallery-atoms";
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
  pendingImageAtom,
  queryAtom,
  selectedAtom,
  sidebarTabAtom,
  uploadingAtom
} from "./core/atoms";
import NavigationScreen from "./core/components/navigation-screen/navigation-screen";
import ImagePreview from "./core/components/preview";
import SearchInput from "./core/components/search-input";
import Whiteboard from "./core/components/whiteboard";
import WhiteboardUploader from "./core/components/whiteboard/uploader";
import { FileWithPreview } from "./core/types";
import styles from "./gallery.module.scss";
import { GalleryProps } from "./gallery.props";

const GalleryMasonry = dynamic(() => import("./core/components/masonry"), {
  loading: dynamicLoader()
});

const UploadsTab = dynamic(() => import("./core/components/uploads"), {
  loading: dynamicLoader()
});

// Footer

const GalleryFooter = (
  props: Pick<GalleryProps, "onConfirm" | "onCancel">
): React.ReactElement => {
  const { onConfirm, onCancel } = props;
  const selected = useAtomValue(selectedAtom);
  const uploading = useAtomValue(uploadingAtom);
  const [pendingImage, setPendingImage] = useAtom(pendingImageAtom);
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
        disabled={!selected || Boolean(pendingImage) || uploading}
        onClick={(event): void => {
          if (selected?.source === "pexels") {
            event.preventDefault(); // Prevent closing of modal
            setPendingImage(selected?.key || null);
          } else if (onConfirm && selected) {
            onConfirm({
              width: selected.width,
              height: selected.height,
              rating: selected.rating,
              key: selected.key,
              alt: selected.alt,
              hex: selected.hex
            });
          }
        }}
      >
        {selected?.source === "pexels" ? "Upload" : "Confirm"}
      </ModalFooterButton>
    </>
  );
};

const GalleryImpl = (props: GalleryProps): React.ReactElement => {
  const { children, onConfirm, onCancel } = props;
  const resetAtoms = useResetGalleryAtoms();
  const [open, setOpen] = React.useState<boolean>(false);
  const [uploaderProps, setUploaderProps] = React.useState<{
    alt: string;
    file: FileWithPreview;
  } | null>(null);
  const uploadImageUrl = React.useRef<string | null>(null);
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const [navSegment, setNavSegment] = useAtom(navSegmentAtom);
  const [whiteboardUploading, setWhiteboardUploading] =
    React.useState<boolean>(false);
  const [value, setValue] = useAtom(sidebarTabAtom);
  const selected = useAtomValue(selectedAtom);
  const setQuery = useSetAtom(queryAtom);
  const uploading = useAtomValue(uploadingAtom);
  const fullscreen = value === "whiteboard" && !whiteboardUploading;

  /**
   * Resets the gallery state
   */
  const reset = React.useCallback(() => {
    resetAtoms();
    setUploaderProps(null);
    setWhiteboardUploading(false);
  }, [resetAtoms]);

  /**
   * Handles Pexels image upload
   * @param asset Asset
   */
  const handlePexelsUpload = React.useCallback(
    (asset: Asset): void => {
      onConfirm?.({
        hex: asset.hex,
        key: asset.key,
        rating: asset.rating,
        height: asset.height,
        width: asset.width,
        alt: asset.alt,
        credits: selected?.credits
      });
      setOpen(false);
      reset();
    },
    [onConfirm, reset, selected?.credits]
  );

  return (
    <Modal
      footer={<GalleryFooter {...{ onConfirm, onCancel }} />}
      fullscreen={isSmallerThanTablet || fullscreen}
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
          <SearchInput disabled={value !== "pexels"} />
          <Spacer orientation={"vertical"} />
          <ModalSidebarList>
            <ModalSidebarItem
              decorator={<PexelsIcon />}
              disabled={uploading}
              value={"pexels"}
            >
              Pexels
            </ModalSidebarItem>
            <ModalSidebarItem
              decorator={<PenIcon />}
              disabled={uploading}
              value={"whiteboard"}
            >
              Whiteboard
            </ModalSidebarItem>
            <ModalSidebarItem
              decorator={<AlbumIcon />}
              disabled={uploading}
              value={"library"}
            >
              Library
            </ModalSidebarItem>
            <ModalSidebarItem
              decorator={<UploadIcon />}
              disabled={uploading}
              value={"upload"}
            >
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
                disabled={uploading}
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
          pexels: (
            <GalleryMasonry
              onPexelsUploadFinish={handlePexelsUpload}
              tab={"pexels"}
            />
          ),
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
            <GalleryMasonry
              onPexelsUploadFinish={handlePexelsUpload}
              tab={"pexels"}
            />
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

const Gallery = (props: GalleryProps): React.ReactElement => (
  <Provider>
    <GalleryImpl {...props} />
  </Provider>
);

export default Gallery;
