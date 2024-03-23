import { download_as_file } from "@storiny/shared/src/utils/download-as-file";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_media_query } from "~/hooks/use-media-query";
import CopyIcon from "~/icons/copy";
import DownloadIcon from "~/icons/download";
import ScriptIcon from "~/icons/script";
import {
  RecoveryCodesResponse,
  select_user,
  use_generate_codes_mutation,
  use_recovery_codes_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./recovery-codes.module.scss";

/**
 * Formats recovery codes for export
 * @param codes Recovery codes
 * @param email Email
 */
const format_recovery_codes = (
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
  const [codes, set_codes] = React.useState<RecoveryCodesResponse>([]);
  const [error, set_error] = React.useState<string>(
    "Could not get recovery codes."
  );
  const [mutate_recovery_codes, { isLoading: is_loading, isError: is_error }] =
    use_recovery_codes_mutation();
  const [generate_codes, { isLoading: is_regenerating }] =
    use_generate_codes_mutation();

  /**
   * Copies codes to clipboard
   */
  const copy_codes_to_clipboard = (): void => {
    copy(format_recovery_codes(codes, user.email));
    toast("Recovery codes copied to clipboard", "success");
  };

  /**
   * Regenerates recovery codes
   */
  const generate_new_codes = (): void => {
    generate_codes()
      .unwrap()
      .then((next_codes) => {
        toast("Regenerated recovery codes", "success");
        set_codes(next_codes);
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not regenerate recovery codes"
        )
      );
  };

  React.useEffect(() => {
    mutate_recovery_codes()
      .unwrap()
      .then(set_codes)
      .catch((e) => {
        if (e?.data?.error) {
          set_error(e.data.error);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      {is_loading || is_regenerating ? (
        <div
          className={clsx(css["flex-center"], css["full-w"])}
          style={{ paddingBlock: "32px" }}
        >
          <Spinner />
        </div>
      ) : is_error ? (
        <div
          className={clsx(css["flex-center"], css["full-w"])}
          style={{ minHeight: "96px" }}
        >
          <Typography
            className={css["t-center"]}
            color={"minor"}
            level={"body2"}
          >
            {error}
          </Typography>
        </div>
      ) : (
        <React.Fragment>
          <Description asChild>
            <Typography color={"minor"} level={"body2"}>
              Recovery codes can be used to access your account if you lose
              access to your device and cannot receive two-factor authentication
              codes. They are just as sensitive as your password, so be sure to
              keep them in a safe place.
            </Typography>
          </Description>
          <Spacer orientation={"vertical"} size={3} />
          <div className={clsx(css["flex"], styles.content)}>
            <div className={styles.codes}>
              {codes.map((code) => (
                <Typography
                  as={"span"}
                  className={clsx(
                    css["t-mono"],
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
            <div
              className={clsx(css["full-w"], css["flex-col"], styles.actions)}
            >
              <Button
                check_auth
                decorator={<DownloadIcon />}
                onClick={(): void => {
                  download_as_file(
                    format_recovery_codes(codes, user.email),
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
                onClick={copy_codes_to_clipboard}
                size={"sm"}
                variant={"hollow"}
              >
                Copy
              </Button>
              <Spacer orientation={"vertical"} size={0.5} />
              <Link
                className={css["t-center"]}
                href={"#"}
                level={"body3"}
                onClick={(event): void => {
                  event.preventDefault();
                  generate_new_codes();
                }}
                underline={"always"}
              >
                Generate new recovery codes
              </Link>
            </div>
          </div>
          <Spacer orientation={"vertical"} size={3} />
          <Typography color={"minor"} level={"body2"}>
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
        className={css["fit-w"]}
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
