import { ChipProps } from "~/components/Chip";

// Avoid `tag` prop like other entities to control the rendering of stats.
export interface TagProps
  extends Omit<ChipProps, "type" | "variant" | "as" | "decorator"> {
  /**
   * The users following this tag.
   */
  followerCount?: number;
  /**
   * The number of stories having this tag.
   */
  storyCount?: number;
  /**
   * The name of the tag.
   */
  value: string;
  /**
   * If `true`, renders with a HashIcon decorator
   */
  withDecorator?: boolean;
}
