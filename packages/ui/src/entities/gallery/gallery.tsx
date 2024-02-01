import { Asset } from "@storiny/types";
import { dynamic_loader } from "@storiny/web/src/common/dynamic";
import clsx from "clsx";
import {
  Provider,
  useAtom as use_atom,
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import IconButton from "~/components/icon-button";
import Modal from "~/components/modal";
import ModalFooterButton from "~/components/modal/footer-button";
import ModalSidebarItem from "~/components/modal/sidebar-item";
import ModalSidebarList from "~/components/modal/sidebar-list";
import Spacer from "~/components/spacer";
import TabPanel from "~/components/tab-panel";
import { use_media_query } from "~/hooks/use-media-query";
import AlbumIcon from "~/icons/album";
import ChevronIcon from "~/icons/chevron";
import PenIcon from "~/icons/pen";
import PexelsIcon from "~/icons/pexels";
import PhotoSearchIcon from "~/icons/photo-search";
import UploadIcon from "~/icons/upload";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import {
  GallerySidebarTabsValue,
  nav_segment_atom,
  pending_image_atom,
  query_atom,
  selected_atom,
  sidebar_tab_atom,
  uploading_atom
} from "./core/atoms";
import NavigationScreen from "./core/components/navigation-screen";
import ImagePreview from "./core/components/preview";
import SearchInput from "./core/components/search-input";
import Whiteboard from "./core/components/whiteboard";
import WhiteboardUploader from "./core/components/whiteboard/uploader";
import { use_reset_gallery_atoms } from "./core/hooks/use-reset-gallery-atoms";
import { FileWithPreview } from "./core/types";
import styles from "./gallery.module.scss";
import { GalleryProps } from "./gallery.props";

const GalleryMasonry = dynamic(() => import("./core/components/masonry"), {
  loading: dynamic_loader()
});
const UploadsTab = dynamic(() => import("./core/components/uploads"), {
  loading: dynamic_loader()
});

// Footer

const GalleryFooter = (
  props: Pick<GalleryProps, "on_confirm" | "on_cancel">
): React.ReactElement => {
  const { on_confirm, on_cancel } = props;
  const selected = use_atom_value(selected_atom);
  const uploading = use_atom_value(uploading_atom);
  const [pending_image, set_pending_image] = use_atom(pending_image_atom);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));

  return (
    <>
      <ModalFooterButton
        compact={is_smaller_than_tablet}
        onClick={(): void => {
          if (on_cancel) {
            on_cancel();
          }
        }}
        variant={"ghost"}
      >
        Cancel
      </ModalFooterButton>
      <ModalFooterButton
        compact={is_smaller_than_tablet}
        disabled={!selected || Boolean(pending_image) || uploading}
        onClick={(event): void => {
          if (selected?.source === "pexels") {
            event.preventDefault(); // Prevent closing of modal
            set_pending_image(selected?.key || null);
          } else if (on_confirm && selected) {
            on_confirm({
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
  const { children, on_confirm, on_cancel } = props;
  const reset_atoms = use_reset_gallery_atoms();
  const [open, set_open] = React.useState<boolean>(false);
  const [uploader_props, set_uploader_props] = React.useState<{
    alt: string;
    file: FileWithPreview;
  } | null>(null);
  const upload_image_url = React.useRef<string | null>(null);
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const [nav_segment, set_nav_segment] = use_atom(nav_segment_atom);
  const [whiteboard_uploading, set_whiteboard_uploading] =
    React.useState<boolean>(false);
  const [value, set_value] = use_atom(sidebar_tab_atom);
  const selected = use_atom_value(selected_atom);
  const set_query = use_set_atom(query_atom);
  const uploading = use_atom_value(uploading_atom);
  const fullscreen = value === "whiteboard" && !whiteboard_uploading;

  /**
   * Resets the gallery state
   */
  const reset = React.useCallback(() => {
    reset_atoms();
    set_uploader_props(null);
    set_whiteboard_uploading(false);
  }, [reset_atoms]);

  /**
   * Handles Pexels image upload
   * @param asset Asset
   */
  const handle_pexels_upload = React.useCallback(
    (asset: Asset): void => {
      on_confirm?.({
        hex: asset.hex,
        key: asset.key,
        rating: asset.rating,
        height: asset.height,
        width: asset.width,
        alt: asset.alt,
        credits: selected?.credits
      });
      set_open(false);
      reset();
    },
    [on_confirm, reset, selected?.credits]
  );

  return (
    <Modal
      footer={<GalleryFooter {...{ on_confirm, on_cancel }} />}
      fullscreen={is_smaller_than_tablet || fullscreen}
      modal={!fullscreen}
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
          <Spacer className={css["f-grow"]} orientation={"vertical"} size={4} />
          <ImagePreview />
        </>
      }
      slot_props={{
        tabs: {
          value,
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          onValueChange: (next_value): void => {
            set_value(next_value as GallerySidebarTabsValue);
            set_query("");
            set_whiteboard_uploading(false);
            set_uploader_props(null);
          }
        },
        sidebar: {
          style: {
            display: fullscreen || is_smaller_than_tablet ? "none" : "flex"
          }
        },
        content: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          onPointerDownOutside: (event): void => {
            event.preventDefault();
          },
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          onInteractOutside: (event): void => {
            event.preventDefault();
          },
          style: {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            minHeight: "45vh",
            width: "40vw",
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            minWidth: fullscreen || is_smaller_than_tablet ? "100%" : "640px"
          }
        },
        body: {
          className: clsx(css["flex-col"], styles.body)
        },
        close_button: {
          style: { display: fullscreen ? "none" : "flex" }
        },
        header: {
          decorator:
            !is_smaller_than_tablet || nav_segment === "home" ? (
              <PhotoSearchIcon />
            ) : (
              <IconButton
                aria-label={"Go to main screen"}
                disabled={uploading}
                onClick={(): void => set_nav_segment("home")}
                variant={"ghost"}
              >
                <ChevronIcon rotation={-90} />
              </IconButton>
            ),
          children: "Gallery",
          style: { display: fullscreen ? "none" : "flex" }
        },
        footer: {
          compact: is_smaller_than_tablet,
          style: {
            display: fullscreen ? "none" : "flex"
          }
        }
      }}
      trigger={children}
    >
      {is_smaller_than_tablet ? (
        {
          home: <NavigationScreen />,
          pexels: (
            <React.Fragment>
              <SearchInput
                disabled={value !== "pexels"}
                size={"lg"}
                slot_props={{
                  container: {
                    style: {
                      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                      borderRadius: 0
                    }
                  }
                }}
              />
              <GalleryMasonry
                on_pexels_upload_finish={handle_pexels_upload}
                tab={"pexels"}
              />
            </React.Fragment>
          ),
          library: <GalleryMasonry tab={"library"} />,
          upload: <UploadsTab disable_whiteboard_prompt />
        }[nav_segment]
      ) : (
        <React.Fragment>
          <TabPanel
            className={clsx(css["flex-center"], styles["tab-panel"])}
            tabIndex={-1}
            value={"pexels"}
          >
            <GalleryMasonry
              on_pexels_upload_finish={handle_pexels_upload}
              tab={"pexels"}
            />
          </TabPanel>
          <TabPanel
            className={clsx(css["flex-center"], styles["tab-panel"])}
            tabIndex={-1}
            value={"whiteboard"}
          >
            {whiteboard_uploading && uploader_props ? (
              <WhiteboardUploader
                alt={uploader_props.alt}
                file={uploader_props.file}
                on_reset={(): void => {
                  set_uploader_props(null);
                  set_whiteboard_uploading(false);
                }}
              />
            ) : (
              <Whiteboard
                initial_image_url={upload_image_url.current}
                on_cancel={(): void => {
                  set_uploader_props(null);
                  set_whiteboard_uploading(false);
                  set_value("pexels");
                }}
                on_confirm={(file, alt): void => {
                  Object.assign(file, { preview: URL.createObjectURL(file) });
                  set_uploader_props({ file, alt } as {
                    alt: string;
                    file: FileWithPreview;
                  });
                  set_whiteboard_uploading(true);
                }}
                on_mount={(): void => {
                  upload_image_url.current = null;
                }}
              />
            )}
          </TabPanel>
          <TabPanel
            className={clsx(css["flex-center"], styles["tab-panel"])}
            tabIndex={-1}
            value={"library"}
          >
            <GalleryMasonry tab={"library"} />
          </TabPanel>
          <TabPanel
            className={clsx(css["flex-center"], styles["tab-panel"])}
            tabIndex={-1}
            value={"upload"}
          >
            <UploadsTab
              on_open_in_whiteboard={(blob_url): void => {
                upload_image_url.current = blob_url;
                set_value("whiteboard");
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
