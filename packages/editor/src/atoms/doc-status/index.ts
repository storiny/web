import { atom } from "jotai";

export const DOC_STATUS = {
  // The connection to the server is being established.
  connecting /*        */: 1,
  // The connection to the server has been established.
  connected /*         */: 2,
  // The document is currently being synced to the server.
  syncing /*           */: 3,
  // The document is currently being synced to the server.
  synced /*            */: 4,
  // The peer is trying to reconnect to the server.
  reconnecting /*      */: 5,
  // The peer has been disconnected from the server.
  disconnected /*      */: 6,
  // The document has been corrupted.
  doc_corrupted /*     */: 7,
  // The story is being published by the current peer.
  publishing /*        */: 8,
  // The story has been published by the writer.
  published /*         */: 9,
  // The story has been unpublished by the writer.
  unpublished /*       */: 10,
  // The story has been deleted by the writer.
  deleted /*           */: 11,
  // The realm has been destroyed as it was active for too long.
  lifetime_exceeded /* */: 12,
  // The story was not found while joining the realm.
  join_missing_story /**/: 13,
  // The join request was rejected because the realm is full.
  join_realm_full /*   */: 14,
  // The join request was rejected because the user is not authorized.
  // The client should be redirected to the login page.
  join_unauthorized /* */: 15,
  // The peer has been disconnected due to inactivity.
  stale_peer /*        */: 16,
  // The realm was destroyed for an internal reason.
  internal /*          */: 0
};

export type DocStatus = (typeof DOC_STATUS)[keyof typeof DOC_STATUS];

export const doc_status_atom = atom<DocStatus>(DOC_STATUS.connecting);
