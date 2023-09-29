export interface UseStickyProps {
  /**
   * If `true`, content will stick to the bottom of viewport,
   * provided that the styles are set up correctly
   * @default false
   */
  bottom?: boolean;
  /**
   * The offset to the bottom of the viewport in pixels
   * @default 0
   */
  offset_bottom?: number;
  /**
   * The offset to the top of the viewport in pixels
   * @default 0
   */
  offset_top?: number;
}
