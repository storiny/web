import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import TitleBlock from "~/entities/TitleBlock";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import MailIcon from "~/icons/Mail";
import PasswordIcon from "~/icons/Password";
import { mutateUser, useEmailSettingsMutation } from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

const RecoveryCodesModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        Codes
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

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
            width: isSmallerThanMobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <MailIcon />,
          children: "Change your e-mail"
        }
      }
    }
  );

  return element;
};

export default RecoveryCodes;
