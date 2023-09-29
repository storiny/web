import { createCommand as create_command, LexicalCommand } from "lexical";

export type TextEntityPayload = string;

export const INSERT_TEXT_ENTITY_COMMAND: LexicalCommand<TextEntityPayload> =
  create_command("INSERT_TEXT_ENTITY_COMMAND");
