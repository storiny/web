import { ChipProps } from "~/components/chip";

// Avoid `tag` prop like other entities to control the rendering of stats
export interface TagChipProps
  extends Omit<ChipProps, "type" | "variant" | "as" | "decorator"> {
  /**
   * The users following this tag.
   */
  follower_count?: number;
  /**
   * The number of stories having this tag.
   */
  story_count?: number;
  /**
   * The name of the tag.
   */
  value: string;
  /**
   * If `true`, renders with a HashIcon decorator
   */
  with_decorator?: boolean;
}
