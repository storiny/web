import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import React from "react";

import { validate_url } from "../../utils/sanitize-url";

const LinkPlugin = (): React.ReactElement => (
  <LexicalLinkPlugin validate_url={validate_url} />
);

export default LinkPlugin;
