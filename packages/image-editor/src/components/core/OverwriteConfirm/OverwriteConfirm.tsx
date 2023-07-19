import "./OverwriteConfirm.scss";

import { useAtom } from "jotai";
import React from "react";

import { useTunnels } from "../../../core/context/tunnels";
import { jotaiScope } from "../../../core/jotai";
import { Dialog } from "../Dialog";
import { FilledButton } from "../FilledButton";
import { withInternalFallback } from "../hoc/withInternalFallback";
import { alertTriangleIcon } from "../icons";
import { Action, Actions } from "./OverwriteConfirmActions";
import { overwriteConfirmStateAtom } from "./OverwriteConfirmState";

export type OverwriteConfirmDialogProps = {
  children: React.ReactNode;
};

const OverwriteConfirmDialog = Object.assign(
  withInternalFallback(
    "OverwriteConfirmDialog",
    ({ children }: OverwriteConfirmDialogProps) => {
      const { OverwriteConfirmDialogTunnel } = useTunnels();
      const [overwriteConfirmState, setState] = useAtom(
        overwriteConfirmStateAtom,
        jotaiScope
      );

      if (!overwriteConfirmState.active) {
        return null;
      }

      const handleClose = () => {
        overwriteConfirmState.onClose();
        setState((state) => ({ ...state, active: false }));
      };

      const handleConfirm = () => {
        overwriteConfirmState.onConfirm();
        setState((state) => ({ ...state, active: false }));
      };

      return (
        <OverwriteConfirmDialogTunnel.In>
          <Dialog onCloseRequest={handleClose} size={916} title={false}>
            <div className="OverwriteConfirm">
              <h3>{overwriteConfirmState.title}</h3>
              <div
                className={`OverwriteConfirm__Description OverwriteConfirm__Description--color-${overwriteConfirmState.color}`}
              >
                <div className="OverwriteConfirm__Description__icon">
                  {alertTriangleIcon}
                </div>
                <div>{overwriteConfirmState.description}</div>
                <div className="OverwriteConfirm__Description__spacer"></div>
                <FilledButton
                  color={overwriteConfirmState.color}
                  label={overwriteConfirmState.actionLabel}
                  onClick={handleConfirm}
                  size="large"
                />
              </div>
              <Actions>{children}</Actions>
            </div>
          </Dialog>
        </OverwriteConfirmDialogTunnel.In>
      );
    }
  ),
  {
    Actions,
    Action
  }
);

export { OverwriteConfirmDialog };
