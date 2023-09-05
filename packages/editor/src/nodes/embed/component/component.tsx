import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { NodeKey } from "lexical";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";
import useResizeObserver from "use-resize-observer";

import Popover from "~/components/Popover";

import { Block } from "../../block";
import { EmbedNodeLayout } from "../embed";
import styles from "./embed.module.scss";

// const ImageNodeControls = dynamic(() => import("./node-controls"), {
//   loading: () => (
//     <div className={"flex-center"} style={{ padding: "24px 48px" }}>
//       <Spinner />
//     </div>
//   )
// });

const EmbedComponent = ({
  nodeKey,
  layout,
  url
}: {
  layout: EmbedNodeLayout;
  nodeKey: NodeKey;
  url: string;
}): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const { height: containerHeight, ref: containerRef } = useResizeObserver();
  const [ref, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });
  const editable = editor.isEditable();
  const visible = Boolean(entry && entry.isIntersecting);

  return (
    <Block className={styles.image} nodeKey={nodeKey} ref={ref}>
      <div
        className={clsx(
          styles.container,
          // Grid for overflowing the image
          ["grid", "dashboard", "no-sidenav"]
        )}
        data-layout={layout}
        ref={containerRef}
      >
        {layout === "overflow" && (
          <span
            aria-hidden
            className={styles["left-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
        <Popover
          className={clsx("flex-center", "flex-col", styles.x, styles.popover)}
          onOpenChange={(newOpen): void => {
            // if (!newOpen && !resizing) {
            //   setSelected(false);
            // }
          }}
          // open={editable && focused && !resizing && $isNodeSelection(selection)}
          slotProps={{
            content: {
              collisionPadding: { top: 64 }, // Prevent header collision
              sideOffset: 12,
              side: "top"
            }
          }}
          trigger={<div>Content</div>}
        >
          {/*<ImageNodeControls*/}
          {/*  images={images}*/}
          {/*  layout={layout}*/}
          {/*  nodeKey={nodeKey}*/}
          {/*/>*/}
        </Popover>
        {layout === "overflow" && (
          <span
            aria-hidden
            className={styles["right-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
      </div>
      {/* Compensate for the absolute position of the embed element */}
      <div
        aria-hidden
        style={{
          height: containerHeight
        }}
      />
    </Block>
  );
};

export default EmbedComponent;
