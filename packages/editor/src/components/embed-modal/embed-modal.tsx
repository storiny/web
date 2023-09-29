import { clsx } from "clsx";
import { compressToEncodedURIComponent } from "lz-string";
import React from "react";

import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../ui/src/components/form";
import FormInput from "../../../../ui/src/components/form-input";
import Link from "../../../../ui/src/components/link";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../ui/src/components/modal";
import Spacer from "../../../../ui/src/components/spacer";
import Typography from "../../../../ui/src/components/typography";
import { use_media_query } from "../../../../ui/src/hooks/use-media-query";
import EmbedIcon from "~/icons/Embed";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
      auto_size
      form_slot_props={{
        form_item: {
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
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [open, setOpen] = React.useState<boolean>(false);
  const [insertEmbed] = useInsertEmbed();
  const form = use_form<EmbedSchema>({
    resolver: zod_resolver(embedSchema),
    defaultValues: {
      url: ""
    }
  });

  const handleSubmit: SubmitHandler<EmbedSchema> = ({ url }) => {
    insertEmbed({ url: compressToEncodedURIComponent(url) });
    setOpen(false);
  };

  const [element] = use_modal(
    trigger,
    <Form<EmbedSchema>
      className={clsx("flex-col")}
      on_submit={handleSubmit}
      provider_props={form}
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
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
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
            width: is_smaller_than_mobile ? "100%" : "420px"
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
