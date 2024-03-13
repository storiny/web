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
    StoryWriterBlockedByContributor,
    #[strum(serialize = "50005")]
    BlogOwnerBlockedByEditor,
    #[strum(serialize = "50006")]
    BlogOwnerOrEditorBlockedByWriter,
    // Class 51
    #[strum(serialize = "51000")]
    ReceiverNotAcceptingFriendRequest,
    #[strum(serialize = "51001")]
    ContributorNotAcceptingCollaborationRequest,
    #[strum(serialize = "51002")]
    EditorNotAcceptingBlogRequest,
    #[strum(serialize = "51003")]
    WriterNotAcceptingBlogRequest,
    // Class 52
    #[strum(serialize = "52000")]
    RelationOverlap,
    #[strum(serialize = "52001")]
    EntityUnavailable,
    #[strum(serialize = "52002")]
    UsernameCooldown,
    #[strum(serialize = "52003")]
    IllegalContributor,
    #[strum(serialize = "52004")]
    ContributorOverflow,
    #[strum(serialize = "52005")]
    EditorOverflow,
    #[strum(serialize = "52006")]
    WriterOverflow,
    #[strum(serialize = "52007")]
    IllegalEditor,
    #[strum(serialize = "52008")]
    IllegalWriter,
    #[strum(serialize = "52009")]
    IllegalBlogStory,
    #[strum(serialize = "52010")]
    BlogLocked,
}
