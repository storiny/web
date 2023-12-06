# Class 50—User blocked

| Class | Action          | Description                                                 |
|-------|-----------------|-------------------------------------------------------------|
| 50000 | Comment insert  | Story writer has blocked the comment writer                 |
| 50001 | Reply insert    | Comment writer has blocked the reply writer                 |
| 50002 | Relation insert | User to follow has blocked the user trying to follow        |
| 50003 | Friend insert   | Target user has blocked the user trying to send the request |

# Class 51—Missing permissions

| Class | Action         | Description                                                |
|-------|----------------|------------------------------------------------------------|
| 51000 | Friend request | Target user is not accepting requests from the source user |

# Class 52—Others

| Class | Action             | Description                                                         |
|-------|--------------------|---------------------------------------------------------------------|
| 52000 | Relation overlap   | Target user ID is equivalent to the source user ID                  | 
| 52001 | Entity unavailable | Entity has been soft-deleted (or deactivated in case of a user)     |
| 52002 | Username cooldown  | Username was updated recently and is currently on a cooldown period |