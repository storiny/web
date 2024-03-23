use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
#[repr(u16)]
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
    CollabReqAccept = 12,
    CollabReqReceived = 13,
    BlogEditorInvite = 14,
    BlogWriterInvite = 15,
}

impl TryFrom<u16> for NotificationEntityType {
    type Error = ();

    fn try_from(v: u16) -> Result<Self, Self::Error> {
        match v {
            // System
            x if x == NotificationEntityType::System as u16 => Ok(NotificationEntityType::System),
            x if x == NotificationEntityType::LoginAttempt as u16 => {
                Ok(NotificationEntityType::LoginAttempt)
            }
            // Public
            x if x == NotificationEntityType::FriendReqAccept as u16 => {
                Ok(NotificationEntityType::FriendReqAccept)
            }
            x if x == NotificationEntityType::FriendReqReceived as u16 => {
                Ok(NotificationEntityType::FriendReqReceived)
            }
            x if x == NotificationEntityType::CollabReqAccept as u16 => {
                Ok(NotificationEntityType::CollabReqAccept)
            }
            x if x == NotificationEntityType::CollabReqReceived as u16 => {
                Ok(NotificationEntityType::CollabReqReceived)
            }
            x if x == NotificationEntityType::FollowerAdd as u16 => {
                Ok(NotificationEntityType::FollowerAdd)
            }
            x if x == NotificationEntityType::CommentAdd as u16 => {
                Ok(NotificationEntityType::CommentAdd)
            }
            x if x == NotificationEntityType::ReplyAdd as u16 => {
                Ok(NotificationEntityType::ReplyAdd)
            }
            x if x == NotificationEntityType::StoryMention as u16 => {
                Ok(NotificationEntityType::StoryMention)
            }
            x if x == NotificationEntityType::StoryLike as u16 => {
                Ok(NotificationEntityType::StoryLike)
            }
            x if x == NotificationEntityType::StoryAddByUser as u16 => {
                Ok(NotificationEntityType::StoryAddByUser)
            }
            x if x == NotificationEntityType::StoryAddByTag as u16 => {
                Ok(NotificationEntityType::StoryAddByTag)
            }
            x if x == NotificationEntityType::BlogEditorInvite as u16 => {
                Ok(NotificationEntityType::BlogEditorInvite)
            }
            x if x == NotificationEntityType::BlogWriterInvite as u16 => {
                Ok(NotificationEntityType::BlogWriterInvite)
            }
            _ => Err(()),
        }
    }
}
