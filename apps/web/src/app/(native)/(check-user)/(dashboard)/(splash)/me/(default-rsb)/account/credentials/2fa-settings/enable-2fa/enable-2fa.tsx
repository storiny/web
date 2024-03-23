import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Image from "~/components/image";
import Link from "~/components/link";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import QRCodeIcon from "~/icons/qr-code";
import {
  use_request_mfa_mutation,
  use_verify_mfa_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./enable-2fa.module.scss";
import { Enable2FAProps } from "./enable-2fa.props";
import {
  ENABLE_2FA_SCHEMA,
  Enable2FASchema,
  MFA_CODE_LENGTH
} from "./enable-2fa.schema";

const TESTING_ENV = is_test_env();

const Enable2FAModal = (): React.ReactElement => {
  const [qr, set_qr] = React.useState<string>("");
  const [code, set_code] = React.useState<string>("");
  const [error, set_error] = React.useState<string>(
    "Could not generate authentication credentials."
  );
  const [request_mfa, { isLoading: is_loading, isError: is_error }] =
    use_request_mfa_mutation();

  React.useEffect(() => {
    request_mfa()
      .unwrap()
      .then((res) => {
        set_qr(res.qr);
        set_code(res.code);
      })
      .catch((e) => {
        if (e?.data?.error) {
          set_error(e.data.error);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx(css["flex"], styles.content)}>
      {is_loading && !TESTING_ENV ? (
        <div
          className={clsx(css["flex-center"], css["full-w"])}
          style={{ paddingBlock: "32px" }}
        >
          <Spinner />
        </div>
      ) : is_error && !TESTING_ENV ? (
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
          <div
            className={clsx(
              css["flex-col"],
              css["flex-center"],
              styles["qr-wrapper"]
            )}
          >
            <AspectRatio className={styles["aspect-ratio"]} ratio={1}>
              <Image alt={"QR code"} src={qr} />
            </AspectRatio>
            <Typography
              className={clsx(css["t-mono"], styles.code)}
              level={"body2"}
            >
              {((code || "").match(/.{1,4}/g) || []).join(" ")}
            </Typography>
          </div>
          <Divider orientation={"vertical"} />
          <div className={css["flex-col"]}>
            <Description asChild>
              <Typography color={"minor"} level={"body2"}>
                Download an authenticator app (such as{" "}
                <Link
                  href={"https://authy.com/"}
                  target={"_blank"}
                  underline={"always"}
                >
                  Authy
                </Link>{" "}
                or{" "}
                <Link
                  href={
                    "https://support.google.com/accounts/answer/1066447?hl=en"
                  }
                  target={"_blank"}
                  underline={"always"}
                >
                  Google Authenticator
                </Link>
                ) on your phone or tablet. Scan the QR code using the
                authenticator app, or manually enter the code displayed below
                the QR code, and enter the 6-digit code generated.
              </Typography>
            </Description>
            <Spacer orientation={"vertical"} size={5} />
            <FormInput
              autoComplete={"one-time-code"}
              autoFocus
              auto_size
              data-testid={"code-input"}
              form_slot_props={{
                form_item: {
                  className: css["f-grow"]
                }
              }}
              label={"Code"}
              maxLength={MFA_CODE_LENGTH}
              minLength={MFA_CODE_LENGTH}
              name={"code"}
              placeholder={"6-digit code"}
              required
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

const Enable2FA = ({
  on_submit,
  has_password,
  set_enabled
}: Enable2FAProps): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<Enable2FASchema>({
    resolver: zod_resolver(ENABLE_2FA_SCHEMA),
    defaultValues: {
      code: ""
    }
  });
  const [verify_mfa, { isLoading: is_loading }] = use_verify_mfa_mutation();

  const handle_submit: SubmitHandler<Enable2FASchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      verify_mfa(values)
        .unwrap()
        .then(() => {
          set_enabled(true);
          toast("Successfully enabled two-factor authentication", "success");
        })
        .catch((error) => {
          set_enabled(false);

          handle_api_error(
            error,
            toast,
            form,
            "Could not verify your authentication code"
          );
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        disabled={!has_password}
        onClick={open_modal}
      >
        Enable 2FA
      </Button>
    ),
    <Form<Enable2FASchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <Enable2FAModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Confirm
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
          decorator: <QRCodeIcon />,
          children: "Enable 2FA"
        }
      }
    }
  );

  return element;
};

export default Enable2FA;
