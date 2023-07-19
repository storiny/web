import React, { memo, ReactNode, useEffect, useState } from "react";

import { LibraryItem } from "../../core/types";
import { SvgCache } from "../../lib/hooks/useLibraryItemSvg";
import { useTransition } from "../../lib/hooks/useTransition";
import { ExcalidrawLayer, NonDeleted } from "../layer/types";
import { EmptyLibraryUnit, LibraryUnit } from "./LibraryUnit";

type LibraryOrPendingItem = (
  | LibraryItem
  | /* pending library item */ {
      id: null;
      layers: readonly NonDeleted<ExcalidrawLayer>[];
    }
)[];

interface Props {
  isItemSelected: (id: LibraryItem["id"] | null) => boolean;
  items: LibraryOrPendingItem;
  itemsRenderedPerBatch: number;
  onClick: (id: LibraryItem["id"] | null) => void;
  onItemDrag: (id: LibraryItem["id"], event: React.DragEvent) => void;
  onItemSelectToggle: (id: LibraryItem["id"], event: React.MouseEvent) => void;
  svgCache: SvgCache;
}

export const LibraryMenuSectionGrid = ({
  children
}: {
  children: ReactNode;
}) => <div className="library-menu-items-container__grid">{children}</div>;

export const LibraryMenuSection = memo(
  ({
    items,
    onItemSelectToggle,
    onItemDrag,
    isItemSelected,
    onClick,
    svgCache,
    itemsRenderedPerBatch
  }: Props) => {
    const [, startTransition] = useTransition();
    const [index, setIndex] = useState(0);

    useEffect(() => {
      if (index < items.length) {
        startTransition(() => {
          setIndex(index + itemsRenderedPerBatch);
        });
      }
    }, [index, items.length, startTransition, itemsRenderedPerBatch]);

    return (
      <>
        {items.map((item, i) =>
          i < index ? (
            <LibraryUnit
              id={item?.id}
              isPending={!item?.id && !!item?.layers}
              key={item?.id ?? i}
              layers={item?.layers}
              onClick={onClick}
              onDrag={onItemDrag}
              onToggle={onItemSelectToggle}
              selected={isItemSelected(item.id)}
              svgCache={svgCache}
            />
          ) : (
            <EmptyLibraryUnit key={i} />
          )
        )}
      </>
    );
  }
);
