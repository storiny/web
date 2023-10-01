import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNodeByKey as $get_node_by_key,
  $getRoot as $get_root,
  NodeKey,
  TextNode
} from "lexical";
import React from "react";

import Typography from "~/components/typography";

import {
  $is_heading_node,
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
 * @param table_of_contents Table of contents
 * @param set_active_heading Callback function invoked when the active heading changes
 */
const use_headings_observer = (
  table_of_contents: TableOfContentsEntry[],
  set_active_heading: (node_key: NodeKey) => void
): void => {
  const [editor] = use_lexical_composer_context();
  const heading_elements_ref = React.useRef<IntersectionObserverEntry | object>(
    {}
  );

  React.useEffect(() => {
    const callback: IntersectionObserverCallback = (headings) => {
      heading_elements_ref.current = headings.reduce<any>(
        (map, heading_element) => {
          map[heading_element.target.getAttribute("data-key") || ""] =
            heading_element;
          return map;
        },
        heading_elements_ref.current
      );

      // Get all headings that are currently visible on the page
      const visible_headings: IntersectionObserverEntry[] = [];
      Object.keys(heading_elements_ref.current).forEach((key) => {
        const heading_element = (heading_elements_ref.current as any)[
          key
        ] as IntersectionObserverEntry;
        if (heading_element.isIntersecting) {
          visible_headings.push(heading_element);
        }
      });

      const get_index_from_key = (key: NodeKey): number =>
        table_of_contents.findIndex((heading) => heading[0] === key);

      // Handle single visible heading
      if (visible_headings.length === 1) {
        set_active_heading(
          visible_headings[0].target.getAttribute("data-key") || ""
        );
        // If there is more than one visible heading,
        // choose the one that is closest to the top of the page
      } else if (visible_headings.length > 1) {
        const sorted_visible_headings = visible_headings.sort((a, b) =>
          get_index_from_key(a.target.getAttribute("data-key") || "") >
          get_index_from_key(b.target.getAttribute("data-key") || "")
            ? -1
            : 0
        );

        set_active_heading(
          sorted_visible_headings[0].target.getAttribute("data-key") || ""
        );
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-52px 0px 0px 0px"
    });

    for (const [heading_key] of table_of_contents) {
      const element = editor.getElementByKey(heading_key);

      if (element) {
        element.setAttribute("data-key", heading_key);
        observer.observe(element);
      }
    }

    return () => {
      heading_elements_ref.current = {};
      observer.disconnect();
    };
  }, [editor, set_active_heading, table_of_contents]);
};

/**
 * Converts a heading node to a heading entry
 * @param heading Heading node
 */
const to_entry = (heading: HeadingNode): TableOfContentsEntry => [
  heading.getKey(),
  heading.getTextContent(),
  heading.get_tag()
];

/**
 * Inserts a heading into the table of contents
 * @param prev_heading Previous heading
 * @param pext_heading New heading
 * @param current_table_of_contents Current table of contents
 */
const $insert_heading_into_table_of_contents = (
  prev_heading: HeadingNode | null,
  pext_heading: HeadingNode | null,
  current_table_of_contents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  if (pext_heading === null) {
    return current_table_of_contents;
  }

  const next_entry: TableOfContentsEntry = to_entry(pext_heading);
  let next_table_of_contents: TableOfContentsEntry[] = [];

  if (prev_heading === null) {
    next_table_of_contents = [next_entry, ...current_table_of_contents];
  } else {
    for (let i = 0; i < current_table_of_contents.length; i++) {
      const key = current_table_of_contents[i][0];
      next_table_of_contents.push(current_table_of_contents[i]);

      if (key === prev_heading.getKey() && key !== pext_heading.getKey()) {
        next_table_of_contents.push(next_entry);
      }
    }
  }

  return next_table_of_contents;
};

/**
 * Removes a heading from the table of contents
 * @param key Heading key
 * @param current_table_of_contents Current table of contents
 */
const $delete_heading_from_table_of_contents = (
  key: NodeKey,
  current_table_of_contents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const next_table_of_contents = [];

  for (const heading of current_table_of_contents) {
    if (heading[0] !== key) {
      next_table_of_contents.push(heading);
    }
  }

  return next_table_of_contents;
};

/**
 * Updates a heading in the table of contents
 * @param heading Heading to update
 * @param current_table_of_contents Current table of contents
 */
const $update_heading_in_table_of_contents = (
  heading: HeadingNode,
  current_table_of_contents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const next_table_of_contents: TableOfContentsEntry[] = [];

  for (const old_heading of current_table_of_contents) {
    if (old_heading[0] === heading.getKey()) {
      next_table_of_contents.push(to_entry(heading));
    } else {
      next_table_of_contents.push(old_heading);
    }
  }

  return next_table_of_contents;
};

/**
 * Returns the updated table of contents, placing the given `heading` before the given
 * `prev_heading`. If `prev_heading` is `undefined`, `heading` is placed at the start.
 * @param prev_heading Previous heading
 * @param heading Heading
 * @param current_table_of_contents Latest table of contents
 */
const $update_heading_position = (
  prev_heading: HeadingNode | null,
  heading: HeadingNode,
  current_table_of_contents: TableOfContentsEntry[]
): TableOfContentsEntry[] => {
  const next_table_of_contents: TableOfContentsEntry[] = [];
  const next_entry: TableOfContentsEntry = to_entry(heading);

  if (!prev_heading) {
    next_table_of_contents.push(next_entry);
  }

  for (const old_heading of current_table_of_contents) {
    if (old_heading[0] === heading.getKey()) {
      continue;
    }

    next_table_of_contents.push(old_heading);

    if (prev_heading && old_heading[0] === prev_heading.getKey()) {
      next_table_of_contents.push(next_entry);
    }
  }

  return next_table_of_contents;
};

const TableOfContentsPlugin = (): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const [table_of_contents, set_table_of_contents] = React.useState<
    TableOfContentsEntry[]
  >([]);
  const [selected_key, set_selected_key] = React.useState("");
  use_headings_observer(table_of_contents, set_selected_key);

  /**
   * Scrolls to the specified node
   * @param key Key of the node to scroll to
   */
  const scroll_to_node = (key: NodeKey): void => {
    editor.getEditorState().read(() => {
      const dom_element = editor.getElementByKey(key);
      if (dom_element) {
        dom_element.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  React.useEffect(() => {
    // Set table of contents initial state
    let current_table_of_contents: TableOfContentsEntry[] = [];
    editor.getEditorState().read(() => {
      for (const child of $get_root().getChildren().filter($is_heading_node)) {
        current_table_of_contents.push([
          child.getKey(),
          child.getTextContent(),
          child.get_tag()
        ]);
      }

      set_table_of_contents(current_table_of_contents);
    });

    return merge_register(
      // Listen to updates to heading mutations and update state
      editor.registerMutationListener(HeadingNode, (mutated_nodes) => {
        editor.getEditorState().read(() => {
          for (const [node_key, mutation] of mutated_nodes) {
            if (mutation === "created") {
              const pext_heading = $get_node_by_key<HeadingNode>(node_key);

              if (pext_heading !== null) {
                let prev_heading = pext_heading.getPreviousSibling();

                while (
                  prev_heading !== null &&
                  !$is_heading_node(prev_heading)
                ) {
                  prev_heading = prev_heading.getPreviousSibling();
                }

                current_table_of_contents =
                  $insert_heading_into_table_of_contents(
                    prev_heading,
                    pext_heading,
                    current_table_of_contents
                  );
              }
            } else if (mutation === "destroyed") {
              current_table_of_contents =
                $delete_heading_from_table_of_contents(
                  node_key,
                  current_table_of_contents
                );
            } else if (mutation === "updated") {
              const pext_heading = $get_node_by_key<HeadingNode>(node_key);

              if (pext_heading !== null) {
                let prev_heading = pext_heading.getPreviousSibling();

                while (
                  prev_heading !== null &&
                  !$is_heading_node(prev_heading)
                ) {
                  prev_heading = prev_heading.getPreviousSibling();
                }

                current_table_of_contents = $update_heading_position(
                  prev_heading,
                  pext_heading,
                  current_table_of_contents
                );
              }
            }
          }

          set_table_of_contents(current_table_of_contents);
        });
      }),
      // Listen to text node mutation updates
      editor.registerMutationListener(TextNode, (mutated_nodes) => {
        editor.getEditorState().read(() => {
          for (const [node_key, mutation] of mutated_nodes) {
            if (mutation === "updated") {
              const curr_node = $get_node_by_key(node_key);

              if (curr_node !== null) {
                const parent_node = curr_node.getParentOrThrow();

                if ($is_heading_node(parent_node)) {
                  current_table_of_contents =
                    $update_heading_in_table_of_contents(
                      parent_node,
                      current_table_of_contents
                    );
                  set_table_of_contents(current_table_of_contents);
                }
              }
            }
          }
        });
      })
    );
  }, [editor]);

  return table_of_contents.length ? (
    <ul className={clsx(styles.x, styles.toc)}>
      {table_of_contents.map(([key, text, tag]) => (
        <Typography
          as={"li"}
          className={clsx(
            "focusable",
            text.trim() ? "t-minor" : "t-muted",
            styles.x,
            styles.item,
            tag === "h3" && styles.sub,
            !text.trim() && styles.empty,
            selected_key === key && styles.selected
          )}
          ellipsis
          key={key}
          level={"body2"}
          onClick={(): void => scroll_to_node(key)}
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
