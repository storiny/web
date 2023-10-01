import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuCheckboxItem from "~/components/menu-checkbox-item";
import Option from "~/components/option";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import ToggleGroup from "~/components/toggle-group";
import ToggleGroupItem from "~/components/toggle-group-item";
import { use_media_query } from "~/hooks/use-media-query";
import BoldIcon from "~/icons/bold";
import CodeIcon from "~/icons/code";
import DotsIcon from "~/icons/dots";
import ItalicIcon from "~/icons/italic";
import LinkIcon from "~/icons/link";
import StrikethroughIcon from "~/icons/strikethrough";
import SubscriptIcon from "~/icons/subscript";
import SuperscriptIcon from "~/icons/superscript";
import UnderlineIcon from "~/icons/underline";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { doc_status_atom } from "../../../../atoms";
import {
  TEXT_STYLE_ICON_MAP,
  TEXT_STYLE_LABEL_MAP,
  TextStyle as TextStyleEnum
} from "../../../../constants";
import { use_bold } from "../../../../hooks/use-bold";
import { use_code } from "../../../../hooks/use-code";
import { use_italic } from "../../../../hooks/use-italic";
import { use_link } from "../../../../hooks/use-link";
import { use_strikethrough } from "../../../../hooks/use-strikethrough";
import { use_subscript } from "../../../../hooks/use-subscript";
import { use_superscript } from "../../../../hooks/use-superscript";
import { use_text_style } from "../../../../hooks/use-text-style";
import { use_underline } from "../../../../hooks/use-underline";
import toolbar_styles from "../../toolbar.module.scss";
import styles from "./text-style.module.scss";

// Option

const TextStyleOption = ({
  value
}: {
  value: TextStyleEnum;
}): React.ReactElement => (
  <Option decorator={TEXT_STYLE_ICON_MAP[value]} value={value}>
    {TEXT_STYLE_LABEL_MAP[value]}
  </Option>
);

// Text style group

const TextStyleGroup = (): React.ReactElement => {
  const doc_status = use_atom_value(doc_status_atom);
  const [bold, toggle_bold] = use_bold();
  const [italic, toggle_italic] = use_italic();
  const [underline, toggle_underline] = use_underline();
  const [strikethrough, toggle_strikethrough] = use_strikethrough();
  const [subscript, toggle_subscript] = use_subscript();
  const [superscript, toggle_superscript] = use_superscript();
  const [code, toggle_code] = use_code();
  const [link, insert_link] = use_link();
  const document_loading = ["connecting", "reconnecting"].includes(doc_status);

  const value = React.useMemo(
    () =>
      [
        bold && "bold",
        italic && "italic",
        underline && "underline",
        strikethrough && "strikethrough",
        subscript && "subscript",
        superscript && "superscript",
        code && "code",
        link && "link"
      ].filter((item) => typeof item === "string") as string[],
    [bold, code, italic, link, strikethrough, subscript, superscript, underline]
  );

  return (
    <React.Fragment>
      <ToggleGroup disabled={document_loading} type={"multiple"} value={value}>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.button
          )}
          onClick={toggle_bold}
          size={"lg"}
          tooltip_content={"Bold"}
          value={"bold"}
        >
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.button
          )}
          onClick={toggle_italic}
          size={"lg"}
          tooltip_content={"Italic"}
          value={"italic"}
        >
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.button
          )}
          onClick={toggle_underline}
          size={"lg"}
          tooltip_content={"Underline"}
          value={"underline"}
        >
          <UnderlineIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.button
          )}
          onClick={(): void => insert_link()}
          size={"lg"}
          tooltip_content={"Link"}
          value={"link"}
        >
          <LinkIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <Menu
        slot_props={{
          content: {
            side: "top"
          }
        }}
        trigger={
          <IconButton
            aria-label={"More formatting options"}
            className={clsx(
              "focus-invert",
              toolbar_styles.x,
              toolbar_styles.button
            )}
            disabled={document_loading}
            size={"lg"}
            title={"More formatting options"}
            variant={"ghost"}
          >
            <DotsIcon />
          </IconButton>
        }
      >
        <MenuCheckboxItem
          checked={code}
          decorator={<CodeIcon />}
          onClick={(): void => toggle_code()}
        >
          Code
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={strikethrough}
          decorator={<StrikethroughIcon />}
          onClick={(): void => toggle_strikethrough()}
        >
          Strikethrough
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={subscript}
          decorator={<SubscriptIcon />}
          onClick={(): void => toggle_subscript()}
        >
          Subscript
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={superscript}
          decorator={<SuperscriptIcon />}
          onClick={(): void => toggle_superscript()}
        >
          Superscript
        </MenuCheckboxItem>
      </Menu>
    </React.Fragment>
  );
};

// Text style select

const TextStyleSelect = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const doc_status = use_atom_value(doc_status_atom);
  const {
    format_numbered_list,
    format_bulleted_list,
    format_paragraph,
    text_style,
    format_quote,
    format_heading
  } = use_text_style();
  const document_loading = ["connecting", "reconnecting"].includes(doc_status);

  /**
   * Handles select value change
   * @param next_value New value
   */
  const handle_value_change = (next_value: TextStyleEnum): void => {
    switch (next_value) {
      case TextStyleEnum.BULLETED_LIST:
        format_bulleted_list();
        break;
      case TextStyleEnum.NUMBERED_LIST:
        format_numbered_list();
        break;
      case TextStyleEnum.PARAGRAPH:
        format_paragraph();
        break;
      case TextStyleEnum.QUOTE:
        format_quote();
        break;
      case TextStyleEnum.HEADING:
        format_heading("h2");
        break;
      case TextStyleEnum.SUBHEADING:
        format_heading("h3");
        break;
    }
  };

  return (
    <Select
      disabled={document_loading}
      onValueChange={handle_value_change}
      size={"lg"}
      slot_props={{
        trigger: {
          "aria-label": "Text style",
          className: clsx(
            "focus-invert",
            toolbar_styles.x,
            toolbar_styles.select,
            styles.x,
            styles.select
          )
        },
        value: {
          placeholder: "Text style"
        },
        content: {
          side: "top"
        }
      }}
      value={text_style}
      value_children={
        <span className={"flex-center"}>
          {TEXT_STYLE_ICON_MAP[text_style]}
          {!is_smaller_than_mobile && (
            <React.Fragment>
              <Spacer />
              {TEXT_STYLE_LABEL_MAP[text_style]}
            </React.Fragment>
          )}
        </span>
      }
    >
      <TextStyleOption value={TextStyleEnum.PARAGRAPH} />
      <TextStyleOption value={TextStyleEnum.HEADING} />
      <TextStyleOption value={TextStyleEnum.SUBHEADING} />
      <TextStyleOption value={TextStyleEnum.QUOTE} />
      <TextStyleOption value={TextStyleEnum.BULLETED_LIST} />
      <TextStyleOption value={TextStyleEnum.NUMBERED_LIST} />
    </Select>
  );
};

const ToolbarTextStyleItem = (): React.ReactElement => (
  <React.Fragment>
    <TextStyleSelect />
    <Divider orientation={"vertical"} />
    <TextStyleGroup />
  </React.Fragment>
);

export default ToolbarTextStyleItem;
