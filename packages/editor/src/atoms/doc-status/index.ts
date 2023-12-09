import { atom } from "jotai";

export const DOC_STATUS = {
  // The connection to the server is being established.
  connecting /*        */: 1,
  // The connection to the server has been established.
  connected /*         */: 2,
  // The document is currently being synced to the server.
  syncing /*           */: 3,
  // The peer is trying to reconnect to the server.
  reconnecting /*      */: 4,
  // The peer has been disconnected from the server.
  disconnected /*      */: 5,
  // The document has been corrupted.
  doc_corrupted /*     */: 6,
  // The story is being published by the current peer.
  publishing /*        */: 7,
  // The story has been published by the writer.
  published /*         */: 8,
  // The story has been unpublished by the writer.
  unpublished /*       */: 0,
  // The story has been deleted by the writer.
  deleted /*           */: 10,
  // The realm has been destroyed as it was active for too long.
  lifetime_exceeded /* */: 11,
  // The story was not found while joining the realm.
  join_missing_story /**/: 12,
  // The join request was rejected because the realm is full.
  join_realm_full /*   */: 13,
  // The join request was rejected because the user is not authorized.
  // The client should be redirected to the login page.
  join_unauthorized /* */: 14,
  // The peer has been disconnected due to inactivity.
  stale_peer /*        */: 15,
  // The realm was destroyed for an internal reason.
  internal /*          */: 0
};

export type DocStatus = (typeof DOC_STATUS)[keyof typeof DOC_STATUS];

export const doc_status_atom = atom<DocStatus>(DOC_STATUS.connecting);
