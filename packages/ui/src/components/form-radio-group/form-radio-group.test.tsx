import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import FormRadio from "~/components/form-radio";
import { render_test_with_provider } from "~/redux/test-utils";

import { zod_resolver } from "../form";
import FormRadioGroup from "./form-radio-group";
import { FormRadioGroupProps } from "./form-radio-group.props";

const test_schema = z.object({
  radio_group: z.enum(["1", "2", "3"])
});

type TestSchema = z.infer<typeof test_schema>;

const Component = ({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = use_form<TestSchema>({
    resolver: zod_resolver(test_schema),
    defaultValues: {
      radio_group: "1"
    }
  });

  return (
    <Form disabled={disabled} provider_props={form}>
      {children}
    </Form>
  );
};

describe("<FormRadioGroup />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormRadioGroup label={"Test label"} name={"radio_group"}>
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormRadioGroup label={"Test label"} name={"radio_group"}>
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormRadioGroup
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" }
            } as FormRadioGroupProps["form_slot_props"]
          }
          label={"Test label"}
          name={"radio_group"}
        >
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormRadioGroup
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helper_text: { "data-testid": "helper-text" }
            } as FormRadioGroupProps["form_slot_props"]
          }
          helper_text={"Test helper text"}
          label={"Test label"}
          name={"radio_group"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
