import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import IconButton from "../../../../../../../../ui/src/components/icon-button";
import Select from "../../../../../../../../ui/src/components/select";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import Tooltip from "../../../../../../../../ui/src/components/tooltip";
import Typography from "../../../../../../../../ui/src/components/typography";
import CaretDefaultIcon from "~/icons/CaretDefault";
import SidebarCollapseIcon from "~/icons/SidebarCollapse";

import { sidebarsCollapsedAtom } from "../../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";

const Appearance = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const setSidebarsCollapsed = use_set_atom(sidebarsCollapsedAtom);
  return (
    <div className={"flex-col"}>
      <Typography className={clsx("t-minor", "t-medium")} level={"body2"}>
        Appearance
      </Typography>
      <Spacer orientation={"vertical"} size={2} />
      <div className={"flex-center"}>
        {/* TODO: Implement */}
        <Tooltip content={"Available soon"}>
          <div className={"f-grow"}>
            <Select
              defaultValue={"default"}
              disabled
              slot_props={{
                trigger: {
                  className: "full-w",
                  "aria-label": "Caret style"
                },
                value: {
                  placeholder: "Caret style"
                }
              }}
              value_children={
                <span className={"flex-center"}>
                  <CaretDefaultIcon />
                  <Spacer />
                  Default caret
                </span>
              }
            />
          </div>
        </Tooltip>
        <Spacer />
        <Tooltip
          content={"Collapse sidebars"}
          right_slot={getShortcutLabel(EDITOR_SHORTCUTS.sidebars)}
        >
          <IconButton
            disabled={disabled}
            onClick={(): void => setSidebarsCollapsed(true)}
            variant={"ghost"}
          >
            <SidebarCollapseIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

export default Appearance;
