"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import ScrollArea from "~/components/ScrollArea";
import Typography from "~/components/Typography";

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
 * @param headingElements Heading elements
 */
const getNestedHeadings = (headingElements: HTMLElement[]): NestedHeading[] => {
  const nestedHeadings: NestedHeading[] = [];

  headingElements.forEach((heading) => {
    const { innerText: title, id } = heading;

    if (heading.nodeName === "H2") {
      nestedHeadings.push({ id, title, items: [] });
    } else if (heading.nodeName === "H3" && nestedHeadings.length > 0) {
      nestedHeadings[nestedHeadings.length - 1].items.push({
        id,
        title
      });
    }
  });

  return nestedHeadings;
};

/**
 * Observes nested heading elements on the page, and selects the active
 * heading on the page
 * @param setActiveId Callback function invoked when the active heading changes
 */
const useHeadingsObserver = (setActiveId: (id: string) => void): void => {
  const headingElementsRef = React.useRef<IntersectionObserverEntry | {}>({});

  React.useEffect(() => {
    const callback: IntersectionObserverCallback = (headings) => {
      headingElementsRef.current = headings.reduce((map, headingElement) => {
        map[headingElement.target.id] = headingElement;
        return map;
      }, headingElementsRef.current);

      // Get all headings that are currently visible on the page
      const visibleHeadings: IntersectionObserverEntry[] = [];
      Object.keys(headingElementsRef.current).forEach((key) => {
        const headingElement = headingElementsRef.current[key];
        if (headingElement.isIntersecting) {
          visibleHeadings.push(headingElement);
        }
      });

      const getIndexFromId = (id: string): number =>
        headingElements.findIndex((heading) => heading.id === id);

      // Handle single visible heading
      if (visibleHeadings.length === 1) {
        setActiveId(visibleHeadings[0].target.id);
        // If there is more than one visible heading,
        // choose the one that is closest to the top of the page
      } else if (visibleHeadings.length > 1) {
        const sortedVisibleHeadings = visibleHeadings.sort((a, b) =>
          getIndexFromId(a.target.id) > getIndexFromId(b.target.id) ? -1 : 0
        );

        setActiveId(sortedVisibleHeadings[0].target.id);
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-52px 0px 0px 0px"
    });

    const headingElements = Array.from(
      document.querySelectorAll("main h2, main h3")
    );

    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [setActiveId]);
};

const LegalToc = (): React.ReactElement => {
  const [nestedHeadings, setNestedHeadings] = React.useState<NestedHeading[]>(
    []
  );
  const [activeId, setActiveId] = React.useState<string>(
    typeof window !== "undefined" ? window.location.hash.substring(1) : ""
  );
  useHeadingsObserver(setActiveId);

  /**
   * Scrolls smoothly to a heading element
   * @param id ID of the heading element
   */
  const scrollToHeading = (id: string): void => {
    document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth" });
  };

  React.useEffect(() => {
    const newNestedHeadings = getNestedHeadings(
      Array.from(document.querySelectorAll("main h2, main h3"))
    );

    setNestedHeadings(newNestedHeadings);
  }, []);

  if (!nestedHeadings.length) {
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
      slotProps={{
        viewport: {
          className: clsx(styles.x, styles.toc)
        }
      }}
      type={"auto"}
    >
      <ul className={clsx("flex-col", styles.x, styles.ul)}>
        {nestedHeadings.map((heading) => (
          <li
            className={clsx(
              "flex-col",
              styles.x,
              styles.li,
              activeId === heading.id && styles.selected
            )}
            key={heading.id}
          >
            <NextLink
              href={`#${heading.id}`}
              onClick={(event): void => {
                event.preventDefault();
                scrollToHeading(heading.id);
              }}
              scroll={false}
              shallow
            >
              {heading.title}
            </NextLink>
            {heading.items.length > 0 && (
              <ul
                className={clsx(
                  "flex-col",
                  styles.x,
                  styles.ul,
                  styles["nested-ul"]
                )}
              >
                {heading.items.map((child) => (
                  <li
                    className={clsx(
                      "flex-col",
                      styles.x,
                      styles.li,
                      activeId === child.id && styles.selected
                    )}
                    key={child.id}
                  >
                    <NextLink
                      href={`#${child.id}`}
                      onClick={(event): void => {
                        event.preventDefault();
                        scrollToHeading(heading.id);
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
