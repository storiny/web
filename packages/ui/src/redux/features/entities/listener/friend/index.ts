import {
  decrementAction,
  renderToast,
  setEntityRecordValue,
  setSelfFriendCount
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addFriendListener = (startListening: AppStartListening): void => {
  /**
   * Send friend request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "sentRequests") {
        await debounceEffect(listenerApi);
        const [, userId, hasSentFriendRequest] = payload;

        if (hasSentFriendRequest) {
          await fetchApi(`me/friends/${userId}`, listenerApi, {
            method: "POST"
          })
            .then((res) => {
              if (res) {
                if (res.ok) {
                  listenerApi.dispatch(
                    renderToast({
                      message: "Friend request sent",
                      severity: "success"
                    })
                  );
                } else {
                  res
                    .json()
                    .then((json) => {
                      listenerApi.dispatch(
                        renderToast({
                          message:
                            json?.error || "Could not send your friend request",
                          severity: "error"
                        })
                      );
                    })
                    .catch(() => undefined);
                }
              }
            })
            .catch(() => undefined);
        }
      }
    }
  });

  /**
   * Increment and decrement friend count. The client can only remove a friend,
   * and to add a friend, the friend request needs to be accepted by the recipient
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: ({ payload }, listenerApi) => {
      if (payload[0] === "friends") {
        const [, userId, hasAddedFriend] = payload;

        // TODO: ---
        if (!hasAddedFriend) {
          listenerApi.dispatch(setSelfFriendCount(decrementAction));
          listenerApi.dispatch(
            setEntityRecordValue(["friendCounts", userId, false])
          );
        }
      }
    }
  });

  /**
   * Send friend remove request to the server
   */
  startListening({
    actionCreator: setEntityRecordValue,
    effect: async ({ payload }, listenerApi) => {
      if (payload[0] === "friends") {
        await debounceEffect(listenerApi);
        const [, userId, hasAddedFriend] = payload;

        if (!hasAddedFriend) {
          await fetchApi(`me/friends/${userId}`, listenerApi, {
            method: "DELETE"
          }).catch(() => undefined);
        }
      }
    }
  });
};
