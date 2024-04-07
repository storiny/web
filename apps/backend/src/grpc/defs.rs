#[allow(clippy::unwrap_used)]
pub mod grpc_service {
    pub mod v1 {
        include!("../proto/api_service.v1.rs");
        include!("../proto/api_service.v1.serde.rs");
    }
}

pub mod blog_def {
    pub mod v1 {
        include!("../proto/blog_def.v1.rs");
        include!("../proto/blog_def.v1.serde.rs");
    }
}

pub mod comment_def {
    pub mod v1 {
        include!("../proto/comment_def.v1.rs");
        include!("../proto/comment_def.v1.serde.rs");
    }
}

pub mod connection_def {
    pub mod v1 {
        include!("../proto/connection_def.v1.rs");
        include!("../proto/connection_def.v1.serde.rs");
    }
}

pub mod connection_settings_def {
    pub mod v1 {
        include!("../proto/connection_settings_def.v1.rs");
        include!("../proto/connection_settings_def.v1.serde.rs");
    }
}

pub mod credential_settings_def {
    pub mod v1 {
        include!("../proto/credential_settings_def.v1.rs");
        include!("../proto/credential_settings_def.v1.serde.rs");
    }
}

pub mod login_activity_def {
    pub mod v1 {
        include!("../proto/login_activity_def.v1.rs");
        include!("../proto/login_activity_def.v1.serde.rs");
    }
}

pub mod notification_settings_def {
    pub mod v1 {
        include!("../proto/notification_settings_def.v1.rs");
        include!("../proto/notification_settings_def.v1.serde.rs");
    }
}

pub mod privacy_settings_def {
    pub mod v1 {
        include!("../proto/privacy_settings_def.v1.rs");
        include!("../proto/privacy_settings_def.v1.serde.rs");
    }
}

pub mod profile_def {
    pub mod v1 {
        include!("../proto/profile_def.v1.rs");
        include!("../proto/profile_def.v1.serde.rs");
    }
}

pub mod response_def {
    pub mod v1 {
        include!("../proto/response_def.v1.rs");
        include!("../proto/response_def.v1.serde.rs");
    }
}

pub mod story_def {
    pub mod v1 {
        include!("../proto/story_def.v1.rs");
        include!("../proto/story_def.v1.serde.rs");
    }
}

pub mod tag_def {
    pub mod v1 {
        include!("../proto/tag_def.v1.rs");
        include!("../proto/tag_def.v1.serde.rs");
    }
}

pub mod token_def {
    pub mod v1 {
        include!("../proto/token_def.v1.rs");
        include!("../proto/token_def.v1.serde.rs");
    }
}

pub mod user_def {
    pub mod v1 {
        include!("../proto/user_def.v1.rs");
        include!("../proto/user_def.v1.serde.rs");
    }
}

pub mod open_graph_def {
    pub mod v1 {
        include!("../proto/open_graph_def.v1.rs");
        include!("../proto/open_graph_def.v1.serde.rs");
    }
}
