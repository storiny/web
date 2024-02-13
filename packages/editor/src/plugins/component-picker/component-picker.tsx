"use client";

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND
} from "@lexical/list";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch as use_basic_typeahead_trigger_match
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $setBlocksType as $set_blocks_type } from "@lexical/selection";
import { $insertNodeToNearestRoot as $insert_node_to_nearest_root } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $createParagraphNode as $create_paragraph_node,
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
  LexicalNode
} from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import ScrollArea from "~/components/scroll-area";
import Separator from "~/components/separator";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import AlignCenterIcon from "~/icons/align-center";
import AlignJustifyIcon from "~/icons/align-justify";
import AlignLeftIcon from "~/icons/align-left";
import AlignRightIcon from "~/icons/align-right";
import BulletedListIcon from "~/icons/bulleted-list";
import CodeBlockIcon from "~/icons/code-block";
import HeadingIcon from "~/icons/heading";
import HorizontalRuleIcon from "~/icons/horizontal-rule";
import NumberedListIcon from "~/icons/numbered-list";
import ParagraphIcon from "~/icons/paragraph";
import QuoteIcon from "~/icons/quote";
import SubheadingIcon from "~/icons/subheading";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import { $create_code_block_node } from "../../nodes/code-block";
import { $create_heading_node } from "../../nodes/heading";
import { $create_quote_node } from "../../nodes/quote";
import styles from "./component-picker.module.scss";

class ComponentPickerOption extends MenuOption {
  /**
   * Ctor
   * @param title The title of the option
   * @param options The options for the item
   */
  constructor(
    title: string,
    options: {
      append_divider?: boolean;
      icon: React.ReactNode;
      keywords?: Array<string>;
      on_select?: (query_string: string) => void;
      render?: (component: React.ReactElement) => React.ReactElement;
    }
  ) {
    super(title);

    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.append_divider = Boolean(options.append_divider);
    this.render = (
      options.render || ((component): React.ReactElement => component)
    ).bind(this);
    this.on_select = (options.on_select || ((query): string => query)).bind(
      this
    );
  }

  /**
   * Custom render callback.
   */
  public render: (component: React.ReactElement) => React.ReactElement;
  /**
   * The title of the item
   */
  public title: string;
  /**
   * The icon for the option
   */
  public icon: React.ReactNode;
  /**
   * Keywords for the item. Used for searching.
   */
  public keywords: Array<string>;
  /**
   * Option select callback.
   */
  public on_select: (query_string: string) => void;
  /**
   * If `true`, insert a divider before this option.
   */
  public append_divider: boolean;
}

// Menu item

const ComponentPickerMenuItem = ({
  index,
  is_selected,
  on_click,
  on_mouse_enter,
  option
}: {
  index: number;
  is_selected: boolean;
  on_click: () => void;
  on_mouse_enter: () => void;
  option: ComponentPickerOption;
}): React.ReactElement => (
  <div
    aria-selected={is_selected}
    className={clsx(styles.option, is_selected && styles.selected)}
    id={"typeahead-item-" + index}
    key={option.key}
    onClick={on_click}
    onMouseEnter={on_mouse_enter}
    ref={option.setRefElement}
    role="option"
    tabIndex={-1}
  >
    <span
      aria-hidden={"true"}
      className={clsx(css["flex-center"], styles.icon)}
    >
      {option.icon}
    </span>
    <Typography className={styles.text} ellipsis level={"body2"}>
      {option.title}
    </Typography>
  </div>
);

/**
 * Returns the typeahead mentions
 * @param editor The lexical editor instance.
 */
