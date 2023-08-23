export interface GetShortcutKeyProps {
  /**
   * Command key flag
   */
  cmd?: boolean;
  /**
   * Shortcut key
   */
  key: string;
  /**
   * Option key flap
   */
  opt?: boolean;
  /**
   * Shift key flag
   */
  shift?: boolean;
}
