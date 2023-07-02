import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import LegalToc from "./toc";

describe("<LegalToc />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <div>
        <main>
          <h2 id={"h2-1"}>H2</h2>
          <h3 id={"h3-1"}>H3</h3>
        </main>
        <LegalToc />
      </div>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
