import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import { compressToEncodedURIComponent as compress_to_encoded_uri_component } from "lz-string";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import Link from "~/components/link";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import EmbedIcon from "~/icons/embed";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { use_insert_embed } from "../../hooks/use-insert-embed";
import { EmbedModalProps } from "./embed-modal.props";
import { EMBED_SCHEMA, EmbedSchema } from "./schema";

const EmbedModalContent = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
        You can embed content from external sites directly inside your story. If
        embeds from your provided site are not supported, a website preview will
        be displayed instead.{" "}
        <Link
          href={SUPPORT_ARTICLE_MAP.EMBEDDING_THIRD_PARTY_CONTENT}
          target={"_blank"}
          underline={"always"}
        >
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
          className: css["f-grow"]
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
  const [open, set_open] = React.useState<boolean>(false);
  const [insert_embed] = use_insert_embed();
  const form = use_form<EmbedSchema>({
    resolver: zod_resolver(EMBED_SCHEMA),
    defaultValues: {
      url: ""
    }
  });

  const handle_submit: SubmitHandler<EmbedSchema> = ({ url }) => {
    insert_embed({ url: compress_to_encoded_uri_component(url) });
    set_open(false);
  };

  const [element] = use_modal(
    trigger,
    <Form<EmbedSchema>
      className={css["flex-col"]}
      on_submit={handle_submit}
      provider_props={form}
    >
      <EmbedModalContent />
    </Form>,
    {
      modal,
      open,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      onOpenChange: (next_open: boolean) => {
        form.reset();
        set_open(next_open);
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
