import { StoryCommentsSortValue } from "../auxiliary-content";

export interface EditorAuxiliaryContentCommentListProps {
  set_sort: (next_sort: StoryCommentsSortValue) => void;
  sort: StoryCommentsSortValue;
}
