# Class 50—User blocked

| Class | Action             | Description                                                 |
|-------|--------------------|-------------------------------------------------------------|
| 50000 | Comment insert     | Story writer has blocked the comment writer                 |
| 50001 | Reply insert       | Comment writer has blocked the reply writer                 |
| 50002 | Relation insert    | User to follow has blocked the user trying to follow        |
| 50003 | Friend insert      | Target user has blocked the user trying to send the request |
| 50004 | Contributor insert | Contributor has been blocked by the author of the story     |

# Class 51—Missing permissions

| Class | Action                | Description                                                                      |
|-------|-----------------------|----------------------------------------------------------------------------------|
| 51000 | Friend request        | Target user is not accepting requests from the source user                       |
| 51001 | Collaboration request | Contributor is not accepting collaboration requests from the author of the story |

# Class 52—Others

| Class | Action               | Description                                                                |
|-------|----------------------|----------------------------------------------------------------------------|
| 52000 | Relation overlap     | Target user ID is equivalent to the source user ID                         | 
| 52001 | Entity unavailable   | Entity has been soft-deleted (or deactivated in case of a user)            |
| 52002 | Username cooldown    | Username was updated recently and is currently on a cooldown period        |
| 52003 | Illegal contributor  | Raised when trying to add the author of a story as one of its contributors |
| 52004 | Contributor overflow | Maximum limit for contributors on a particular story has been reached      |