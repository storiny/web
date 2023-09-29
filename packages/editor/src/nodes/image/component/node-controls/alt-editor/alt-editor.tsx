import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { assetProps, ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { $getNodeByKey } from "lexical";
import React from "react";

import AspectRatio from "../../../../../../../ui/src/components/aspect-ratio";
import Button from "../../../../../../../ui/src/components/button";
import Image from "../../../../../../../ui/src/components/image";
import Input from "../../../../../../../ui/src/components/input";
import {
  ModalFooterButton,
  use_modal
} from "../../../../../../../ui/src/components/modal";
import Spacer from "../../../../../../../ui/src/components/spacer";
import { use_media_query } from "../../../../../../../ui/src/hooks/use-media-query";
import CaptionIcon from "~/icons/caption";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { get_cdn_url } from "../../../../../../../ui/src/utils/get-cdn-url";

import { $isImageNode } from "../../../image";
import styles from "./alt-editor.module.scss";
import { ImageAltEditorProps } from "./alt-editor.props";

const ImageAltEditorModal = (
  props: ImageAltEditorProps & {
    inputRef: React.RefObject<HTMLInputElement>;
  }
): React.ReactElement => {
  const { image, inputRef } = props;
  return (
    <div className={clsx("flex-col", "flex-center")}>
      <AspectRatio
        className={clsx(styles.x, styles.image)}
        ratio={image.width / image.height}
      >
        <Image
          alt={image.alt}
          hex={image.hex}
          img_key={image.key}
          slot_props={{
            image: {
              sizes: [
                `${BREAKPOINTS.up("mobile")} 320px`,
                "calc(100vw - 24px)"
              ].join(","),
              srcSet: [
                `${get_cdn_url(image.key, ImageSize.W_860)} 860w`,
                `${get_cdn_url(image.key, ImageSize.W_640)} 640w`,
                `${get_cdn_url(image.key, ImageSize.W_320)} 320w`
              ].join(",")
            }
          }}
        />
      </AspectRatio>
      <Spacer orientation={"vertical"} size={2.5} />
      <Input
        autoFocus
        auto_size
        defaultValue={image.alt}
        maxLength={assetProps.alt.maxLength}
        minLength={assetProps.alt.minLength}
        placeholder={"Alt text"}
        ref={inputRef}
        slot_props={{ container: { className: "full-w" } }}
      />
    </div>
  );
};

const ImageAltEditor = (props: ImageAltEditorProps): React.ReactElement => {
  const { disabled, nodeKey } = props;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  /**
   * Updates the alt text
   */
  const setAlt = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      const nextAlt = inputRef.current?.value || "";

      if ($isImageNode(node)) {
        node.setAltText(0, nextAlt);
      }
    });
  }, [editor, nodeKey]);

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        className={clsx("focus-invert", "f-grow", styles.x, styles.button)}
        disabled={disabled}
        onClick={open_modal}
        variant={"ghost"}
      >
        Alt
      </Button>
    ),
    <ImageAltEditorModal {...props} inputRef={inputRef} />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton compact={is_smaller_than_mobile} onClick={setAlt}>
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <CaptionIcon />,
          children: "Edit alt text"
        }
      }
    }
  );

  return element;
};

export default ImageAltEditor;
