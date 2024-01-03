/* eslint-disable no-case-declarations */

import {
  LanguageSupport,
  StreamLanguage,
  StreamParser
} from "@codemirror/language";

import { CODE_BLOCK_LANGUAGE_MAP } from "./map";

/**
 * Handles legacy language mode
 * @param language Legacy language
 */
const handle_legacy_mode = async (
  language: keyof typeof CODE_BLOCK_LANGUAGE_MAP
): Promise<LanguageSupport | null> => {
  let legacy_language: StreamParser<unknown> | null = null;

  switch (language) {
    case "csharp":
    case "dart":
    case "kotlin":
    case "objective_c":
    case "objective_cpp":
    case "scala":
      legacy_language = (await import("@codemirror/legacy-modes/mode/clike"))[
        language === "objective_c"
          ? "objectiveC"
          : language === "objective_cpp"
            ? "objectiveCpp"
            : language
      ];
      break;
    //
    case "clojure":
    case "clojurescript":
      legacy_language = (await import("@codemirror/legacy-modes/mode/clojure"))
        .clojure;
      break;
    //
    case "cmake":
      legacy_language = (await import("@codemirror/legacy-modes/mode/cmake"))
        .cmake;
      break;
    //
    case "cobol":
      legacy_language = (await import("@codemirror/legacy-modes/mode/cobol"))
        .cobol;
      break;
    //
    case "coffeescript":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/coffeescript")
      ).coffeeScript;
      break;
    //
    case "common_lisp":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/commonlisp")
      ).commonLisp;
      break;
    //
    case "crystal":
      legacy_language = (await import("@codemirror/legacy-modes/mode/crystal"))
        .crystal;
      break;
    //
    case "d":
      legacy_language = (await import("@codemirror/legacy-modes/mode/d")).d;
      break;
    //
    case "diff":
      legacy_language = (await import("@codemirror/legacy-modes/mode/diff"))
        .diff;
      break;
    //
    case "dockerfile":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/dockerfile")
      ).dockerFile;
      break;
    //
    case "elm":
      legacy_language = (await import("@codemirror/legacy-modes/mode/elm")).elm;
      break;
    //
    case "erlang":
      legacy_language = (await import("@codemirror/legacy-modes/mode/erlang"))
        .erlang;
      break;
    //
    case "fortran":
      legacy_language = (await import("@codemirror/legacy-modes/mode/fortran"))
        .fortran;
      break;
    //
    case "f_sharp":
      legacy_language = (await import("@codemirror/legacy-modes/mode/mllike"))
        .fSharp;
      break;
    //
    case "go":
      legacy_language = (await import("@codemirror/legacy-modes/mode/go")).go;
      break;
    //
    case "groovy":
      legacy_language = (await import("@codemirror/legacy-modes/mode/groovy"))
        .groovy;
      break;
    //
    case "haskell":
      legacy_language = (await import("@codemirror/legacy-modes/mode/haskell"))
        .haskell;
      break;
    //
    case "haxe":
      legacy_language = (await import("@codemirror/legacy-modes/mode/haxe"))
        .haxe;
      break;
    //
    case "http":
      legacy_language = (await import("@codemirror/legacy-modes/mode/http"))
        .http;
      break;
    //
    case "jsonld":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/javascript")
      ).jsonld;
      break;
    //
    case "julia":
      legacy_language = (await import("@codemirror/legacy-modes/mode/julia"))
        .julia;
      break;
    //
    case "less":
      legacy_language = (await import("@codemirror/legacy-modes/mode/css"))
        .less;
      break;
    //
    case "livescript":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/livescript")
      ).liveScript;
      break;
    //
    case "lua":
      legacy_language = (await import("@codemirror/legacy-modes/mode/lua")).lua;
      break;
    //
    case "mathematica":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/mathematica")
      ).mathematica;
      break;
    //
    case "nginx":
      legacy_language = (await import("@codemirror/legacy-modes/mode/nginx"))
        .nginx;
      break;
    //
    case "o_caml":
      legacy_language = (await import("@codemirror/legacy-modes/mode/mllike"))
        .oCaml;
      break;
    //
    case "octave":
      legacy_language = (await import("@codemirror/legacy-modes/mode/octave"))
        .octave;
      break;
    //
    case "pascal":
      legacy_language = (await import("@codemirror/legacy-modes/mode/pascal"))
        .pascal;
      break;
    //
    case "perl":
      legacy_language = (await import("@codemirror/legacy-modes/mode/perl"))
        .perl;
      break;
    //
    case "power_shell":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/powershell")
      ).powerShell;
      break;
    //
    case "protobuf":
      legacy_language = (await import("@codemirror/legacy-modes/mode/protobuf"))
        .protobuf;
      break;
    //
    case "puppet":
      legacy_language = (await import("@codemirror/legacy-modes/mode/puppet"))
        .puppet;
      break;
    //
    case "q":
      legacy_language = (await import("@codemirror/legacy-modes/mode/q")).q;
      break;
    //
    case "r":
      legacy_language = (await import("@codemirror/legacy-modes/mode/r")).r;
      break;
    //
    case "ruby":
      legacy_language = (await import("@codemirror/legacy-modes/mode/ruby"))
        .ruby;
      break;
    //
    case "sass":
      legacy_language = (await import("@codemirror/legacy-modes/mode/sass"))
        .sass;
      break;
    //
    case "scheme":
      legacy_language = (await import("@codemirror/legacy-modes/mode/scheme"))
        .scheme;
      break;
    //
    case "scss":
      legacy_language = (await import("@codemirror/legacy-modes/mode/css"))
        .sCSS;
      break;
    //
    case "shell":
      legacy_language = (await import("@codemirror/legacy-modes/mode/shell"))
        .shell;
      break;
    //
    case "smalltalk":
      legacy_language = (
        await import("@codemirror/legacy-modes/mode/smalltalk")
      ).smalltalk;
      break;
    //
    case "solr":
      legacy_language = (await import("@codemirror/legacy-modes/mode/solr"))
        .solr;
      break;
    //
    case "sml":
      legacy_language = (await import("@codemirror/legacy-modes/mode/mllike"))
        .sml;
      break;
    //
    case "stylus":
      legacy_language = (await import("@codemirror/legacy-modes/mode/stylus"))
        .stylus;
      break;
    //
    case "swift":
      legacy_language = (await import("@codemirror/legacy-modes/mode/swift"))
        .swift;
      break;
    //
    case "stex":
      legacy_language = (await import("@codemirror/legacy-modes/mode/stex"))
        .stex;
      break;
    //
    case "tcl":
      legacy_language = (await import("@codemirror/legacy-modes/mode/tcl")).tcl;
      break;
    //
    case "toml":
      legacy_language = (await import("@codemirror/legacy-modes/mode/toml"))
        .toml;
      break;
    //
    case "velocity":
      legacy_language = (await import("@codemirror/legacy-modes/mode/velocity"))
        .velocity;
      break;
    //
    case "verilog":
      legacy_language = (await import("@codemirror/legacy-modes/mode/verilog"))
        .verilog;
      break;
    //
    case "yaml":
      legacy_language = (await import("@codemirror/legacy-modes/mode/yaml"))
        .yaml;
      break;
  }

  if (legacy_language !== null) {
    return new LanguageSupport(StreamLanguage.define(legacy_language));
  }

  return legacy_language;
};

