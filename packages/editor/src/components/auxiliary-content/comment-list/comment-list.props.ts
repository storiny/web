import { StoryCommentsSortValue } from "../auxiliary-content";

export interface EditorAuxiliaryContentCommentListProps {
  setSort: (nextSort: StoryCommentsSortValue) => void;
  sort: StoryCommentsSortValue;
}
