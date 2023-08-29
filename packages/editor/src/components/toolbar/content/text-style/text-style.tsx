import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuCheckboxItem from "~/components/MenuCheckboxItem";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Spacer from "~/components/Spacer";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import BoldIcon from "~/icons/Bold";
import CodeIcon from "~/icons/Code";
import DotsIcon from "~/icons/Dots";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import StrikethroughIcon from "~/icons/Strikethrough";
import SubscriptIcon from "~/icons/Subscript";
import SuperscriptIcon from "~/icons/Superscript";
import UnderlineIcon from "~/icons/Underline";
import { breakpoints } from "~/theme/breakpoints";

import { documentLoadingAtom } from "../../../../atoms";
import {
  TextStyle as TextStyleEnum,
  textStyleToIconMap,
  textStyleToLabelMap
} from "../../../../constants";
import { useBold } from "../../../../hooks/use-bold";
import { useCode } from "../../../../hooks/use-code";
import { useItalic } from "../../../../hooks/use-italic";
import { useLink } from "../../../../hooks/use-link";
import { useStrikethrough } from "../../../../hooks/use-strikethrough";
import { useSubscript } from "../../../../hooks/use-subscript";
import { useSuperscript } from "../../../../hooks/use-superscript";
import { useTextStyle } from "../../../../hooks/use-text-style";
import { useUnderline } from "../../../../hooks/use-underline";
import toolbarStyles from "../../toolbar.module.scss";
import styles from "./text-style.module.scss";

// Option

const TextStyleOption = ({
  value
}: {
  value: TextStyleEnum;
}): React.ReactElement => (
  <Option decorator={textStyleToIconMap[value]} value={value}>
    {textStyleToLabelMap[value]}
  </Option>
);

// Text style group

const TextStyleGroup = (): React.ReactElement => {
  const documentLoading = useAtomValue(documentLoadingAtom);
  const [bold, toggleBold] = useBold();
  const [italic, toggleItalic] = useItalic();
  const [underline, toggleUnderline] = useUnderline();
  const [strikethrough, toggleStrikethrough] = useStrikethrough();
  const [subscript, toggleSubscript] = useSubscript();
  const [superscript, toggleSuperscript] = useSuperscript();
  const [code, toggleCode] = useCode();
  const [link, insertLink] = useLink();

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
      <ToggleGroup disabled={documentLoading} type={"multiple"} value={value}>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          onClick={toggleBold}
          size={"lg"}
          tooltipContent={"Bold"}
          value={"bold"}
        >
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          onClick={toggleItalic}
          size={"lg"}
          tooltipContent={"Italic"}
          value={"italic"}
        >
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          onClick={toggleUnderline}
          size={"lg"}
          tooltipContent={"Underline"}
          value={"underline"}
        >
          <UnderlineIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          onClick={insertLink}
          size={"lg"}
          tooltipContent={"Link"}
          value={"link"}
        >
          <LinkIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <Menu
        slotProps={{
          content: {
            side: "top"
          }
        }}
        trigger={
          <IconButton
            aria-label={"More formatting options"}
            className={clsx(
              "focus-invert",
              toolbarStyles.x,
              toolbarStyles.button
            )}
            disabled={documentLoading}
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
          onClick={(): void => toggleCode()}
        >
          Code
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={strikethrough}
          decorator={<StrikethroughIcon />}
          onClick={(): void => toggleStrikethrough()}
        >
          Strikethrough
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={subscript}
          decorator={<SubscriptIcon />}
          onClick={(): void => toggleSubscript()}
        >
          Subscript
        </MenuCheckboxItem>
        <MenuCheckboxItem
          checked={superscript}
          decorator={<SuperscriptIcon />}
          onClick={(): void => toggleSuperscript()}
        >
          Superscript
        </MenuCheckboxItem>
      </Menu>
    </React.Fragment>
  );
};

// Text style select

const TextStyleSelect = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const documentLoading = useAtomValue(documentLoadingAtom);
  const {
    formatNumberedList,
    formatBulletedList,
    formatParagraph,
    textStyle,
    formatQuote,
    formatHeading
  } = useTextStyle();

  /**
   * Handles select value change
   * @param newValue New value
   */
  const handleValueChange = (newValue: TextStyleEnum): void => {
    switch (newValue) {
      case TextStyleEnum.BULLETED_LIST:
        formatBulletedList();
        break;
      case TextStyleEnum.NUMBERED_LIST:
        formatNumberedList();
        break;
      case TextStyleEnum.PARAGRAPH:
        formatParagraph();
        break;
      case TextStyleEnum.QUOTE:
        formatQuote();
        break;
      case TextStyleEnum.HEADING:
        formatHeading("h2");
        break;
      case TextStyleEnum.SUBHEADING:
        formatHeading("h3");
        break;
    }
  };

  return (
    <Select
      disabled={documentLoading}
      onValueChange={handleValueChange}
      size={"lg"}
      slotProps={{
        trigger: {
          "aria-label": "Text style",
          className: clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.select,
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
      value={textStyle}
      valueChildren={
        <span className={"flex-center"}>
          {textStyleToIconMap[textStyle]}
          {!isSmallerThanMobile && (
            <React.Fragment>
              <Spacer />
              {textStyleToLabelMap[textStyle]}
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
