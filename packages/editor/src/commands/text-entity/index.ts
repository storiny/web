import { createCommand, LexicalCommand } from "lexical";

export type TextEntityPayload = string;

export const INSERT_TEXT_ENTITY_COMMAND: LexicalCommand<TextEntityPayload> =
  createCommand("INSERT_TEXT_ENTITY_COMMAND");
