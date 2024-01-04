import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { clsx } from "clsx";
import React from "react";

import IconButton from "~/components/icon-button";
import { use_toast } from "~/components/toast";
import Tooltip from "~/components/tooltip";
import CopyIcon from "~/icons/copy";
import { copy_to_clipboard } from "~/utils/copy-to-clipboard";

import styles from "../../editor.module.scss";
import { CopyCodeActionProps } from "./copy-code-action.props";

const CopyCodeAction = ({ view }: CopyCodeActionProps): React.ReactElement => {
  const toast = use_toast();

  /**
   * Copies the code block contents to the clipboard.
   */
  const copy_code_content = React.useCallback(async () => {
    if (view !== null) {
      try {
        const content = view.state.doc.toString() ?? "";
        await copy_to_clipboard(content);
        toast("Copied to clipboard", "success");
      } catch (error) {
        dev_console.error(error);
        toast("Unable to copy the code", "error");
      }
    }
  }, [toast, view]);

  return (
    <Tooltip content={"Copy code content"}>
      <IconButton
        className={clsx(styles.x, styles.action)}
        onClick={copy_code_content}
        variant={"ghost"}
      >
        <CopyIcon />
      </IconButton>
    </Tooltip>
  );
};

export default CopyCodeAction;
