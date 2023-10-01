import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import IconButton from "~/components/icon-button";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import CaretDefaultIcon from "~/icons/caret-default";
import SidebarCollapseIcon from "~/icons/sidebar-collapse";
import css from "~/theme/main.module.scss";

import { sidebars_collapsed_atom } from "../../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";

const Appearance = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const set_sidebars_collapsed = use_set_atom(sidebars_collapsed_atom);
  return (
    <div className={css["flex-col"]}>
      <Typography
        className={clsx(css["t-minor"], css["t-medium"])}
        level={"body2"}
      >
        Appearance
      </Typography>
      <Spacer orientation={"vertical"} size={2} />
      <div className={css["flex-center"]}>
        {/* TODO: Implement */}
        <Tooltip content={"Available soon"}>
          <div className={css["f-grow"]}>
            <Select
              defaultValue={"default"}
              disabled
              slot_props={{
                trigger: {
                  className: css["full-w"],
                  "aria-label": "Caret style"
                },
                value: {
                  placeholder: "Caret style"
                }
              }}
              value_children={
                <span className={css["flex-center"]}>
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
