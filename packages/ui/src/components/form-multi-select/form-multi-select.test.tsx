import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import { renderTestWithProvider } from "~/redux/testUtils";

import FormMultiSelect from "./form-multi-select";
import { FormMultiSelectProps } from "./form-multi-select.props";

const testSchema = z.object({
  "multi-select": z.array(z.string())
});

type TestSchema = z.infer<typeof testSchema>;

const Component = ({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = useForm<TestSchema>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      "multi-select": ["option-1"]
    }
  });

  return (
    <Form disabled={disabled} providerProps={form}>
      {children}
    </Form>
  );
};

describe("<FormMultiSelect />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
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

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
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

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = renderTestWithProvider(
      <Component disabled>
        <FormMultiSelect
          formSlotProps={
            {
              formItem: {
                "data-testid": "form-item"
              }
            } as FormMultiSelectProps["formSlotProps"]
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
    const { getByTestId } = renderTestWithProvider(
      <Component>
        <FormMultiSelect
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" }
            } as FormMultiSelectProps["formSlotProps"]
          }
          helperText={"Test helper text"}
          label={"Test label"}
          menuIsOpen
          name={"multi-select"}
          options={[]}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
