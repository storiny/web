type TermSegment = "tos" | "community-guidelines";
type PolicySegment =
  | "privacy"
  | "username"
  | "logo"
  | "trademark"
  | "government-takedown"
  | "dmca"
  | "content-removal";
type UsePolicySegment =
  | "general"
  | "bullying"
  | "disturbing-ux"
  | "doxxing"
  | "hate-speech"
  | "impersonation"
  | "misinformation"
  | "obscene-content"
  | "violent-content"
  | "appeals";
type MiscellaneousSegment = "acknowledgements";

export type LegalSegment =
  | `terms/${TermSegment}`
  | `policies/${PolicySegment}`
  | `use-policies/${UsePolicySegment}`
  | `miscellaneous/${MiscellaneousSegment}`;
