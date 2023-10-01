import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { ASSET_PROPS, ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { $getNodeByKey as $get_node_by_key } from "lexical";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import Image from "~/components/image";
import Input from "~/components/input";
import { ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_media_query } from "~/hooks/use-media-query";
import CaptionIcon from "~/icons/caption";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { $is_image_node } from "../../../image";
import styles from "./alt-editor.module.scss";
import { ImageAltEditorProps } from "./alt-editor.props";

const ImageAltEditorModal = (
  props: ImageAltEditorProps & {
    input_ref: React.RefObject<HTMLInputElement>;
  }
): React.ReactElement => {
  const { image, input_ref } = props;
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
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
        maxLength={ASSET_PROPS.alt.max_length}
        minLength={ASSET_PROPS.alt.min_length}
        placeholder={"Alt text"}
        ref={input_ref}
        slot_props={{ container: { className: "full-w" } }}
      />
    </div>
  );
};

const ImageAltEditor = (props: ImageAltEditorProps): React.ReactElement => {
  const { disabled, node_key } = props;
  const input_ref = React.useRef<HTMLInputElement | null>(null);
  const [editor] = use_lexical_composer_context();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  /**
   * Updates the alt text
   */
  const set_alt = React.useCallback(() => {
    editor.update(() => {
      const node = $get_node_by_key(node_key);
      const next_alt = input_ref.current?.value || "";

      if ($is_image_node(node)) {
        node.set_alt_text(0, next_alt);
      }
    });
  }, [editor, node_key]);

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
    <ImageAltEditorModal {...props} input_ref={input_ref} />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton compact={is_smaller_than_mobile} onClick={set_alt}>
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
