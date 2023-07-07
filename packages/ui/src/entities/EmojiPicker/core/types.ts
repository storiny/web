export interface Emoji {
  id: string;
  keywords: string[];
  name: string;
  skins: { native: string; unified: string; x: number; y: number }[];
  version: number;
}
