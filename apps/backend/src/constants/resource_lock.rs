use strum_macros::Display;

/// The resource lock.
#[derive(Display, Debug, Copy, Clone)]
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
    /// This might cause issues when users from a particular company or organization use an
    /// intranet to register, as they share the same IP address.
    #[strum(serialize = "l:sgn")]
    Signup,
    /// The password reset resource lock. This occurs when there are too many passowrd reset
    /// requests for a single account.
    #[strum(serialize = "l:pwd:rst")]
    ResetPassword,
    /// The account recovery resource lock. This occurs when there are too many recovery requests
    /// for a single account.
    #[strum(serialize = "l:rcv")]
    Recovery,
    /// The account verification resource lock. This occurs when there are too many e-mail
    /// verification requests for a single account.
    #[strum(serialize = "l:vfy")]
    Verification,
}

impl ResourceLock {
    /// Returns the maximum number of incorrect attempts for a resource before it starts locking in
    /// an exponential-backoff fashion.
    pub fn get_max_attempts(&self) -> u32 {
        match self {
            ResourceLock::Login => 8,
            ResourceLock::Signup => 30,
            ResourceLock::Recovery => 10,
            ResourceLock::ResetPassword => 10,
            ResourceLock::Verification => 5,
        }
    }
}
