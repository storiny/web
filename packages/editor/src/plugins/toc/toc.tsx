import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import { $getNodeByKey, $getRoot, NodeKey, TextNode } from "lexical";
import React from "react";

import Typography from "../../../../ui/src/components/typography";

import {
  $isHeadingNode,
  HeadingNode,
  HeadingTagType
} from "../../nodes/heading";
import styles from "./toc.module.scss";

type TableOfContentsEntry = [key: NodeKey, text: string, tag: HeadingTagType];

interface IntersectionObserverCallback {
  (entries: IntersectionObserverEntry[], observer: IntersectionObserver): void;
}

/**
 * Observes the heading elements on the editor, and selects the active
 * heading
 * @param tableOfContents Table of contents
 * @param setActiveHeading Callback function invoked when the active heading changes
 */
const useHeadingsObserver = (
  tableOfContents: TableOfContentsEntry[],
  setActiveHeading: (nodeKey: NodeKey) => void
): void => {
  const [editor] = useLexicalComposerContext();
  const headingElementsRef = React.useRef<IntersectionObserverEntry | {}>({});

  React.useEffect(() => {
    const callback: IntersectionObserverCallback = (headings) => {
      headingElementsRef.current = headings.reduce<any>(
        (map, headingElement) => {
          map[headingElement.target.getAttribute("data-key") || ""] =
            headingElement;
          return map;
        },
        headingElementsRef.current
      );

      // Get all headings that are currently visible on the page
      const visibleHeadings: IntersectionObserverEntry[] = [];
      Object.keys(headingElementsRef.current).forEach((key) => {
        const headingElement = (headingElementsRef.current as any)[
          key
        ] as IntersectionObserverEntry;
        if (headingElement.isIntersecting) {
          visibleHeadings.push(headingElement);
        }
      });

      const getIndexFromKey = (key: NodeKey): number =>
        tableOfContents.findIndex((heading) => heading[0] === key);

      // Handle single visible heading
      if (visibleHeadings.length === 1) {
        setActiveHeading(
          visibleHeadings[0].target.getAttribute("data-key") || ""
        );
        // If there is more than one visible heading,
        // choose the one that is closest to the top of the page
      } else if (visibleHeadings.length > 1) {
        const sortedVisibleHeadings = visibleHeadings.sort((a, b) =>
          getIndexFromKey(a.target.getAttribute("data-key") || "") >
          getIndexFromKey(b.target.getAttribute("data-key") || "")
            ? -1
            : 0
        );

        setActiveHeading(
          sortedVisibleHeadings[0].target.getAttribute("data-key") || ""
        );
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-52px 0px 0px 0px"
    });

    for (const [headingKey] of tableOfContents) {
      const element = editor.getElementByKey(headingKey);

      if (element) {
        element.setAttribute("data-key", headingKey);
        observer.observe(element);
      }
    }

    return () => {
      headingElementsRef.current = {};
      observer.disconnect();
    };
  }, [editor, setActiveHeading, tableOfContents]);
};

/**
 * Converts a heading node to a heading entry
 * @param heading Heading node
 */
const toEntry = (heading: HeadingNode): TableOfContentsEntry => [
  heading.getKey(),
  heading.getTextContent(),
  heading.getTag()
];

/**
 * Inserts a heading into the table of contents
 * @param prevHeading Previous heading
 * @param newHeading New heading
 * @param currentTableOfContents Current table of contents
 */
const $insertHeadingIntoTableOfContents = (
  prevHeading: HeadingNode | null,
  newHeading: HeadingNode | null,
  currentTableOfContents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  if (newHeading === null) {
    return currentTableOfContents;
  }

  const newEntry: TableOfContentsEntry = toEntry(newHeading);
  let newTableOfContents: TableOfContentsEntry[] = [];

  if (prevHeading === null) {
    newTableOfContents = [newEntry, ...currentTableOfContents];
  } else {
    for (let i = 0; i < currentTableOfContents.length; i++) {
      const key = currentTableOfContents[i][0];
      newTableOfContents.push(currentTableOfContents[i]);

      if (key === prevHeading.getKey() && key !== newHeading.getKey()) {
        newTableOfContents.push(newEntry);
      }
    }
  }

  return newTableOfContents;
};

/**
 * Removes a heading from the table of contents
 * @param key Heading key
 * @param currentTableOfContents Current table of contents
 */
const $deleteHeadingFromTableOfContents = (
  key: NodeKey,
  currentTableOfContents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const newTableOfContents = [];

  for (const heading of currentTableOfContents) {
    if (heading[0] !== key) {
      newTableOfContents.push(heading);
    }
  }

  return newTableOfContents;
};

/**
 * Updates a heading in the table of contents
 * @param heading Heading to update
 * @param currentTableOfContents Current table of contents
 */
const $updateHeadingInTableOfContents = (
  heading: HeadingNode,
  currentTableOfContents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const newTableOfContents: TableOfContentsEntry[] = [];

  for (const oldHeading of currentTableOfContents) {
    if (oldHeading[0] === heading.getKey()) {
      newTableOfContents.push(toEntry(heading));
    } else {
      newTableOfContents.push(oldHeading);
    }
  }

  return newTableOfContents;
};