/**
 * Returns the language support dynamically for the specified language mode.
 * If the language mode is not supported, `null` is returned.
 * @param language The language mode
 */
export const get_language_support = async (
  language: keyof typeof CODE_BLOCK_LANGUAGE_MAP
): Promise<LanguageSupport | null> => {
  switch (language) {
    case "javascript":
    case "typescript":
    case "jsx":
    case "tsx":
      return (await import("@codemirror/lang-javascript")).javascript({
        jsx: ["jsx", "tsx"].includes(language),
        typescript: ["typescript", "tsx"].includes(language)
      });
    //
    case "html":
      return (await import("@codemirror/lang-html")).html({
        /* eslint-disable prefer-snakecase/prefer-snakecase */
        autoCloseTags: true,
        matchClosingTags: true,
        selfClosingTags: false
        /* eslint-enable prefer-snakecase/prefer-snakecase */
      });
    //
    case "c":
    case "cpp":
      return (await import("@codemirror/lang-cpp")).cpp();
    //
    case "css":
      return (await import("@codemirror/lang-css")).css();
    //
    case "java":
      return (await import("@codemirror/lang-java")).java();
    //
    case "json":
      return (await import("@codemirror/lang-json")).json();
    //
    case "markdown":
      return (await import("@codemirror/lang-markdown")).markdown();
    //
    case "php":
      return (await import("@codemirror/lang-php")).php();
    //
    case "python":
      return (await import("@codemirror/lang-python")).python();
    //
    case "rust":
      return (await import("@codemirror/lang-rust")).rust();
    //
    case "sql":
    case "mysql":
    case "mariasql":
    case "postgresql":
    case "cassandra":
    case "mssql":
    case "plsql":
    case "sqlite":
      const {
        sql,
        MySQL,
        MariaSQL,
        PostgreSQL,
        Cassandra,
        MSSQL,
        StandardSQL,
        PLSQL,
        SQLite
      } = await import("@codemirror/lang-sql");

      let dialect = StandardSQL;

      switch (language) {
        case "cassandra":
          dialect = Cassandra;
          break;
        case "mariasql":
          dialect = MariaSQL;
          break;
        case "mssql":
          dialect = MSSQL;
          break;
        case "postgresql":
          dialect = PostgreSQL;
          break;
        case "mysql":
          dialect = MySQL;
          break;
        case "sqlite":
          dialect = SQLite;
          break;
        case "plsql":
          dialect = PLSQL;
          break;
      }

      return sql({
        dialect,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        upperCaseKeywords: true
      });
    //
    case "wast":
      return (await import("@codemirror/lang-wast")).wast();
    //
    case "xml":
      return (await import("@codemirror/lang-xml")).xml();
    //
    default:
      return handle_legacy_mode(language);
  }
};
