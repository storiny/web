import React from "react";

import { layout_number_to_css } from "../utils/layout-number-to-css";
import { MeasureItemsProps } from "./measure-items.props";

const MeasureItems = <T,>({
  base_index,
  get_positions,
  items,
  measurement_store,
  render_item,
  ...rest
}: MeasureItemsProps<T>): React.ReactElement => {
  const measuring_positions = get_positions(items);
  const refs = React.useMemo(() => new Map(), []);
  // Need a separate variable for use in use_layout_effect's dependency array
  const refs_size = refs.size;

  React.useLayoutEffect(() => {
    // Case when full batch of refs
    if (refs_size === items.length) {
      // Measure all the refs
      const heights = new Map<T, number>();
      refs.forEach((element, data) => {
        heights.set(data, element.clientHeight);
      });

      // Store the measurements, which should trigger a paint
      heights.forEach((height, data) => {
        measurement_store.set(data, height);
      });

      // We're done with this batch, so clear the way for the next one
      refs.clear();
    }
  }, [items.length, measurement_store, refs, refs_size]);

  return (
    <React.Fragment>
      {items.map((data, index) => {
        // `items` is always the length of minCols, so index will always be between 0 and minCols.length.
        // We normalize the index here relative to the item list as a whole so that `itemIndex` is correct and React does not reuse the measurement nodes.
        const measurement_index = base_index + index;
        const position = measuring_positions[index];

        return (
          <div
            {...rest}
            key={`measuring-${measurement_index}`}
            ref={(element): void => {
              if (element) {
                refs.set(data, element);
              }
            }}
            style={{
              ...rest?.style,
              visibility: "hidden",
              position: "absolute",
              top: layout_number_to_css(position.top),
              left: layout_number_to_css(position.left),
              width: layout_number_to_css(position.width),
              height: layout_number_to_css(position.height)
            }}
          >
            {render_item({
              data,
              item_index: measurement_index,
              is_measuring: true
            })}
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default MeasureItems;
