import { clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import EmbedIcon from "~/icons/Embed";
import { breakpoints } from "~/theme/breakpoints";

import { useInsertEmbed } from "../../hooks/use-insert-embed";
import { EmbedModalProps } from "./embed-modal.props";
import { EmbedSchema, embedSchema } from "./schema";

const EmbedModalContent = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        Enter the URL
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormInput
      autoComplete={"url"}
      autoSize
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"URL"}
      name={"url"}
      placeholder={"Embed URL"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const EmbedModal = ({ trigger }: EmbedModalProps): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [insertEmbed] = useInsertEmbed();
  const form = useForm<EmbedSchema>({
    resolver: zodResolver(embedSchema),
    defaultValues: {
      url: ""
    }
  });

  const handleSubmit: SubmitHandler<EmbedSchema> = ({ url }) => {
    insertEmbed({ url: compressToEncodedURIComponent(url) });
  };

  const [element] = useModal(
    trigger,
    <Form<EmbedSchema>
      className={clsx("flex-col")}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <EmbedModalContent />
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
            onClick={(): void => {
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
            width: isSmallerThanMobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <EmbedIcon />,
          children: "Insert an embed"
        }
      }
    }
  );

  return element;
};

export default EmbedModal;
