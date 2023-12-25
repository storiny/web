import { Klass, LexicalEditor, LexicalNode, NodeKey } from "lexical";
import { Doc, XmlText } from "yjs";

import { Cursor } from "../../utils/sync-cursor-positions";
import { CollabCodeBlockNode } from "../nodes/code-block";
import { CollabDecoratorNode } from "../nodes/decorator";
import {
  $create_collab_element_node,
  CollabElementNode
} from "../nodes/element";
import { CollabLineBreakNode } from "../nodes/line-break";
import { CollabTextNode } from "../nodes/text";

export type ClientID = number;
export type ExcludedProperties = Map<Klass<LexicalNode>, Set<string>>;

export interface Binding {
  client_id: number;
  collab_node_map: Map<
    NodeKey,
    | CollabElementNode
    | CollabTextNode
    | CollabDecoratorNode
    | CollabLineBreakNode
    | CollabCodeBlockNode
  >;
  cursors: Map<ClientID, Cursor>;
  cursors_container: null | HTMLElement;
  doc: Doc;
  doc_map: Map<string, Doc>;
  editor: LexicalEditor;
  excluded_properties: ExcludedProperties;
  node_properties: Map<string, Array<string>>;
  root: CollabElementNode;
}

/**
 * Creates yjs editor binding
 * @param editor Editor
 * @param doc Document
 * @param doc_map Document map
 * @param excluded_properties Excluded properties
 */
export const create_binding = (
  editor: LexicalEditor,
  doc: Doc | null | undefined,
  doc_map: Map<string, Doc>,
  excluded_properties?: ExcludedProperties
): Binding => {
  if (doc === undefined || doc === null) {
    throw new Error("`create_binding`: doc is null or undefined");
  }

  const root_xml_text = doc.get("root", XmlText) as XmlText;
  const root: CollabElementNode = $create_collab_element_node(
    root_xml_text,
    null,
    "root"
  );
  root._key = "root";

  return {
    client_id: doc.clientID,
    collab_node_map: new Map(),
    cursors: new Map(),
    cursors_container: null,
    doc,
    doc_map,
    editor,
    excluded_properties: excluded_properties || new Map(),
    node_properties: new Map(),
    root
  };
};
