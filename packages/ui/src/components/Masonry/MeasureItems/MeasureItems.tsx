import React from "react";

import { layoutNumberToCss } from "../utils/layoutNumberToCss";
import { MeasureItemsProps } from "./MeasureItems.props";

const MeasureItems = <T,>({
  baseIndex,
  getPositions,
  items,
  measurementStore,
  renderItem,
  ...rest
}: MeasureItemsProps<T>): React.ReactElement => {
  const measuringPositions = getPositions(items);
  const refs = React.useMemo(() => new Map(), []);
  // Need a separate variable for use in useLayoutEffect's dependency array
  const refsSize = refs.size;

  React.useLayoutEffect(() => {
    // Case when full batch of refs
    if (refsSize === items.length) {
      // Measure all the refs
      const heights = new Map<T, number>();
      refs.forEach((element, data) => {
        heights.set(data, element.clientHeight);
      });

      // Store the measurements, which should trigger a paint
      heights.forEach((height, data) => {
        measurementStore.set(data, height);
      });

      // We're done with this batch, so clear the way for the next one
      refs.clear();
    }
  }, [items.length, measurementStore, refs, refsSize]);

  return (
    <React.Fragment>
      {items.map((data, index) => {
        // `items` is always the length of minCols, so index will always be between 0 and minCols.length.
        // We normalize the index here relative to the item list as a whole so that `itemIndex` is correct
        // and React does not reuse the measurement nodes.
        const measurementIndex = baseIndex + index;
        const position = measuringPositions[index];

        return (
          <div
            {...rest}
            key={`measuring-${measurementIndex}`}
            ref={(element): void => {
              if (element) {
                refs.set(data, element);
              }
            }}
            style={{
              ...rest?.style,
              visibility: "hidden",
              position: "absolute",
              top: layoutNumberToCss(position.top),
              left: layoutNumberToCss(position.left),
              width: layoutNumberToCss(position.width),
              height: layoutNumberToCss(position.height)
            }}
          >
            {renderItem({
              data,
              itemIndex: measurementIndex,
              isMeasuring: true
            })}
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default MeasureItems;
