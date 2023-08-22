import {
  decrementAction,
  renderToast,
  setFriend,
  setFriendCount,
  setSelfFriendCount,
  setSentRequest
} from "~/redux/features";
import { AppStartListening } from "~/redux/listenerMiddleware";

import { debounceEffect, fetchApi } from "../utils";

export const addFriendListener = (startListening: AppStartListening): void => {
  /**
   * Send friend request to the server
   */
  startListening({
    actionCreator: setSentRequest,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const isFriendRequestSent =
        listenerApi.getState().entities.sentRequests[userId];

      if (isFriendRequestSent) {
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
                        message: json?.error || "Could not send friend request",
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
  });

  /**
   * Increment and decrement friend count. The client can only remove a friend,
   * and to add a friend, the friend request needs to be accepted by the recipient
   */
  startListening({
    actionCreator: setFriend,
    effect: ({ payload }, listenerApi) => {
      const userId = payload[0];
      const hasRemovedFriend = !listenerApi.getState().entities.friends[userId];

      if (hasRemovedFriend) {
        listenerApi.dispatch(setSelfFriendCount(decrementAction));
        listenerApi.dispatch(setFriendCount([userId, decrementAction]));
      }
    }
  });

  /**
   * Send friend remove request to the server
   */
  startListening({
    actionCreator: setFriend,
    effect: async ({ payload }, listenerApi) => {
      await debounceEffect(listenerApi);

      const userId = payload[0];
      const hasRemovedFriend = !listenerApi.getState().entities.friends[userId];

      if (hasRemovedFriend) {
        await fetchApi(`me/friends/${userId}`, listenerApi, {
          method: "DELETE"
        }).catch(() => undefined);
      }
    }
  });
};
