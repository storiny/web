import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import IconButton from "../../../../../../../../ui/src/components/icon-button";
import Select from "../../../../../../../../ui/src/components/select";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import Tooltip from "../../../../../../../../ui/src/components/tooltip";
import Typography from "../../../../../../../../ui/src/components/typography";
import CaretDefaultIcon from "../../../../../../../../ui/src/icons/caret-default";
import SidebarCollapseIcon from "../../../../../../../../ui/src/icons/sidebar-collapse";

import { sidebars_collapsed_atom } from "../../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";

const Appearance = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const set_sidebars_collapsed = use_set_atom(sidebars_collapsed_atom);
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
          right_slot={get_shortcut_label(EDITOR_SHORTCUTS.sidebars)}
        >
          <IconButton
            disabled={disabled}
            onClick={(): void => set_sidebars_collapsed(true)}
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
