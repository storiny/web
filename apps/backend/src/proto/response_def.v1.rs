// @generated
// Self responses

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetResponsesInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetResponsesInfoResponse {
    #[prost(uint32, tag="1")]
    pub comment_count: u32,
    #[prost(uint32, tag="2")]
    pub reply_count: u32,
}
// Story responses

#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryResponsesInfoRequest {
    #[prost(string, tag="1")]
    pub user_id: ::prost::alloc::string::String,
    #[prost(string, tag="2")]
    pub story_id: ::prost::alloc::string::String,
}
#[allow(clippy::derive_partial_eq_without_eq)]
#[derive(Clone, PartialEq, ::prost::Message)]
pub struct GetStoryResponsesInfoResponse {
    #[prost(uint32, tag="1")]
    pub total_count: u32,
    #[prost(uint32, tag="2")]
    pub hidden_count: u32,
}
// @@protoc_insertion_point(module)
