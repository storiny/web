import { downloadAsFile } from "@storiny/shared/src/utils/downloadAsFile";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Link from "~/components/Link";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useClipboard } from "~/hooks/useClipboard";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CopyIcon from "~/icons/Copy";
import DownloadIcon from "~/icons/Download";
import ScriptIcon from "~/icons/Script";
import {
  RecoveryCodesResponse,
  selectUser,
  useGenerateCodesMutation,
  useRecoveryCodesMutation
} from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./recovery-codes.module.scss";

/**
 * Formats recovery codes for export
 * @param codes Recovery codes
 * @param email Email
 */
const formatRecoveryCodes = (
  codes: RecoveryCodesResponse,
  email?: string
): string =>
  [
    `Storiny recovery codes${email ? ` for account ${email}` : ""}.`,
    codes
      .map(({ value, used }) => (used ? `${value} (used)` : value))
      .join("\n")
  ].join("\n");

const RecoveryCodesModal = (): React.ReactElement => {
  const user = useAppSelector(selectUser)!;
  const copy = useClipboard();
  const toast = useToast();
  const [codes, setCodes] = React.useState<RecoveryCodesResponse>([]);
  const [error, setError] = React.useState<string>(
    "Could not get recovery codes."
  );
  const [recoveryCodes, { isLoading, isError }] = useRecoveryCodesMutation();
  const [generateCodes, { isLoading: isRegenerating }] =
    useGenerateCodesMutation();

  /**
   * Copies codes to clipboard
   */
  const copyCodesToClipboard = (): void => {
    copy(formatRecoveryCodes(codes, user.email));
    toast("Recovery codes copied to clipboard", "success");
  };

  /**
   * Regenerates recovery codes
   */
  const generateNewCodes = (): void => {
    generateCodes()
      .unwrap()
      .then((newCodes) => {
        toast("Regenerated recovery codes", "success");
        setCodes(newCodes);
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not regenerate recovery codes", "error")
      );
  };

  React.useEffect(() => {
    recoveryCodes()
      .unwrap()
      .then(setCodes)
      .catch((e) => {
        if (e?.data?.error) {
          setError(e.data.error);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      {isLoading || isRegenerating ? (
        <div
          className={clsx("flex-center", "full-w")}
          style={{ paddingBlock: "32px" }}
        >
          <Spinner />
        </div>
      ) : isError ? (
        <div
          className={clsx("flex-center", "full-w")}
          style={{ minHeight: "96px" }}
        >
          <Typography className={clsx("t-minor", "t-center")} level={"body2"}>
            {error}
          </Typography>
        </div>
      ) : (
        <React.Fragment>
          <Description asChild>
            <Typography className={"t-minor"} level={"body2"}>
              Recovery codes can be used to access your account if you lose
              access to your device and cannot receive two-factor authentication
              codes. They are just as sensitive as your password, so be sure to
              keep them in a safe place.
            </Typography>
          </Description>
          <Spacer orientation={"vertical"} size={3} />
          <div className={clsx("flex", styles.content)}>
            <div className={styles.codes}>
              {codes.map((code) => (
                <Typography
                  as={"span"}
                  className={clsx(
                    "t-mono",
                    styles.code,
                    code.used && styles.used
                  )}
                  key={code.value}
                  level={"body2"}
                >
                  {code.value}
                </Typography>
              ))}
            </div>
            <div className={clsx("full-w", "flex-col", styles.actions)}>
              <Button
                decorator={<DownloadIcon />}
                onClick={(): void => {
                  downloadAsFile(
                    formatRecoveryCodes(codes, user.email),
                    "storiny_recovery_codes.txt"
                  );
                }}
                size={"sm"}
                variant={"hollow"}
              >
                Download
              </Button>
              <Button
                decorator={<CopyIcon />}
                onClick={copyCodesToClipboard}
                size={"sm"}
                variant={"hollow"}
              >
                Copy
              </Button>
              <Spacer orientation={"vertical"} size={0.5} />
              <Link
                className={"t-center"}
                href={"#"}
                level={"body3"}
                onClick={generateNewCodes}
                underline={"always"}
              >
                Generate new recovery codes
              </Link>
            </div>
          </div>
          <Spacer orientation={"vertical"} size={3} />
          <Typography className={"t-minor"} level={"body2"}>
            Each of these codes can only be used once, and the ones that have
            been used are crossed out. When you generate new recovery codes, be
            sure to save them because the older ones will no longer work.
          </Typography>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const RecoveryCodes = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        className={"fit-w"}
        onClick={openModal}
        variant={"hollow"}
      >
        View recovery codes
      </Button>
    ),
    <RecoveryCodesModal />,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile}>
            Done
          </ModalFooterButton>
        </>
      ),
      slotProps: {
        footer: {
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "542px"
          }
        },
        header: {
          decorator: <ScriptIcon />,
          children: "Recovery codes"
        }
      }
    }
  );

  return element;
};

export default RecoveryCodes;
