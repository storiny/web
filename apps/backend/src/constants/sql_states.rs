use strum::Display;

/// SQL states. Refer to `sqlstates.md` at the root of this project.
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
    #[strum(serialize = "50004")]
    ContributorBlockedByStoryWriter,
    // Class 51
    #[strum(serialize = "51000")]
    ReceiverNotAcceptingFriendRequest,
    #[strum(serialize = "51001")]
    ContributorNotAcceptingCollaborationRequest,
    // Class 52
    #[strum(serialize = "52000")]
    RelationOverlap,
    #[strum(serialize = "52001")]
    EntityUnavailable,
    #[strum(serialize = "52002")]
    UsernameCooldown,
    #[strum(serialize = "52003")]
    IllegalContributor,
}
