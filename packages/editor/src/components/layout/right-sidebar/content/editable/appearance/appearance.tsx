import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import {
  useAtomValue as use_atom_value,
  useSetAtom as use_set_atom
} from "jotai";
import React from "react";

import IconButton from "~/components/icon-button";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import SidebarCollapseIcon from "~/icons/sidebar-collapse";
import css from "~/theme/main.module.scss";

import {
  awareness_atom,
  sidebars_collapsed_atom
} from "../../../../../../atoms";
import { EDITOR_SHORTCUTS } from "../../../../../../constants/shortcuts";

const Appearance = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const set_sidebars_collapsed = use_set_atom(sidebars_collapsed_atom);
  const awareness = use_atom_value(awareness_atom);

  return (
    <div className={css["flex-col"]}>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Appearance
      </Typography>
      <Spacer orientation={"vertical"} size={2} />
      <div className={css["flex-center"]}>
        <Select
          defaultValue={"default"}
          onValueChange={(next_value): void =>
            awareness?.setLocalStateField("cursor_type", next_value)
          }
          slot_props={{
            trigger: {
              className: css["f-grow"],
              "aria-label": "Caret style"
            },
            value: {
              placeholder: "Caret style"
            }
          }}
        >
          <Option value={"default"}>Default caret</Option>
          <Option value={"mini"}>Mini caret</Option>
        </Select>
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
