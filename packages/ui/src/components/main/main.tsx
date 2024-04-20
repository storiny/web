import React from "react";

import { MainProps } from "./main.props";

const Main = (props: MainProps): React.ReactElement => (
  <main data-root={"true"} {...props}></main>
);

export default Main;
