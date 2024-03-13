# Class 50—User blocked

| Class | Action             | Description                                                 |
|-------|--------------------|-------------------------------------------------------------|
| 50000 | Comment insert     | Story writer has blocked the comment writer                 |
| 50001 | Reply insert       | Comment writer has blocked the reply writer                 |
| 50002 | Relation insert    | User to follow has blocked the user trying to follow        |
| 50003 | Friend insert      | Target user has blocked the user trying to send the request |
| 50004 | Contributor insert | Contributor has blocked the author of the story             |
| 50005 | Editor insert      | Editor has blocked the owner of the blog                    |
| 50006 | Writer insert      | Writer has blocked the owner or the editor of the blog      |

# Class 51—Missing permissions

| Class | Action                | Description                                                                      |
|-------|-----------------------|----------------------------------------------------------------------------------|
| 51000 | Friend request        | Target user is not accepting requests from the source user                       |
| 51001 | Collaboration request | Contributor is not accepting collaboration requests from the author of the story |
| 51002 | Editor request        | Editor is not accepting blog requests from the owner of the blog                 |
| 51003 | Writer request        | Writer is not accepting blog requests from the owner or the editor of the blog   |

# Class 52—Others

| Class | Action               | Description                                                                                                              |
|-------|----------------------|--------------------------------------------------------------------------------------------------------------------------|
| 52000 | Relation overlap     | Target user ID is equivalent to the source user ID                                                                       | 
| 52001 | Entity unavailable   | Entity has been soft-deleted (or deactivated in case of a user)                                                          |
| 52002 | Username cooldown    | Username was updated recently and is currently on a cooldown period                                                      |
| 52003 | Illegal contributor  | Raised when trying to add the author of a story as one of its contributors                                               |
| 52004 | Contributor overflow | Maximum limit for contributors on a particular story has been reached                                                    |
| 52005 | Editor overflow      | Maximum limit for editors on a particular blog has been reached                                                          |
| 52006 | Writer overflow      | Maximum limit for writers on a particular blog has been reached                                                          |
| 52007 | Illegal editor       | Raised when trying to add the owner of a blog as one of its editors                                                      |
| 52008 | Illegal writer       | Raised when trying to add the owner or editor of a blog as one of its writers                                            |
| 52009 | Illegal blog story   | Raised when trying to submit a story for review on a blog by a user who is not the writer, editor, or owner of the blog. |
| 52010 | Blog locked          | Raised when trying to perform a restricted action on a locked blog.                                                      |