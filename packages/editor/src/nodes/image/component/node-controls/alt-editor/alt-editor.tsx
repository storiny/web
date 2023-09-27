import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { assetProps, ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { $getNodeByKey } from "lexical";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import Image from "~/components/Image";
import Input from "~/components/Input";
import { ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CaptionIcon from "~/icons/caption";
import { breakpoints } from "~/theme/breakpoints";
import { getCdnUrl } from "~/utils/getCdnUrl";

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
          imgId={image.key}
          slot_props={{
            image: {
              sizes: [
                `${breakpoints.up("mobile")} 320px`,
                "calc(100vw - 24px)"
              ].join(","),
              srcSet: [
                `${getCdnUrl(image.key, ImageSize.W_860)} 860w`,
                `${getCdnUrl(image.key, ImageSize.W_640)} 640w`,
                `${getCdnUrl(image.key, ImageSize.W_320)} 320w`
              ].join(",")
            }
          }}
        />
      </AspectRatio>
      <Spacer orientation={"vertical"} size={2.5} />
      <Input
        autoFocus
        autoSize
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
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));

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

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        className={clsx("focus-invert", "f-grow", styles.x, styles.button)}
        disabled={disabled}
        onClick={openModal}
        variant={"ghost"}
      >
        Alt
      </Button>
    ),
    <ImageAltEditorModal {...props} inputRef={inputRef} />,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton compact={isSmallerThanMobile} onClick={setAlt}>
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "350px"
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
