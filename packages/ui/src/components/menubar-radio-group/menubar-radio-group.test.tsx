import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menubar from "../menubar";
import MenubarMenu from "../menubar-menu";
import MenubarRadioItem from "../menubar-radio-item";
import MenubarRadioGroup from "./menubar-radio-group";

describe("<MenubarRadioGroup />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup>
            <MenubarRadioItem value={"test"}>Radio item</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByRole("group")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup as={"aside"}>
            <MenubarRadioItem value={"test"}>Radio item</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("group").nodeName.toLowerCase()).toEqual("aside");
  });
});
