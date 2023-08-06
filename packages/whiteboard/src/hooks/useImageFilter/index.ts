import React from "react";

import { isImageObject } from "../../utils";
import { useActiveObject } from "../index";

type AnyClass = { new (...args: any[]): any; prototype: any };

/**
 * Hook for using the specified image filter
 * @param Filter Filter class
 * @param filterKey Filter prop key
 */
export const useImageFilter = <T extends AnyClass>(
  Filter: T,
  filterKey: keyof T["prototype"]
): {
  setValue: (newValue: number) => void;
  value: number;
} => {
  const activeImage = useActiveObject();
  const [value, setValue] = React.useState<number>(0);

  const getActiveFilter = React.useCallback(() => {
    if (activeImage && isImageObject(activeImage)) {
      return activeImage.filters.find(
        (filter) => filter.type === Filter.prototype.type
      );
    }
  }, [Filter.prototype.type, activeImage]);

  /**
   * Mutates the value of the filter using the specified filter key
   */
  const setValueImpl = React.useCallback(
    (newValue: number) => {
      setValue(newValue);

      if (activeImage && isImageObject(activeImage)) {
        const activeFilter = getActiveFilter();
        if (activeFilter) {
          (activeFilter as any)[filterKey] = newValue;
        } else {
          const newFilter = new Filter({ [filterKey]: newValue });
          activeImage.filters.push(newFilter);
        }

        activeImage.applyFilters();
        activeImage.canvas?.renderAll();
      }
    },
    [Filter, activeImage, filterKey, getActiveFilter]
  );

  React.useEffect(() => {
    const activeFilter = getActiveFilter();

    if (activeFilter) {
      const currentValue = (activeFilter as any)[filterKey];
      if (typeof currentValue === "number") {
        setValue(currentValue);
      }
    }
  }, [Filter.prototype.type, activeImage, filterKey, getActiveFilter]);

  return { setValue: setValueImpl, value };
};
