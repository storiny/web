import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import IconButton from "~/components/IconButton";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import CaretDefaultIcon from "~/icons/CaretDefault";
import SidebarCollapseIcon from "~/icons/SidebarCollapse";

import { sidebarsCollapsedAtom } from "../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../constants/shortcuts";

const Appearance = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const setSidebarsCollapsed = useSetAtom(sidebarsCollapsedAtom);
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
              slotProps={{
                trigger: {
                  className: "full-w",
                  "aria-label": "Caret style"
                },
                value: {
                  placeholder: "Caret style"
                }
              }}
              valueChildren={
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
          rightSlot={getShortcutLabel(EDITOR_SHORTCUTS.sidebars)}
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
