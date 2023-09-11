import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { NodeKey } from "lexical";
import React from "react";
import { useIntersectionObserver } from "react-intersection-observer-hook";
import useResizeObserver from "use-resize-observer";

import Popover from "~/components/Popover";
import { selectTheme } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

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

const DATA_REGEX =
  /<script type="application\/storiny\.embed\.(rich|photo)\+json">(.+)<\/script>/i;

/**
 * Returns the system color scheme
 */
const parseSystemTheme = (): "dark" | "light" => {
  if (
    window &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  return "dark";
};

const EmbedComponent = ({
  nodeKey,
  layout,
  url
}: {
  layout: EmbedNodeLayout;
  nodeKey: NodeKey;
  url: string;
}): React.ReactElement | null => {
  const theme = useAppSelector(selectTheme);
  const [editor] = useLexicalComposerContext();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const previousUrlRef = React.useRef<string>("");
  const { height: containerHeight, ref: resizeObserverRef } =
    useResizeObserver();
  const [ref, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<boolean>(false);
  const editable = editor.isEditable();
  const visible = Boolean(entry && entry.isIntersecting);

  const generateEmbed = React.useCallback(() => {
    const embedUrl = `${
      process.env.NEXT_PUBLIC_DISCOVERY_URL
    }/embed/${url}?theme=${theme === "system" ? parseSystemTheme() : theme}`;

    fetch(embedUrl)
      .then(async (response) => {
        let data;

        try {
          data = await response.clone().json();

          if (data.sources) {
            for (const source of data.sources) {
              const script = document.createElement("script");
              script.src = source;
              script.async = true;

              document.body.appendChild(script);
              script.onerror = (): void => setError(true);
            }
          }

          if (data?.html) {
            containerRef.current!.innerHTML = data.html;
          }
        } catch (e) {
          try {
            const html = await response.clone().text();
            const dataMatch = html.match(DATA_REGEX);

            if (dataMatch?.length) {
              try {
                const embedData = JSON.parse(dataMatch[2]);
                containerRef.current!.setAttribute("style", embedData.styles);
              } catch (e) {
                setError(true);
              }
            }

            containerRef.current!.innerHTML = `<iframe frameborder="0" style="position:absolute;width:100%;height:100%;top:0;left:0;" src=${embedUrl}></iframe>`;
          } catch {
            setError(true);
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, theme]);

  React.useEffect(() => {
    if (url !== previousUrlRef.current) {
      setLoading(true);
      generateEmbed();
      previousUrlRef.current = url;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateEmbed, url]);

  return (
    <Block className={styles.image} nodeKey={nodeKey} ref={ref}>
      <div
        className={clsx(
          styles.container,
          // Grid for overflowing the image
          ["grid", "dashboard", "no-sidenav"]
        )}
        data-layout={layout}
        ref={resizeObserverRef}
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
          trigger={<div ref={containerRef} />}
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
