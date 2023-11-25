/// The daily resource limit for individual user. The enum value is used as cache key part (`part`
/// in `namespace:part:user_id`). Actual limit for individual resource type is returned from the
/// [ResourceLimit::get_limit] method.
#[derive(Debug, Copy, Clone)]
#[repr(i32)]
pub enum ResourceLimit {
    /// The daily limit for posting assets.
    CreateAsset,
    /// The daily limit for posting comments.
    CreateComment,
    /// The daily limit for posting replies.
    CreateReply,
    /// The daily limit for creating stories.
    CreateStory,
    /// The daily limit for liking stories.
    LikeStory,
    /// The daily limit for liking comments.
    LikeComment,
    /// The daily limit for liking replies.
    LikeReply,
    /// The daily limit for blocking users.
    BlockUser,
    /// The daily limit for muting users.
    MuteUser,
    /// The daily limit for sending friend requests.
    SendFriendRequest,
    /// The daily limit for following users.
    FollowUser,
    /// The daily limit for following tags.
    FollowTag,
    /// The daily limit for bookmarking stories.
    BookmarkStory,
}

impl ResourceLimit {
    /// Returns the upper bound of resource limit value for the resource type.
    pub fn get_limit(&self) -> u32 {
        match self {
            ResourceLimit::CreateAsset => 64,
            ResourceLimit::CreateComment => 175,
            ResourceLimit::CreateReply => 175,
            ResourceLimit::CreateStory => 75,
            ResourceLimit::LikeStory => 675,
            ResourceLimit::LikeComment => 675,
            ResourceLimit::LikeReply => 675,
            ResourceLimit::BlockUser => 300,
            ResourceLimit::MuteUser => 300,
            ResourceLimit::SendFriendRequest => 175,
            ResourceLimit::FollowUser => 400,
            ResourceLimit::FollowTag => 400,
            ResourceLimit::BookmarkStory => 400,
        }
    }
}
