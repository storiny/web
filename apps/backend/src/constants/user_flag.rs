use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
pub enum UserFlag {
    Staff = 1,
    TemporarilySuspended = 2,
    PermanentlySuspended = 4,
    Verified = 8,
    EarlyUser = 16,
}
