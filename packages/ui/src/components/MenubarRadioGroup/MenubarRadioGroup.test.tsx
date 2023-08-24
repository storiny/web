import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menubar from "../Menubar";
import MenubarMenu from "../MenubarMenu";
import MenubarRadioItem from "../MenubarRadioItem";
import MenubarRadioGroup from "./MenubarRadioGroup";

describe("<MenubarRadioGroup />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = renderTestWithProvider(
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
    const { getByRole } = renderTestWithProvider(
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
