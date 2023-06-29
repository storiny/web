import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import { renderTestWithProvider } from "~/redux/testUtils";

import FormInput from "./FormInput";
import { FormInputProps } from "./FormInput.props";

const testSchema = z.object({
  input: z.string(),
});

type TestSchema = z.infer<typeof testSchema>;

const Component = ({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = useForm<TestSchema>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      input: "",
    },
  });

  return (
    <Form disabled={disabled} providerProps={form}>
      {children}
    </Form>
  );
};

describe("<FormInput />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormInput label={"Test label"} name={"input"} />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormInput label={"Test label"} name={"input"} />
      </Component>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = renderTestWithProvider(
      <Component disabled>
        <FormInput
          formSlotProps={
            {
              formItem: {
                "data-testid": "form-item",
              },
            } as FormInputProps["formSlotProps"]
          }
          label={"Test label"}
          name={"input"}
        />
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Component>
        <FormInput
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" },
            } as FormInputProps["formSlotProps"]
          }
          helperText={"Test helper text"}
          label={"Test label"}
          name={"input"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
