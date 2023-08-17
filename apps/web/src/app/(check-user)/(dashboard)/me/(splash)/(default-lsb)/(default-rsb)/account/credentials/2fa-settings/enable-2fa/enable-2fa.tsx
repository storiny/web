import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import Image from "~/components/Image";
import Link from "~/components/Link";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import QRCodeIcon from "~/icons/QRCode";
import { useRequestMfaMutation, useVerfyMfaMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./enable-2fa.module.scss";
import { Enable2FAProps } from "./enable-2fa.props";
import {
  Enable2FASchema,
  enable2faSchema,
  MFA_CODE_LENGTH
} from "./enable-2fa.schema";

const testingEnv = isTestEnv();

const Enable2FAModal = (): React.ReactElement => {
  const [qr, setQr] = React.useState<string>("");
  const [code, setCode] = React.useState<string>("");
  const [error, setError] = React.useState<string>(
    "Could not generate authentication credentials."
  );
  const [requestMfa, { isLoading, isError }] = useRequestMfaMutation();

  React.useEffect(() => {
    requestMfa()
      .unwrap()
      .then((res) => {
        setQr(res.qr);
        setCode(res.code);
      })
      .catch((e) => {
        if (e?.data?.error) {
          setError(e.data.error);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("flex", styles.content)}>
      {isLoading && !testingEnv ? (
        <div
          className={clsx("flex-center", "full-w")}
          style={{ paddingBlock: "32px" }}
        >
          <Spinner />
        </div>
      ) : isError && !testingEnv ? (
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
          <div
            className={clsx("flex-col", "flex-center", styles["qr-wrapper"])}
          >
            <AspectRatio className={styles["aspect-ratio"]} ratio={1}>
              <Image alt={"QR code"} src={qr} />
            </AspectRatio>
            <Typography className={clsx("t-mono", styles.code)} level={"body2"}>
              {code}
            </Typography>
          </div>
          <Divider orientation={"vertical"} />
          <div className={"flex-col"}>
            <Description asChild>
              <Typography className={"t-minor"} level={"body2"}>
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
              autoSize
              data-testid={"code-input"}
              formSlotProps={{
                formItem: {
                  className: "f-grow"
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
  onSubmit,
  has_password,
  setEnabled
}: Enable2FAProps): React.ReactElement => {
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<Enable2FASchema>({
    resolver: zodResolver(enable2faSchema),
    defaultValues: {
      code: ""
    }
  });
  const [verifyMfa, { isLoading }] = useVerfyMfaMutation();

  const handleSubmit: SubmitHandler<Enable2FASchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      verifyMfa(values)
        .unwrap()
        .then(() => {
          setEnabled(true);
          toast("Successfully enabled two-factor authentication", "success");
        })
        .catch((e) => {
          setEnabled(false);
          toast(
            e?.data?.error || "Could not verify your authentication code",
            "error"
          );
        });
    }
  };

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        disabled={!has_password}
        onClick={openModal}
      >
        Enable 2FA
      </Button>
    ),
    <Form<Enable2FASchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <Enable2FAModal />
    </Form>,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanMobile}
            disabled={!form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
            }}
          >
            Confirm
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
          decorator: <QRCodeIcon />,
          children: "Enable 2FA"
        }
      }
    }
  );

  return element;
};

export default Enable2FA;
