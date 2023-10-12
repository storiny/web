use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
pub enum NotificationEntityType {
    // System
    System = 1,
    LoginAttempt = 2,
    // Public
    FriendReqAccept = 3,
    FriendReqReceived = 4,
    FollowerAdd = 5,
    CommentAdd = 6,
    ReplyAdd = 7,
    StoryMention = 8,
    StoryLike = 9,
    StoryAddByUser = 10,
    StoryAddByTag = 11,
}
