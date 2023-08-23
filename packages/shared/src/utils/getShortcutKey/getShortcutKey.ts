import { IS_APPLE } from "../../browsers";
import { GetShortcutKeyProps } from "./getShortcutKey.props";

/**
 * Returns the shortcut key depending on the user's browser environment
 * @param props Props
 */
export const getShortcutKey = (props: GetShortcutKeyProps): string => {
  const { key: keyProp, shift, cmd, opt } = props;
  let key = [];

  if (cmd) {
    key.push(IS_APPLE ? "command" : "control");
  }

  if (opt) {
    key.push(IS_APPLE ? "opt" : "alt");
  }

  if (shift) {
    key.push("shift");
  }

  key.push(keyProp);

  return key.join("+");
};
