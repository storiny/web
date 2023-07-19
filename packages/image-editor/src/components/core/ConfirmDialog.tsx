import "./ConfirmDialog.scss";

import { useSetAtom } from "jotai";

import { jotaiScope } from "../../core/jotai";
import { t } from "../i18n";
import { useExcalidrawContainer, useExcalidrawSetAppState } from "./App";
import { Dialog, DialogProps } from "./Dialog";
import DialogActionButton from "./DialogActionButton";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";

interface Props extends Omit<DialogProps, "onCloseRequest"> {
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}
const ConfirmDialog = (props: Props) => {
  const {
    onConfirm,
    onCancel,
    children,
    confirmText = t("buttons.confirm"),
    cancelText = t("buttons.cancel"),
    className = "",
    ...rest
  } = props;
  const setAppState = useExcalidrawSetAppState();
  const setIsLibraryMenuOpen = useSetAtom(isLibraryMenuOpenAtom, jotaiScope);
  const { container } = useExcalidrawContainer();

  return (
    <Dialog
      onCloseRequest={onCancel}
      size="small"
      {...rest}
      className={`confirm-dialog ${className}`}
    >
      {children}
      <div className="confirm-dialog-buttons">
        <DialogActionButton
          label={cancelText}
          onClick={() => {
            setAppState({ openMenu: null });
            setIsLibraryMenuOpen(false);
            onCancel();
            container?.focus();
          }}
        />
        <DialogActionButton
          actionType="danger"
          label={confirmText}
          onClick={() => {
            setAppState({ openMenu: null });
            setIsLibraryMenuOpen(false);
            onConfirm();
            container?.focus();
          }}
        />
      </div>
    </Dialog>
  );
};
export default ConfirmDialog;
