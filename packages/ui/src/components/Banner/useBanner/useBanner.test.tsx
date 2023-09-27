// import { act } from "@testing-library/react";
// import React from "react";
//
// import {
//   render_hook_with_provider,
//   render_test_with_provider
// } from "~/redux/testUtils";
//
// import { useBanner } from "./useBanner";
//
// describe("useBanner", () => {
//   it("returns the banner invocation callback", () => {
//     const { result } = render_hook_with_provider(() => useBanner());
//     expect(result.current).toEqual(expect.any(Function));
//   });
//
//   it("renders banner", async () => {
//     const { result, unmount } = render_hook_with_provider(
//       () => useBanner(),
//       {},
//       { ignorePrimitiveProviders: false }
//     );
//
//     act(() => {
//       result.current("Banner message");
//     });
//
//     unmount();
//
//     const { getByTestId } = render_test_with_provider(<span />);
//     await getByTestId("banner");
//     expect(getByTestId("banner")).toHaveTextContent("Banner message");
//   });
// });
