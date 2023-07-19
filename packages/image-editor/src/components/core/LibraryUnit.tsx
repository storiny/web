import "./LibraryUnit.scss";

import clsx from "clsx";
import { memo, useEffect, useRef, useState } from "react";

import { LibraryItem } from "../../core/types";
import { SvgCache, useLibraryItemSvg } from "../../lib/hooks/useLibraryItemSvg";
import { useDevice } from "./App";
import { CheckboxItem } from "./CheckboxItem";
import { PlusIcon } from "./icons";

export const LibraryUnit = memo(
  ({
    id,
    layers,
    isPending,
    onClick,
    selected,
    onToggle,
    onDrag,
    svgCache
  }: {
    id: LibraryItem["id"] | /** for pending item */ null;
    isPending?: boolean;
    layers?: LibraryItem["layers"];
    onClick: (id: LibraryItem["id"] | null) => void;
    onDrag: (id: string, event: React.DragEvent) => void;
    onToggle: (id: string, event: React.MouseEvent) => void;
    selected: boolean;
    svgCache: SvgCache;
  }) => {
    const ref = useRef<HTMLDivLayer | null>(null);
    const svg = useLibraryItemSvg(id, layers, svgCache);

    useEffect(() => {
      const node = ref.current;

      if (!node) {
        return;
      }

      if (svg) {
        node.innerHTML = svg.outerHTML;
      }

      return () => {
        node.innerHTML = "";
      };
    }, [svg]);

    const [isHovered, setIsHovered] = useState(false);
    const isMobile = useDevice().isMobile;
    const adder = isPending && (
      <div className="library-unit__adder">{PlusIcon}</div>
    );

    return (
      <div
        className={clsx("library-unit", {
          "library-unit__active": layers,
          "library-unit--hover": layers && isHovered,
          "library-unit--selected": selected,
          "library-unit--skeleton": !svg
        })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={clsx("library-unit__dragger", {
            "library-unit__pulse": !!isPending
          })}
          draggable={!!layers}
          onClick={
            !!layers || !!isPending
              ? (event) => {
                  if (id && event.shiftKey) {
                    onToggle(id, event);
                  } else {
                    onClick(id);
                  }
                }
              : undefined
          }
          onDragStart={(event) => {
            if (!id) {
              event.preventDefault();
              return;
            }
            setIsHovered(false);
            onDrag(id, event);
          }}
          ref={ref}
        />
        {adder}
        {id && layers && (isHovered || isMobile || selected) && (
          <CheckboxItem
            checked={selected}
            className="library-unit__checkbox"
            onChange={(checked, event) => onToggle(id, event)}
          />
        )}
      </div>
    );
  }
);

export const EmptyLibraryUnit = () => (
  <div className="library-unit library-unit--skeleton" />
);
