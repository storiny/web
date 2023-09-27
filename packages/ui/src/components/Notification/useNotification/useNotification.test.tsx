// import { act } from "@testing-library/react";
// import React from "react";
//
// import {
//   render_hook_with_provider,
//   render_test_with_provider
// } from "~/redux/testUtils";
//
// import { useNotification } from "./useNotification";
//
// describe("useNotification", () => {
//   it("returns the notification invocation callback", () => {
//     const { result } = render_hook_with_provider(() => useNotification());
//     expect(result.current).toEqual(expect.any(Function));
//   });
//
//   it("renders notification", async () => {
//     const { result, unmount } = render_hook_with_provider(
//       () => useNotification(),
//       {},
//       { ignorePrimitiveProviders: false }
//     );
//
//     act(() => {
//       result.current({ children: "Notification message" });
//     });
//
//     unmount();
//
//     const { getByTestId } = render_test_with_provider(<span />);
//     await getByTestId("notification");
//     expect(getByTestId("notification")).toHaveTextContent(
//       "Notification message"
//     );
//   });
// });
