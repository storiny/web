"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import ScrollArea from "~/components/scroll-area";
import Typography from "~/components/typography";

import styles from "./toc.module.scss";

type NestedHeading = {
  id: string;
  items: Array<Omit<NestedHeading, "items">>;
  title: string;
};

interface IntersectionObserverCallback {
  (entries: IntersectionObserverEntry[], observer: IntersectionObserver): void;
}

/**
 * Returns nested H2 and H3 elements from the array of heading elements
 * @param heading_elements Heading elements
 */
const get_nested_headings = (
  heading_elements: HTMLElement[]
): NestedHeading[] => {
  const nested_headings: NestedHeading[] = [];

  heading_elements.forEach((heading) => {
    const { innerText: title, id } = heading;

    if (heading.nodeName === "H2") {
      nested_headings.push({ id, title, items: [] });
    } else if (heading.nodeName === "H3" && nested_headings.length > 0) {
      nested_headings[nested_headings.length - 1].items.push({
        id,
        title
      });
    }
  });

  return nested_headings;
};

/**
 * Observes nested heading elements on the page, and selects the active
 * heading on the page
 * @param set_active_id Callback function invoked when the active heading changes
 */
const use_headings_observer = (set_active_id: (id: string) => void): void => {
  const heading_elements_ref = React.useRef<IntersectionObserverEntry | object>(
    {}
  );

  React.useEffect(() => {
    const callback: IntersectionObserverCallback = (headings) => {
      heading_elements_ref.current = headings.reduce((map, heading_element) => {
        map[heading_element.target.id] = heading_element;
        return map;
      }, heading_elements_ref.current);

      // Get all headings that are currently visible on the page
      const visible_headings: IntersectionObserverEntry[] = [];
      Object.keys(heading_elements_ref.current).forEach((key) => {
        const heading_element = heading_elements_ref.current[key];
        if (heading_element.isIntersecting) {
          visible_headings.push(heading_element);
        }
      });

      const get_index_from_id = (id: string): number =>
        heading_elements.findIndex((heading) => heading.id === id);

      // Handle single visible heading
      if (visible_headings.length === 1) {
        set_active_id(visible_headings[0].target.id);
        // If there is more than one visible heading,
        // choose the one that is closest to the top of the page
      } else if (visible_headings.length > 1) {
        const sorted_visible_headings = visible_headings.sort((a, b) =>
          get_index_from_id(a.target.id) > get_index_from_id(b.target.id)
            ? -1
            : 0
        );

        set_active_id(sorted_visible_headings[0].target.id);
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-52px 0px 0px 0px"
    });

    const heading_elements = Array.from(
      document.querySelectorAll("main h2, main h3")
    );

    heading_elements.forEach((element) => observer.observe(element));

    return () => {
      heading_elements_ref.current = {};
      observer.disconnect();
    };
  }, [set_active_id]);
};

const LegalToc = (): React.ReactElement => {
  const [nested_headings, set_nested_headings] = React.useState<
    NestedHeading[]
  >([]);
  const [active_id, set_active_id] = React.useState<string>(
    typeof window !== "undefined" ? window.location.hash.substring(1) : ""
  );
  use_headings_observer(set_active_id);

  /**
   * Scrolls smoothly to a heading element
   * @param id ID of the heading element
   */
  const scroll_to_heading = (id: string): void => {
    document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth" });
  };

  React.useEffect(() => {
    set_nested_headings(
      get_nested_headings(
        Array.from(document.querySelectorAll("main h2, main h3"))
      )
    );
  }, []);

  if (!nested_headings.length) {
    return (
      <Typography
        className={"t-muted"}
        level={"body2"}
        style={{ fontStyle: "italic" }}
      >
        Insufficient content
      </Typography>
    );
  }

  return (
    <ScrollArea
      aria-label={"Table of contents"}
      as={"nav"}
      slot_props={{
        viewport: {
          className: clsx(styles.x, styles.toc)
        }
      }}
      type={"auto"}
    >
      <ul className={clsx("flex-col", styles.ul)}>
        {nested_headings.map((heading) => (
          <li
            className={clsx(
              "flex-col",
              styles.li,
              active_id === heading.id && styles.selected
            )}
            key={heading.id}
          >
            <NextLink
              href={`#${heading.id}`}
              onClick={(event): void => {
                event.preventDefault();
                scroll_to_heading(heading.id);
              }}
              scroll={false}
              shallow
            >
              {heading.title}
            </NextLink>
            {heading.items.length > 0 && (
              <ul className={clsx("flex-col", styles.ul, styles["nested-ul"])}>
                {heading.items.map((child) => (
                  <li
                    className={clsx(
                      "flex-col",
                      styles.li,
                      active_id === child.id && styles.selected
                    )}
                    key={child.id}
                  >
                    <NextLink
                      href={`#${child.id}`}
                      onClick={(event): void => {
                        event.preventDefault();
                        scroll_to_heading(heading.id);
                      }}
                      scroll={false}
                      shallow
                    >
                      {child.title}
                    </NextLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default LegalToc;
