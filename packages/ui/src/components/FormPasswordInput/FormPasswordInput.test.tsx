import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import { renderTestWithProvider } from "~/redux/testUtils";

import FormPasswordInput from "./FormPasswordInput";

const testSchema = z.object({
  input: z.string()
});

type TestSchema = z.infer<typeof testSchema>;

const Component = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = useForm<TestSchema>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      input: ""
    }
  });

  return <Form providerProps={form}>{children}</Form>;
};

describe("<FormPasswordInput />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormPasswordInput label={"Test label"} name={"input"} />
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Component>
        <FormPasswordInput label={"Test label"} name={"input"} />
      </Component>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
