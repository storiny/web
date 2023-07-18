import "./RoomDialog.scss";

import * as Popover from "@radix-ui/react-popover";
import { useRef, useState } from "react";

import { getFrame } from "../../../lib/utils/utils";
import { trackEvent } from "../../analytics";
import { ReactComponent as CollabImage } from "../../assets/lock.svg";
import { copyTextToSystemClipboard } from "../../clipboard";
import { Dialog } from "../../components/Dialog";
import { FilledButton } from "../../components/FilledButton";
import {
  copyIcon,
  playerPlayIcon,
  playerStopFilledIcon,
  share,
  shareIOS,
  shareWindows,
  tablerCheckIcon
} from "../../components/icons";
import { TextField } from "../../components/TextField";
import { useI18n } from "../../i18n";
import { KEYS } from "../../keys";

const getShareIcon = () => {
  const navigator = window.navigator as any;
  const isAppleBrowser = /Apple/.test(navigator.vendor);
  const isWindowsBrowser = navigator.appVersion.indexOf("Win") !== -1;

  if (isAppleBrowser) {
    return shareIOS;
  } else if (isWindowsBrowser) {
    return shareWindows;
  }

  return share;
};

export type RoomModalProps = {
  activeRoomLink: string;
  handleClose: () => void;
  onRoomCreate: () => void;
  onRoomDestroy: () => void;
  onUsernameChange: (username: string) => void;
  setErrorMessage: (message: string) => void;
  username: string;
};

export const RoomModal = ({
  activeRoomLink,
  onRoomCreate,
  onRoomDestroy,
  setErrorMessage,
  username,
  onUsernameChange,
  handleClose
}: RoomModalProps) => {
  const { t } = useI18n();
  const [justCopied, setJustCopied] = useState(false);
  const timerRef = useRef<number>(0);
  const ref = useRef<HTMLInputLayer>(null);
  const isShareSupported = "share" in navigator;

  const copyRoomLink = async () => {
    try {
      await copyTextToSystemClipboard(activeRoomLink);

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

  const shareRoomLink = async () => {
    try {
      await navigator.share({
        title: t("roomDialog.shareTitle"),
        text: t("roomDialog.shareTitle"),
        url: activeRoomLink
      });
    } catch (error: any) {
      // Just ignore.
    }
  };

  if (activeRoomLink) {
    return (
      <>
        <h3 className="RoomDialog__active__header">
          {t("labels.liveCollaboration")}
        </h3>
        <TextField
          label="Your name"
          onChange={onUsernameChange}
          onKeyDown={(event) => event.key === KEYS.ENTER && handleClose()}
          placeholder="Your name"
          value={username}
        />
        <div className="RoomDialog__active__linkRow">
          <TextField
            fullWidth
            label="Link"
            readonly
            ref={ref}
            value={activeRoomLink}
          />
          {isShareSupported && (
            <FilledButton
              className="RoomDialog__active__share"
              label="Share"
              onClick={shareRoomLink}
              size="large"
              startIcon={getShareIcon()}
              variant="icon"
            />
          )}
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
              className="RoomDialog__popover"
              onCloseAutoFocus={(event) => event.preventDefault()}
              onOpenAutoFocus={(event) => event.preventDefault()}
              side="top"
              sideOffset={5.5}
            >
              {tablerCheckIcon} copied
            </Popover.Content>
          </Popover.Root>
        </div>
        <div className="RoomDialog__active__description">
          <p>
            <span
              aria-hidden="true"
              className="RoomDialog__active__description__emoji"
              role="img"
            >
              🔒{" "}
            </span>
            {t("roomDialog.desc_privacy")}
          </p>
          <p>{t("roomDialog.desc_exitSession")}</p>
        </div>

        <div className="RoomDialog__active__actions">
          <FilledButton
            color="danger"
            label={t("roomDialog.button_stopSession")}
            onClick={() => {
              trackEvent("share", "room closed");
              onRoomDestroy();
            }}
            size="large"
            startIcon={playerStopFilledIcon}
            variant="outlined"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="RoomDialog__inactive__illustration">
        <CollabImage />
      </div>
      <div className="RoomDialog__inactive__header">
        {t("labels.liveCollaboration")}
      </div>

      <div className="RoomDialog__inactive__description">
        <strong>{t("roomDialog.desc_intro")}</strong>
        {t("roomDialog.desc_privacy")}
      </div>

      <div className="RoomDialog__inactive__start_session">
        <FilledButton
          label={t("roomDialog.button_startSession")}
          onClick={() => {
            trackEvent("share", "room creation", `ui (${getFrame()})`);
            onRoomCreate();
          }}
          size="large"
          startIcon={playerPlayIcon}
        />
      </div>
    </>
  );
};

const RoomDialog = (props: RoomModalProps) => (
  <Dialog onCloseRequest={props.handleClose} size="small" title={false}>
    <div className="RoomDialog">
      <RoomModal {...props} />
    </div>
  </Dialog>
);

export default RoomDialog;
