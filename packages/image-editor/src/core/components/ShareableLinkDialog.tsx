import "./ShareableLinkDialog.scss";

import * as Popover from "@radix-ui/react-popover";
import { useRef, useState } from "react";

import { copyTextToSystemClipboard } from "../clipboard";
import { useI18n } from "../i18n";
import { Dialog } from "./Dialog";
import { FilledButton } from "./FilledButton";
import { copyIcon, tablerCheckIcon } from "./icons";
import { TextField } from "./TextField";

export type ShareableLinkDialogProps = {
  link: string;

  onCloseRequest: () => void;
  setErrorMessage: (error: string) => void;
};

export const ShareableLinkDialog = ({
  link,
  onCloseRequest,
  setErrorMessage
}: ShareableLinkDialogProps) => {
  const { t } = useI18n();
  const [justCopied, setJustCopied] = useState(false);
  const timerRef = useRef<number>(0);
  const ref = useRef<HTMLInputLayer>(null);

  const copyRoomLink = async () => {
    try {
      await copyTextToSystemClipboard(link);

      setJustCopied(true);

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        setJustCopied(false);
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message);
    }

    ref.current?.select();
  };

  return (
    <Dialog onCloseRequest={onCloseRequest} size="small" title={false}>
      <div className="ShareableLinkDialog">
        <h3>Shareable link</h3>
        <div className="ShareableLinkDialog__linkRow">
          <TextField
            fullWidth
            label="Link"
            readonly
            ref={ref}
            selectOnRender
            value={link}
          />
          <Popover.Root open={justCopied}>
            <Popover.Trigger asChild>
              <FilledButton
                label="Copy link"
                onClick={copyRoomLink}
                size="large"
                startIcon={copyIcon}
              />
            </Popover.Trigger>
            <Popover.Content
              align="end"
              className="ShareableLinkDialog__popover"
              onCloseAutoFocus={(event) => event.preventDefault()}
              onOpenAutoFocus={(event) => event.preventDefault()}
              side="top"
              sideOffset={5.5}
            >
              {tablerCheckIcon} copied
            </Popover.Content>
          </Popover.Root>
        </div>
        <div className="ShareableLinkDialog__description">
          🔒 {t("alerts.uploadedSecurly")}
        </div>
      </div>
    </Dialog>
  );
};
