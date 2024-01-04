import { EditorView } from "@codemirror/view";
import { clsx } from "clsx";
import React from "react";

import IconButton from "~/components/icon-button";
import Tooltip from "~/components/tooltip";
import TextUnwrapIcon from "~/icons/text-unwrap";
import TextWrapIcon from "~/icons/text-wrap";
import { use_app_selector } from "~/redux/hooks";

import styles from "../../editor.module.scss";
import { WrapLinesActionProps } from "./wrap-lines-action.props";

const WrapLinesAction = ({
  view,
  wrap_compartment
}: WrapLinesActionProps): React.ReactElement => {
  const wrap_lines_preference = use_app_selector(
    (state) => state.preferences.enable_code_wrapping
  );
  const [wrap_lines, set_wrap_lines] = React.useState<boolean>(
    wrap_lines_preference
  );

  React.useEffect(() => {
    if (view !== null) {
      view.dispatch({
        effects: wrap_compartment.reconfigure(
          wrap_lines ? EditorView.lineWrapping : []
        )
      });
    }
  }, [view, wrap_compartment, wrap_lines]);

  return (
    <Tooltip content={`${wrap_lines ? "Unwrap" : "Wrap"} lines`}>
      <IconButton
        className={clsx(styles.x, styles.action)}
        onClick={(): void => set_wrap_lines((prev_state) => !prev_state)}
        variant={"ghost"}
      >
        {wrap_lines ? <TextUnwrapIcon /> : <TextWrapIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default WrapLinesAction;
