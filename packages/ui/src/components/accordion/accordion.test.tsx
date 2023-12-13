import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Accordion, {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "./accordion";
import {
  AccordionContentProps,
  AccordionTriggerProps
} from "./accordion.props";

describe("<Accordion />", () => {
  it("matches snapshot for `single` type", () => {
    const { container } = render_test_with_provider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot for `multiple` type", () => {
    const { container } = render_test_with_provider(
      <Accordion defaultValue={["test"]} type={"multiple"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations for `single` type", async () => {
    const { container } = render_test_with_provider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations for `multiple` type", async () => {
    const { container } = render_test_with_provider(
      <Accordion defaultValue={["test"]} type={"multiple"}>
        <AccordionItem value="test">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Accordion
        as={"aside"}
        collapsible
        data-testid={"accordion"}
        defaultValue={"test"}
        type={"single"}
      >
        <AccordionItem as={"aside"} data-testid={"item"} value="test">
          <AccordionTrigger
            as={"aside"}
            data-testid={"trigger"}
            slot_props={
              {
                header: {
                  as: "aside",
                  "data-testid": "header"
                }
              } as AccordionTriggerProps["slot_props"]
            }
          >
            Trigger
          </AccordionTrigger>
          <AccordionContent as={"aside"} data-testid={"content"}>
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    ["accordion", "item", "trigger", "header", "content"].forEach((id) => {
      expect(getByTestId(id).nodeName.toLowerCase()).toEqual("aside");
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Accordion collapsible defaultValue={"test"} type={"single"}>
        <AccordionItem data-testid={"item"} value="test">
          <AccordionTrigger
            slot_props={
              {
                header: { "data-testid": "header" },
                icon: { "data-testid": "icon" }
              } as AccordionTriggerProps["slot_props"]
            }
          >
            Trigger
          </AccordionTrigger>
          <AccordionContent
            slot_props={
              {
                wrapper: {
                  "data-testid": "wrapper"
                }
              } as AccordionContentProps["slot_props"]
            }
          >
            Content
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    ["header", "item", "wrapper"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
