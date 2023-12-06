use strum_macros::Display;

/// The resource lock.
#[derive(Display, Debug)]
pub enum ResourceLock {
    /// The login resource lock. This occurs when there are too many failed attempts for password,
    /// authentication code, or the recovery code during the login process.
    #[strum(serialize = "l:lgn")]
    Login,
    /// The signup resource lock. This occurs when too many users register from the same IP
    /// address.
    ///
    /// # Caution
    ///
    /// This might cause issues when users from a company or organization use an intranet to
    /// register, as they share the same IP address.
    #[strum(serialize = "l:sgn")]
    Signup,
    /// The password resource lock. This occurs when there are too many failed attempts for the
    /// account password verification operation.
    #[strum(serialize = "l:pwd")]
    Password,
}

impl ResourceLock {
    /// Returns the maximum number of incorrect attempts for a resource before it starts locking in
    /// an exponential-backoff fashion.
    pub fn get_max_attempts(&self) -> u32 {
        match self {
            ResourceLock::Login => 10,
            ResourceLock::Signup => 30,
            ResourceLock::Password => 15,
        }
    }
}
