import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch as use_basic_typeahead_trigger_match
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { LexicalNode } from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import Typography from "~/components/typography";
import Persona from "~/entities/persona";

import { $create_mention_node } from "../../nodes/mention";
import styles from "./mention.module.scss";

const PUNCTUATION =
  "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ["@"].join("");

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = "[^" + TRIGGERS + PUNC + "\\s]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  " |" + // E.g. " " in "Josh Duck"
  "[" +
  PUNC +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    VALID_JOINS +
    "){0," +
    LENGTH_LIMIT +
    "})" +
    ")$"
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()(" +
    "[" +
    TRIGGERS +
    "]" +
    "((?:" +
    VALID_CHARS +
    "){0," +
    ALIAS_LENGTH_LIMIT +
    "})" +
    ")$"
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

const mentions_cache = new Map();

const dummy_mentions_data = [
  "Aayla Secura",
  "Adi Gallia",
  "Admiral Dodd Rancit",
  "Admiral Firmus Piett",
  "Admiral Gial Ackbar",
  "Admiral Ozzel",
  "Admiral Raddus",
  "Admiral Terrinald Screed",
  "Admiral Trench",
  "Admiral U.O. Statura",
  "Agen Kolar",
  "Agent Kallus",
  "Aiolin and Morit Astarte",
  "Aks Moe",
  "Almec",
  "Alton Kastle",
  "Amee",
  "AP-5",
  "Armitage Hux",
  "Artoo",
  "Arvel Crynyd",
  "Asajj Ventress",
  "Aurra Sing",
  "AZI-3",
  "Bala-Tik",
  "Barada",
  "Bargwill Tomder",
  "Baron Papanoida",
  "Barriss Offee",
  "Baze Malbus",
  "Bazine Netal",
  "BB-8",
  "BB-9E",
  "Ben Quadinaros",
  "Berch Teller",
  "Beru Lars",
  "Bib Fortuna",
  "Biggs Darklighter",
  "Black Krrsantan",
  "Bo-Katan Kryze",
  "Boba Fett",
  "Bobbajo",
  "Bodhi Rook",
  "Borvo the Hutt",
  "Boss Nass",
  "Bossk",
  "Breha Antilles-Organa",
  "Bren Derlin",
  "Brendol Hux",
  "BT-1",
  "C-3PO",
  "C1-10P",
  "Cad Bane",
  "Caluan Ematt",
  "Captain Gregor",
  "Captain Phasma",
  "Captain Quarsh Panaka",
  "Captain Rex",
  "Carlist Rieekan",
  "Casca Panzoro",
  "Cassian Andor",
  "Cassio Tagge",
  "Cham Syndulla",
  "Che Amanwe Papanoida",
  "Chewbacca",
  "Chi Eekway Papanoida",
  "Chief Chirpa",
  "Chirrut Îmwe",
  "Ciena Ree",
  "Cin Drallig",
  "Clegg Holdfast",
  "Cliegg Lars",
  "Coleman Kcaj",
  "Coleman Trebor",
  "Colonel Kaplan",
  "Commander Bly",
  "Commander Cody (CC-2224)",
  "Commander Fil (CC-3714)",
  "Commander Fox",
  "Commander Gree",
  "Commander Jet",
  "Commander Wolffe",
  "Conan Antonio Motti",
  "Conder Kyl",
  "Constable Zuvio",
  "Cordé",
  "Cpatain Typho",
  "Crix Madine",
  "Cut Lawquane",
  "Dak Ralter",
  "Dapp",
  "Darth Bane",
  "Darth Maul",
  "Darth Tyranus",
  "Daultay Dofine",
  "Del Meeko",
  "Delian Mors",
  "Dengar",
  "Depa Billaba",
  "Derek Klivian",
  "Dexter Jettster",
  "Dineé Ellberger",
  "DJ",
  "Doctor Aphra",
  "Doctor Evazan",
  "Dogma",
  "Dormé",
  "Dr. Cylo",
  "Droidbait",
  "Droopy McCool",
  "Dryden Vos",
  "Dud Bolt",
  "Ebe E. Endocott",
  "Echuu Shen-Jon",
  "Eeth Koth",
  "Eighth Brother",
  "Eirtaé",
  "Eli Vanto",
  "Ellé",
  "Ello Asty",
  "Embo",
  "Eneb Ray",
  "Enfys Nest",
  "EV-9D9",
  "Evaan Verlaine",
  "Even Piell",
  "Ezra Bridger",
  "Faro Argyus",
  "Feral",
  "Fifth Brother",
  "Finis Valorum",
  "Finn",
  "Fives",
  "FN-1824",
  "FN-2003",
  "Fodesinbeed Annodue",
  "Fulcrum",
  "FX-7",
  "GA-97",
  "Galen Erso",
  "Gallius Rax",
  'Garazeb "Zeb" Orrelios',
  "Gardulla the Hutt",
  "Garrick Versio",
  "Garven Dreis",
  "Gavyn Sykes",
  "Gideon Hask",
  "Gizor Dellso",
  "Gonk droid",
  "Grand Inquisitor",
  "Greeata Jendowanian",
  "Greedo",
  "Greer Sonnel",
  "Grievous",
  "Grummgar",
  "Gungi",
  "Hammerhead",
  "Han Solo",
  "Harter Kalonia",
  "Has Obbit",
  "Hera Syndulla",
  "Hevy",
  "Hondo Ohnaka",
  "Huyang",
  "Iden Versio",
  "IG-88",
  "Ima-Gun Di",
  "Inquisitors",
  "Inspector Thanoth",
  "Jabba",
  "Jacen Syndulla",
  "Jan Dodonna",
  "Jango Fett",
  "Janus Greejatus",
  "Jar Jar Binks",
  "Jas Emari",
  "Jaxxon",
  "Jek Tono Porkins",
  "Jeremoch Colton",
  "Jira",
  "Jobal Naberrie",
  "Jocasta Nu",
  "Joclad Danva",
  "Joh Yowza",
  "Jom Barell",
  "Joph Seastriker",
  "Jova Tarkin",
  "Jubnuk",
  "Jyn Erso",
  "K-2SO",
  "Kanan Jarrus",
  "Karbin",
  "Karina the Great",
  "Kes Dameron",
  "Ketsu Onyo",
  "Ki-Adi-Mundi",
  "King Katuunko",
  "Kit Fisto",
  "Kitster Banai",
  "Klaatu",
  "Klik-Klak",
  "Korr Sella",
  "Kylo Ren",
  "L3-37",
  "Lama Su",
  "Lando Calrissian",
  "Lanever Villecham",
  "Leia Organa",
  "Letta Turmond",
  "Lieutenant Kaydel Ko Connix",
  "Lieutenant Thire",
  "Lobot",
  "Logray",
  "Lok Durd",
  "Longo Two-Guns",
  "Lor San Tekka",
  "Lorth Needa",
  "Lott Dod",
  "Luke Skywalker",
  "Lumat",
  "Luminara Unduli",
  "Lux Bonteri",
  "Lyn Me",
  "Lyra Erso",
  "Mace Windu",
  "Malakili",
  "Mama the Hutt",
  "Mars Guo",
  "Mas Amedda",
  "Mawhonic",
  "Max Rebo",
  "Maximilian Veers",
  "Maz Kanata",
  "ME-8D9",
  "Meena Tills",
  "Mercurial Swift",
  "Mina Bonteri",
  "Miraj Scintel",
  "Mister Bones",
  "Mod Terrik",
  "Moden Canady",
  "Mon Mothma",
  "Moradmin Bast",
  "Moralo Eval",
  "Morley",
  "Mother Talzin",
  "Nahdar Vebb",
  "Nahdonnis Praji",
  "Nien Nunb",
  "Niima the Hutt",
  "Nines",
  "Norra Wexley",
  "Nute Gunray",
  "Nuvo Vindi",
  "Obi-Wan Kenobi",
  "Odd Ball",
  "Ody Mandrell",
  "Omi",
  "Onaconda Farr",
  "Oola",
  "OOM-9",
  "Oppo Rancisis",
  "Orn Free Taa",
  "Oro Dassyne",
  "Orrimarko",
  "Osi Sobeck",
  "Owen Lars",
  "Pablo-Jill",
  "Padmé Amidala",
  "Pagetti Rook",
  "Paige Tico",
  "Paploo",
  "Petty Officer Thanisson",
  "Pharl McQuarrie",
  "Plo Koon",
  "Po Nudo",
  "Poe Dameron",
  "Poggle the Lesser",
  "Pong Krell",
  "Pooja Naberrie",
  "PZ-4CO",
  "Quarrie",
  "Quay Tolsite",
  "Queen Apailana",
  "Queen Jamillia",
  "Queen Neeyutnee",
  "Qui-Gon Jinn",
  "Quiggold",
  "Quinlan Vos",
  "R2-D2",
  "R2-KT",
  "R3-S6",
  "R4-P17",
  "R5-D4",
  "RA-7",
  "Rabé",
  "Rako Hardeen",
  "Ransolm Casterfo",
  "Rappertunie",
  "Ratts Tyerell",
  "Raymus Antilles",
  "Ree-Yees",
  "Reeve Panzoro",
  "Rey",
  "Ric Olié",
  "Riff Tamson",
  "Riley",
  "Rinnriyin Di",
  "Rio Durant",
  "Rogue Squadron",
  "Romba",
  "Roos Tarpals",
  "Rose Tico",
  "Rotta the Hutt",
  "Rukh",
  "Rune Haako",
  "Rush Clovis",
  "Ruwee Naberrie",
  "Ryoo Naberrie",
  "Sabé",
  "Sabine Wren",
  "Saché",
  "Saelt-Marae",
  "Saesee Tiin",
  "Salacious B. Crumb",
  "San Hill",
  "Sana Starros",
  "Sarco Plank",
  "Sarkli",
  "Satine Kryze",
  "Savage Opress",
  "Sebulba",
  "Senator Organa",
  "Sergeant Kreel",
  "Seventh Sister",
  "Shaak Ti",
  "Shara Bey",
  "Shmi Skywalker",
  "Shu Mai",
  "Sidon Ithano",
  "Sifo-Dyas",
  "Sim Aloo",
  "Siniir Rath Velus",
  "Sio Bibble",
  "Sixth Brother",
  "Slowen Lo",
  "Sly Moore",
  "Snaggletooth",
  "Snap Wexley",
  "Snoke",
  "Sola Naberrie",
  "Sora Bulq",
  "Strono Tuggs",
  "Sy Snootles",
  "Tallissan Lintra",
  "Tarfful",
  "Tasu Leech",
  "Taun We",
  "TC-14",
  "Tee Watt Kaa",
  "Teebo",
  "Teedo",
  "Teemto Pagalies",
  "Temiri Blagg",
  "Tessek",
  "Tey How",
  "Thane Kyrell",
  "The Bendu",
  "The Smuggler",
  "Thrawn",
  "Tiaan Jerjerrod",
  "Tion Medon",
  "Tobias Beckett",
  "Tulon Voidgazer",
  "Tup",
  "U9-C4",
  "Unkar Plutt",
  "Val Beckett",
  "Vanden Willard",
  "Vice Admiral Amilyn Holdo",
  "Vober Dand",
  "WAC-47",
  "Wag Too",
  "Wald",
  "Walrus Man",
  "Warok",
  "Wat Tambor",
  "Watto",
  "Wedge Antilles",
  "Wes Janson",
  "Wicket W. Warrick",
  "Wilhuff Tarkin",
  "Wollivan",
  "Wuher",
  "Wullf Yularen",
  "Xamuel Lennox",
  "Yaddle",
  "Yarael Poof",
  "Yoda",
  "Zam Wesell",
  "Zev Senesca",
  "Ziro the Hutt",
  "Zuckuss"
];

const dummy_lookup_service = {
  search: (
    string: string,
    callback: (results: Array<string>) => void
  ): void => {
    setTimeout(() => {
      const results = dummy_mentions_data.filter((mention) =>
        mention.toLowerCase().includes(string.toLowerCase())
      );
      callback(results);
    }, 500);
  }
};

const use_mention_lookup_service = (
  mention_string: string | null
): string[] => {
  const [results, set_results] = React.useState<Array<string>>([]);

  React.useEffect(() => {
    const cached_results = mentions_cache.get(mention_string);

    if (mention_string == null) {
      set_results([]);
      return;
    }

    if (cached_results === null) {
      return;
    } else if (cached_results !== undefined) {
      set_results(cached_results);
      return;
    }

    mentions_cache.set(mention_string, null);
    dummy_lookup_service.search(mention_string, (new_results) => {
      mentions_cache.set(mention_string, new_results);
      set_results(new_results);
    });
  }, [mention_string]);

  return results;
};

const check_for_at_sign_mentions = (
  text: string,
  min_match_length: number
): MenuTextMatch | null => {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }

  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybe_leading_whitespace = match[1];

    const matching_string = match[3];
    if (matching_string.length >= min_match_length) {
      return {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        leadOffset: match.index + maybe_leading_whitespace.length,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        matchingString: matching_string,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        replaceableString: match[2]
      };
    }
  }

  return null;
};

