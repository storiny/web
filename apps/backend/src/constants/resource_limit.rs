/// The daily resource limit for individual resource. The enum value is used as cache key part
/// (`part` in `namespace:part:resource_id`). Actual limit for individual resource type is returned
/// from the [ResourceLimit::get_limit] method.
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
    /// The daily limit for creating blogs.
    CreateBlog,
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
    /// The daily limit for following users.
    FollowUser,
    /// The daily limit for following tags.
    FollowTag,
    /// The daily limit for following blogs.
    FollowBlog,
    /// The daily limit for bookmarking stories.
    BookmarkStory,
    /// The daily limit for creating reports. This is computed on the basis of IP address rather
    /// the user ID as the user need not be logged-in to create a report.
    CreateReport,
    /// The daily limit for sending friend requests.
    SendFriendRequest,
    /// The daily limit for sending collaboration requests.
    SendCollabRequest,
    /// The daily limit for sending blog editor requests.
    SendBlogEditorRequest,
    /// The daily limit for sending blog writer requests.
    SendBlogWriterRequest,
    /// The daily limit for uploading blog fonts.
    UploadFont,
    /// The daily limit for subscribing to blog newsletters for non-logged-in users, based on their
    /// IP addresses.
    SubscribeUnregistered,
    /// The daily limit for subscribing to blog newsletters for logged-in users.
    SubscribeRegistered,
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
            ResourceLimit::SendCollabRequest => 50,
            ResourceLimit::FollowUser => 400,
            ResourceLimit::FollowTag => 400,
            ResourceLimit::FollowBlog => 400,
            ResourceLimit::BookmarkStory => 400,
            ResourceLimit::CreateReport => 25,
            ResourceLimit::CreateBlog => 10,
            ResourceLimit::SendBlogEditorRequest => 50,
            ResourceLimit::SendBlogWriterRequest => 100,
            ResourceLimit::UploadFont => 32,
            ResourceLimit::SubscribeUnregistered => 15,
            ResourceLimit::SubscribeRegistered => 675,
        }
    }
}
