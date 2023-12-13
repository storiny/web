import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Menu from "../menu";
import Separator from "./";

describe("<Separator />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("renders with inverted margin", () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator invert_margin />
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator />
      </Menu>
    );

    expect(
      await axe(baseElement, {
        rules: {
          region: { enabled: false },
          "aria-required-children": { enabled: false }
        }
      })
    ).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <Separator as={"aside"} />
      </Menu>
    );

    expect(getByRole("separator").nodeName.toLowerCase()).toEqual("aside");
  });
});
