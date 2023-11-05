use strum::Display;

/// User token type.
#[derive(Display, Debug)]
pub enum SqlState {
    // Class 50
    #[strum(serialize = "50000")]
    CommentWriterBlockedByStoryWriter,
    #[strum(serialize = "50001")]
    ReplyWriterBlockedByCommentWriter,
    #[strum(serialize = "50002")]
    FollowerBlockedByFollowedUser,
    #[strum(serialize = "50003")]
    TransmitterBlockedByReceiverUser,
    // Class 51
    #[strum(serialize = "51000")]
    ReceiverNotAcceptingFriendRequest,
    // Class 52
    #[strum(serialize = "52000")]
    RelationOverlap,
    #[strum(serialize = "52001")]
    EntityUnavailable,
    #[strum(serialize = "52002")]
    ReadHistoryDisabled,
    #[strum(serialize = "52003")]
    UsernameCooldown,
}
