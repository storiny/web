import { downloadAsFile } from "../../../../../../../../../../../../../../packages/shared/src/utils/download-as-file";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../../../../../../../packages/ui/src/components/button";
import Link from "../../../../../../../../../../../../../../packages/ui/src/components/link";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import Spinner from "../../../../../../../../../../../../../../packages/ui/src/components/spinner";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_clipboard } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-clipboard";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import CopyIcon from "~/icons/Copy";
import DownloadIcon from "~/icons/Download";
import ScriptIcon from "~/icons/Script";
import {
  RecoveryCodesResponse,
  select_user,
  use_generate_codes_mutation,
  use_recovery_codes_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
  const user = use_app_selector(select_user)!;
  const copy = use_clipboard();
  const toast = use_toast();
  const [codes, setCodes] = React.useState<RecoveryCodesResponse>([]);
  const [error, setError] = React.useState<string>(
    "Could not get recovery codes."
  );
  const [mutateRecoveryCodes, { isLoading, isError }] =
    use_recovery_codes_mutation();
  const [generateCodes, { isLoading: isRegenerating }] =
    use_generate_codes_mutation();

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
    mutateRecoveryCodes()
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
                check_auth
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
                check_auth
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
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        onClick={open_modal}
        variant={"hollow"}
      >
        View recovery codes
      </Button>
    ),
    <RecoveryCodesModal />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile}>
            Done
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "542px"
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