const get_base_options = (editor: LexicalEditor): ComponentPickerOption[] => [
  new ComponentPickerOption("Heading", {
    icon: <HeadingIcon />,
    keywords: ["heading", "header", "h1"],
    on_select: (): void =>
      editor.update(() => {
        const selection = $get_selection();
        if ($is_range_selection(selection)) {
          $set_blocks_type(selection, () => $create_heading_node("h2"));
        }
      })
  }),
  new ComponentPickerOption("Subheading", {
    icon: <SubheadingIcon />,
    keywords: ["subheading", "subheader", "h2", "h3", "h4", "h5", "h6"],
    on_select: (): void =>
      editor.update(() => {
        const selection = $get_selection();
        if ($is_range_selection(selection)) {
          $set_blocks_type(selection, () => $create_heading_node("h3"));
        }
      })
  }),
  new ComponentPickerOption("Paragraph", {
    icon: <ParagraphIcon />,
    keywords: ["normal", "paragraph", "p", "text"],
    on_select: (): void =>
      editor.update(() => {
        const selection = $get_selection();
        if ($is_range_selection(selection)) {
          $set_blocks_type(selection, () => $create_paragraph_node());
        }
      })
  }),
  new ComponentPickerOption("Numbered List", {
    icon: <NumberedListIcon />,
    keywords: ["numbered list", "ordered list", "ol"],
    on_select: (): void => {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  }),
  new ComponentPickerOption("Bulleted List", {
    icon: <BulletedListIcon />,
    keywords: ["bulleted list", "unordered list", "ul"],
    on_select: (): void => {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  }),
  new ComponentPickerOption("Align left", {
    icon: <AlignLeftIcon />,
    keywords: ["align", "left"],
    append_divider: true,
    on_select: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
  }),
  new ComponentPickerOption("Align center", {
    icon: <AlignCenterIcon />,
    keywords: ["align", "center"],
    on_select: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
  }),
  new ComponentPickerOption("Align right", {
    icon: <AlignRightIcon />,
    keywords: ["align", "right"],
    on_select: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
  }),
  new ComponentPickerOption("Align justify", {
    icon: <AlignJustifyIcon />,
    keywords: ["align", "justify"],
    on_select: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
  }),
  new ComponentPickerOption("Quote", {
    icon: <QuoteIcon />,
    append_divider: true,
    keywords: ["quote", "blockquote"],
    on_select: (): void =>
      editor.update(() => {
        const selection = $get_selection();
        if ($is_range_selection(selection)) {
          $set_blocks_type(selection, $create_quote_node);
        }
      })
  }),
  new ComponentPickerOption("Horizontal rule", {
    icon: <HorizontalRuleIcon />,
    keywords: ["horizontal rule", "divider", "hr"],
    on_select: (): void => {
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    }
  }),
  new ComponentPickerOption("Code block", {
    icon: <CodeBlockIcon />,
    keywords: ["code", "codeblock"],
    on_select: (): void =>
      editor.update(() => {
        const code_block_node = $create_code_block_node({});
        $insert_node_to_nearest_root(code_block_node).insertAfter(
          $create_paragraph_node()
        );
      })
  })
];

const ComponentPickerPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const [query_string, set_query_string] = React.useState<string | null>(null);
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));

  const check_for_trigger_match = use_basic_typeahead_trigger_match("/", {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    minLength: 0
  });

  const options = React.useMemo(() => {
    const base_options = get_base_options(editor);

    if (!query_string) {
      return base_options;
    }

    const regex = new RegExp(query_string, "i");

    return base_options.filter(
      (option) =>
        regex.test(option.title) ||
        option.keywords.some((keyword) => regex.test(keyword))
    );
  }, [editor, query_string]);

  const on_select_option = React.useCallback(
    (
      selected_option: ComponentPickerOption,
      node_to_remove: LexicalNode | null,
      close_menu: () => void,
      matching_string: string
    ) => {
      editor.update(() => {
        node_to_remove?.remove();
        selected_option.on_select(matching_string);
        close_menu();
      });
    },
    [editor]
  );

  if (is_smaller_than_mobile) {
    return null;
  }

  return (
    <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
      menuRenderFn={(
        anchor_element_ref,
        {
          selectedIndex: selected_index,
          selectOptionAndCleanUp: select_option_and_clean_up,
          setHighlightedIndex: set_highlighted_index
        }
      ): React.ReactPortal | null =>
        anchor_element_ref.current && options.length
          ? create_portal(
              <ScrollArea
                className={clsx(styles.x, styles["scroll-area"])}
                slot_props={{
                  viewport: {
                    className: clsx(styles.x, styles.viewport)
                  },
                  scrollbar: { style: { background: "none" } }
                }}
                type={"hover"}
              >
                {options.map((option, i: number) => (
                  <React.Fragment key={option.key}>
                    {option.append_divider && i !== 0 ? (
                      <Separator className={clsx(styles.x, styles.separator)} />
                    ) : null}
                    <ComponentPickerMenuItem
                      index={i}
                      is_selected={selected_index === i}
                      on_click={(): void => {
                        set_highlighted_index(i);
                        select_option_and_clean_up(option);
                      }}
                      on_mouse_enter={(): void => {
                        set_highlighted_index(i);
                      }}
                      option={option}
                    />
                  </React.Fragment>
                ))}
              </ScrollArea>,
              anchor_element_ref.current
            )
          : null
      }
      onQueryChange={set_query_string}
      onSelectOption={on_select_option}
      options={options}
      triggerFn={check_for_trigger_match}
    />
  );
};

export default ComponentPickerPlugin;
