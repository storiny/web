import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import { render_test_with_provider } from "~/redux/test-utils";

import { zod_resolver } from "../form";
import FormMultiSelect from "./form-multi-select";
import { FormMultiSelectProps } from "./form-multi-select.props";

const test_schema = z.object({
  "multi-select": z.array(z.string())
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
      "multi-select": ["option-1"]
    }
  });

  return (
    <Form disabled={disabled} provider_props={form}>
      {children}
    </Form>
  );
};

describe("<FormMultiSelect />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormMultiSelect
          label={"Test label"}
          menuIsOpen
          name={"multi-select"}
          options={Array(3).map((_, index) => ({
            value: `option-${index}`,
            label: `Option ${index}`
          }))}
        />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormMultiSelect
          form_slot_props={
            {
              form_item: {
                "data-testid": "form-item"
              }
            } as FormMultiSelectProps["form_slot_props"]
          }
          label={"Test label"}
          menuIsOpen
          name={"multi-select"}
          options={Array(3).map((_, index) => ({
            value: `option-${index}`,
            label: `Option ${index}`
          }))}
        />
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormMultiSelect
          form_slot_props={
            {
              form_item: { "data-testid": "form-item" },
              label: { "data-testid": "label" },
              helper_text: { "data-testid": "helper-text" }
            } as FormMultiSelectProps["form_slot_props"]
          }
          helper_text={"Test helper text"}
          label={"Test label"}
          menuIsOpen
          name={"multi-select"}
          options={[]}
        />
      </Component>
    );

    ["form-item", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
