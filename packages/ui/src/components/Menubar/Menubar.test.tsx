import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import MenubarItem from "../MenubarItem";
import MenubarMenu from "../MenubarMenu";
import Menubar from "./Menubar";

describe("<Menubar />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-allowed-attr": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menubar as={"aside"} value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menubar").nodeName.toLowerCase()).toEqual("aside");
  });
});
