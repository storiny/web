export interface UseStickyProps {
  /*
   * If `true`, content will stick to the bottom of viewport,
   * provided that the styles are set up correctly.
   * @default false
   */
  bottom?: boolean;
  /*
   * The offset to the bottom of the viewport in pixels.
   * @default 0
   */
  offsetBottom?: number;
  /*
   * The offset to the top of the viewport in pixels.
   * @default 0
   */
  offsetTop?: number;
}