const get_possible_query_match = (text: string): MenuTextMatch | null =>
  check_for_at_sign_mentions(text, 1);

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
  <Persona
    aria-selected={is_selected}
    avatar={{
      alt: "",
      label: option.name,
      avatar_id: option.avatar_id,
      hex: option.avatar_hex
    }}
    id={"typeahead-item-" + index}
    key={option.key}
    onClick={on_click}
    onMouseEnter={on_mouse_enter}
    primary_text={option.name}
    ref={option.setRefElement}
    role={"option"}
    secondary_text={`@${option.username}`}
    tabIndex={-1}
  />
);

const MentionPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const [query_string, set_query_string] = React.useState<string | null>(null);
  const results = use_mention_lookup_service(query_string);

  const check_for_slash_trigger_match = use_basic_typeahead_trigger_match("/", {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    minLength: 0
  });

  const options = React.useMemo(
    () =>
      results
        .map(
          (result) =>
            new MentionTypeaheadOption({
              username: result,
              name: result,
              avatar_hex: null,
              avatar_id: null
            })
        )
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );

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

  const check_for_mention_match = React.useCallback(
    (text: string) => {
      const slash_match = check_for_slash_trigger_match(text, editor);

      if (slash_match !== null) {
        return null;
      }

      return get_possible_query_match(text);
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