/**
 * Returns the updated table of contents, placing the given `heading` before the given
 * `prevHeading`. If `prevHeading` is `undefined`, `heading` is placed at the start.
 * @param prevHeading Previous heading
 * @param heading Heading
 * @param currentTableOfContents Latest table of contents
 */
const $updateHeadingPosition = (
  prevHeading: HeadingNode | null,
  heading: HeadingNode,
  currentTableOfContents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const newTableOfContents: TableOfContentsEntry[] = [];
  const newEntry: TableOfContentsEntry = toEntry(heading);

  if (!prevHeading) {
    newTableOfContents.push(newEntry);
  }

  for (const oldHeading of currentTableOfContents) {
    if (oldHeading[0] === heading.getKey()) {
      continue;
    }

    newTableOfContents.push(oldHeading);

    if (prevHeading && oldHeading[0] === prevHeading.getKey()) {
      newTableOfContents.push(newEntry);
    }
  }

  return newTableOfContents;
};

const TableOfContentsPlugin = (): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const [tableOfContents, setTableOfContents] = React.useState<
    TableOfContentsEntry[]
  >([]);
  const [selectedKey, setSelectedKey] = React.useState("");
  useHeadingsObserver(tableOfContents, setSelectedKey);

  /**
   * Scrolls to the specified node
   * @param key Key of the node to scroll to
   */
  const scrollToNode = (key: NodeKey): void => {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key);

      if (domElement) {
        domElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  React.useEffect(() => {
    // Set table of contents initial state
    let currentTableOfContents: TableOfContentsEntry[] = [];
    editor.getEditorState().read(() => {
      for (const child of $getRoot().getChildren().filter($isHeadingNode)) {
        currentTableOfContents.push([
          child.getKey(),
          child.getTextContent(),
          child.getTag()
        ]);
      }

      setTableOfContents(currentTableOfContents);
    });

    return mergeRegister(
      // Listen to updates to heading mutations and update state
      editor.registerMutationListener(HeadingNode, (mutatedNodes) => {
        editor.getEditorState().read(() => {
          for (const [nodeKey, mutation] of mutatedNodes) {
            if (mutation === "created") {
              const newHeading = $getNodeByKey<HeadingNode>(nodeKey);

              if (newHeading !== null) {
                let prevHeading = newHeading.getPreviousSibling();

                while (prevHeading !== null && !$isHeadingNode(prevHeading)) {
                  prevHeading = prevHeading.getPreviousSibling();
                }

                currentTableOfContents = $insertHeadingIntoTableOfContents(
                  prevHeading,
                  newHeading,
                  currentTableOfContents
                );
              }
            } else if (mutation === "destroyed") {
              currentTableOfContents = $deleteHeadingFromTableOfContents(
                nodeKey,
                currentTableOfContents
              );
            } else if (mutation === "updated") {
              const newHeading = $getNodeByKey<HeadingNode>(nodeKey);

              if (newHeading !== null) {
                let prevHeading = newHeading.getPreviousSibling();

                while (prevHeading !== null && !$isHeadingNode(prevHeading)) {
                  prevHeading = prevHeading.getPreviousSibling();
                }

                currentTableOfContents = $updateHeadingPosition(
                  prevHeading,
                  newHeading,
                  currentTableOfContents
                );
              }
            }
          }

          setTableOfContents(currentTableOfContents);
        });
      }),
      // Listen to text node mutation updates
      editor.registerMutationListener(TextNode, (mutatedNodes) => {
        editor.getEditorState().read(() => {
          for (const [nodeKey, mutation] of mutatedNodes) {
            if (mutation === "updated") {
              const currNode = $getNodeByKey(nodeKey);

              if (currNode !== null) {
                const parentNode = currNode.getParentOrThrow();

                if ($isHeadingNode(parentNode)) {
                  currentTableOfContents = $updateHeadingInTableOfContents(
                    parentNode,
                    currentTableOfContents
                  );
                  setTableOfContents(currentTableOfContents);
                }
              }
            }
          }
        });
      })
    );
  }, [editor]);

  return tableOfContents.length ? (
    <ul className={clsx(styles.x, styles.toc)}>
      {tableOfContents.map(([key, text, tag]) => (
        <Typography
          as={"li"}
          className={clsx(
            "focusable",
            text.trim() ? "t-minor" : "t-muted",
            styles.x,
            styles.item,
            tag === "h3" && styles.sub,
            !text.trim() && styles.empty,
            selectedKey === key && styles.selected
          )}
          ellipsis
          key={key}
          level={"body2"}
          onClick={(): void => scrollToNode(key)}
          role="button"
          tabIndex={0}
          title={text}
        >
          {text.trim() || `Empty ${tag === "h3" ? "subheading" : "heading"}`}
        </Typography>
      ))}
    </ul>
  ) : (
    <Typography
      className={clsx("t-muted", "t-center")}
      level={"body2"}
      style={{ display: "table-cell", verticalAlign: "middle" }}
    >
      Empty
    </Typography>
  );
};

export default TableOfContentsPlugin;
