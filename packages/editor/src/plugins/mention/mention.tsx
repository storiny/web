import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch as use_basic_typeahead_trigger_match
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { clsx } from "clsx";
import { LexicalNode } from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import Persona from "~/entities/persona";
import { use_debounce } from "~/hooks/use-debounce";
import {
  LookupUsernameResponse,
  use_lazy_lookup_username_query
} from "~/redux/features";

import { $create_mention_node } from "../../nodes/mention";
import styles from "./mention.module.scss";

const MENTION_REGEX = /(^|\s|\()(@([\w_]{3,24}))$/;

/**
 * Finds the matching users from the backend loopup service
 * @param mention_string The mention string
 */
const use_mention_lookup_service = (
  mention_string: string | null
): LookupUsernameResponse => {
  const [lookup, result] = use_lazy_lookup_username_query();
  const debounced_query = use_debounce(mention_string, 250);

  React.useEffect(() => {
    if (!debounced_query) {
      return;
    }

    lookup({ query: debounced_query }, true);
  }, [lookup, debounced_query]);

  return result?.data || [];
};

/**
 * Checks whether the text matches the mention regex.
 * @param text The input text
 */
const check_for_mentions = (text: string): MenuTextMatch | null => {
  const match = MENTION_REGEX.exec(text);

  if (match !== null) {
    // Add the length of leading whitespace to `leadOffset`.
    const maybe_leading_whitespace = match[1];
    const matching_string = match[3];

    if (matching_string.length) {
      return {
        leadOffset: match.index + maybe_leading_whitespace.length,
        matchingString: matching_string,
        replaceableString: match[2]
      };
    }
  }

  return null;
};

class MentionTypeaheadOption extends MenuOption {
  /**
   * Ctor
   * @param username The username of the user
   * @param name The name of the user
   * @param avatar_hex The avatar hex of the user
   * @param avatar_id The avatar ID of the user
   */
  constructor({
    username,
    name,
    avatar_hex,
    avatar_id
  }: {
    avatar_hex: string | null;
    avatar_id: string | null;
    name: string;
    username: string;
  }) {
    super(username);

    this.username = username;
    this.name = name;
    this.avatar_id = avatar_id;
    this.avatar_hex = avatar_hex;
  }

  /**
   * The username of the user
   */
  public username: string;
  /**
   * The name of the user
   */
  public name: string;
  /**
   * The avatar of the user
   */
  public avatar_id: string | null;
  /**
   * The avatar hex of the user
   */
  public avatar_hex: string | null;
}

// Mention item

const MentionsTypeaheadMenuItem = ({
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
  option: MentionTypeaheadOption;
}): React.ReactElement => (
  <li
    aria-selected={is_selected}
    className={clsx(styles.option, is_selected && styles.selected)}
    id={"typeahead-item-" + index}
    key={option.key}
    onClick={on_click}
    onMouseEnter={on_mouse_enter}
    ref={option.setRefElement}
    role={"option"}
    tabIndex={-1}
  >
    <Persona
      avatar={{
        alt: `${option.name}'s avatar`,
        label: option.name,
        avatar_id: option.avatar_id,
        hex: option.avatar_hex
      }}
      className={styles.persona}
      component_props={{
        secondary_text: { ellipsis: true, style: { width: "100%" } },
        primary_text: { ellipsis: true, style: { width: "100%" } }
      }}
      primary_text={option.name}
      secondary_text={`@${option.username}`}
    />
  </li>
);

const MentionPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const [query_string, set_query_string] = React.useState<string | null>(null);
  const results = use_mention_lookup_service(query_string);

  const check_for_slash_trigger_match = use_basic_typeahead_trigger_match("/", {
    minLength: 0
  });

  const options = React.useMemo(
    () =>
      results.map(
        (result) =>
          new MentionTypeaheadOption({
            username: result.username,
            name: result.name,
            avatar_hex: result.avatar_hex,
            avatar_id: result.avatar_id
          })
      ),
    [results]
  );

  /**
   * Option select handler
   */
  const on_select_option = React.useCallback(
    (
      selected_option: MentionTypeaheadOption,
      node_to_replace: LexicalNode | null,
      close_menu: () => void
    ) => {
      editor.update(() => {
        const mention_node = $create_mention_node(selected_option.username);

        if (node_to_replace) {
          node_to_replace.replace(mention_node);
        }

        mention_node.select();
        close_menu();
      });
    },
    [editor]
  );

  /**
   * Checks for matching text
   */
  const check_for_mention_match = React.useCallback(
    (text: string) => {
      const slash_match = check_for_slash_trigger_match(text, editor);

      if (slash_match !== null) {
        return null;
      }

      return check_for_mentions(text);
    },
    [check_for_slash_trigger_match, editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      menuRenderFn={(
        anchor_element_ref,
        {
          selectedIndex: selected_index,
          selectOptionAndCleanUp: select_option_and_clean_up,
          setHighlightedIndex: set_highlighted_index
        }
      ): React.ReactPortal | null =>
        anchor_element_ref.current && results.length
          ? create_portal(
              <ul className={styles.list}>
                {options.map((option, i: number) => (
                  <MentionsTypeaheadMenuItem
                    index={i}
                    is_selected={selected_index === i}
                    key={option.key}
                    on_click={(): void => {
                      set_highlighted_index(i);
                      select_option_and_clean_up(option);
                    }}
                    on_mouse_enter={(): void => {
                      set_highlighted_index(i);
                    }}
                    option={option}
                  />
                ))}
              </ul>,
              anchor_element_ref.current
            )
          : null
      }
      onQueryChange={set_query_string}
      onSelectOption={on_select_option}
      options={options}
      triggerFn={check_for_mention_match}
    />
  );
};

export default MentionPlugin;
