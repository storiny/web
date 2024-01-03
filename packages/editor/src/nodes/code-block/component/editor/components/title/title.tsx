import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey as $get_node_by_key } from "lexical";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import CodeBlockIcon from "~/icons/code-block";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { $is_code_block_node } from "../../../../code-block";
import {
  CODE_BLOCK_TITLE_MAX_LENGTH,
  CODE_BLOCK_TITLE_SCHEMA,
  CodeBlockTitleSchema
} from "./schema";
import styles from "./title.module.scss";
import { CodeBlockTitleProps } from "./title.props";

const CodeBlockTitleModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
        Set a title for the code block. This can represent the file name or an
        arbitrary text.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormInput
      autoComplete={"off"}
      autoFocus
      auto_size
      data-testid={"title-input"}
      form_slot_props={{
        form_item: {
          className: css["f-grow"]
        }
      }}
      label={"Title"}
      maxLength={CODE_BLOCK_TITLE_MAX_LENGTH}
      name={"title"}
      placeholder={"Title for the code block"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const EditableTitle = ({
  title,
  node_key
}: CodeBlockTitleProps): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<CodeBlockTitleSchema>({
    resolver: zod_resolver(CODE_BLOCK_TITLE_SCHEMA),
    defaultValues: {
      title
    }
  });

  const handle_submit: SubmitHandler<CodeBlockTitleSchema> = (values) => {
    editor.update(() => {
      const node = $get_node_by_key(node_key);

      if ($is_code_block_node(node)) {
        node.set_title(values.title || "");
      }
    });

    close_modal();
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) => (
      <Typography
        as={"button"}
        className={clsx(
          css["ellipsis"],
          styles.x,
          styles.title,
          Boolean(title) && styles["has-title"]
        )}
        onClick={open_modal}
        type={"button"}
      >
        {title || "Edit title"}
      </Typography>
    ),
    <Form<CodeBlockTitleSchema>
      className={css["flex-col"]}
      on_submit={handle_submit}
      provider_props={form}
    >
      <CodeBlockTitleModal />
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
            width: is_smaller_than_mobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <CodeBlockIcon />,
          children: "Set code block title"
        }
      }
    }
  );

  return element;
};

const ReadOnlyTitle = ({ title }: CodeBlockTitleProps): React.ReactElement => (
  <Typography
    className={clsx(
      css["ellipsis"],
      styles.x,
      styles.title,
      styles["read-only"],
      Boolean(title) && styles["has-title"]
    )}
  >
    {title || ""}
  </Typography>
);

const CodeBlockTitle = (props: CodeBlockTitleProps): React.ReactElement =>
  props.read_only ? <ReadOnlyTitle {...props} /> : <EditableTitle {...props} />;

export default CodeBlockTitle;
