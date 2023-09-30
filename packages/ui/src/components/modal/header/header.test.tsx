import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Modal from "../modal";
import { ModalHeaderProps } from "./header.props";

describe("<ModalHeader />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: { children: "Test" }
        }}
      />
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: { children: "Test" }
        }}
      />
    );

    await wait_for(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders decorator and children", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: {
            decorator: <span data-testid={"decorator"} />,
            children: <span data-testid={"child"} />
          }
        }}
      />
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: {
            children: "Test",
            decorator: <span />,
            slot_props: {
              decorator: { "data-testid": "decorator" },
              title: { "data-testid": "title" }
            } as ModalHeaderProps["slot_props"]
          }
        }}
      />
    );

    ["decorator", "title"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
