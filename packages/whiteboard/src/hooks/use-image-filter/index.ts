import React from "react";

import { is_image_object } from "../../utils";
import { use_active_object } from "../index";
import { is_num } from "@storiny/shared/src/utils/is-num";

type AnyClass = { new (...args: any[]): any; prototype: any };

/**
 * Hook for using the specified image filter
 * @param Filter Filter class
 * @param filter_key Filter prop key
 */
export const use_image_filter = <T extends AnyClass>(
  Filter: T,
  filter_key: keyof T["prototype"]
): {
  set_value: (next_value: number) => void;
  value: number;
} => {
  const active_image = use_active_object();
  const [value, set_value] = React.useState<number>(0);

  const get_active_filter = React.useCallback(() => {
    if (active_image && is_image_object(active_image)) {
      return active_image.filters.find(
        (filter) => filter.type === Filter.prototype.type
      );
    }
  }, [Filter.prototype.type, active_image]);

  /**
   * Mutates the value of the filter using the specified filter key
   */
  const set_value_impl = React.useCallback(
    (next_value: number) => {
      set_value(next_value);

      if (active_image && is_image_object(active_image)) {
        const active_filter = get_active_filter();
        if (active_filter) {
          (active_filter as any)[filter_key] = next_value;
        } else {
          const next_filter = new Filter({ [filter_key]: next_value });
          active_image.filters.push(next_filter);
        }

        active_image.applyFilters();
        active_image.canvas?.renderAll();
      }
    },
    [Filter, active_image, filter_key, get_active_filter]
  );

  React.useEffect(() => {
    const active_filter = get_active_filter();

    if (active_filter) {
      const current_value = (active_filter as any)[filter_key];

      if (is_num(current_value)) {
        set_value(current_value);
      }
    }
  }, [Filter.prototype.type, active_image, filter_key, get_active_filter]);

  return { set_value: set_value_impl, value };
};
