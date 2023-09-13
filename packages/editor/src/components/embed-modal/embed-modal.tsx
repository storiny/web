import { clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import Link from "~/components/Link";
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
        You can embed content from sites like Twitter and YouTube. If embedding
        from a specific site is not supported, a website preview will be
        displayed instead.{" "}
        <Link href={"/guides/embeds"} underline={"always"}>
          Learn more about embedding external content in your story
        </Link>
        .
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={4} />
    <FormInput
      autoComplete={"url"}
      autoSize
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"Link to the content"}
      name={"url"}
      placeholder={"Embed URL"}
      required
    />
    <Spacer orientation={"vertical"} />
  </React.Fragment>
);

const EmbedModal = ({
  trigger,
  modal
}: EmbedModalProps): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [open, setOpen] = React.useState<boolean>(false);
  const [insertEmbed] = useInsertEmbed();
  const form = useForm<EmbedSchema>({
    resolver: zodResolver(embedSchema),
    defaultValues: {
      url: ""
    }
  });

  const handleSubmit: SubmitHandler<EmbedSchema> = ({ url }) => {
    insertEmbed({ url: compressToEncodedURIComponent(url) });
    setOpen(false);
  };

  React.useEffect(() => console.log(open), [open]);

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
      modal,
      open,
      onOpenChange: (newOpen: boolean) => {
        form.reset();
        setOpen(newOpen);
      },
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanMobile}
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
            width: isSmallerThanMobile ? "100%" : "420px"
          }
        },
        header: {
          decorator: <EmbedIcon />,
          children: "Add an embed"
        }
      }
    }
  );

  return element;
};

export default EmbedModal;
