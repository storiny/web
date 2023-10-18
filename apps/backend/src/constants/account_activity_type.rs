use serde::{
    Deserialize,
    Serialize,
};
/// Account activity type.
#[derive(Debug, Serialize, Deserialize, Copy, Clone)]
#[repr(i16)]
pub enum AccountActivityType {
    AccountCreation = 1,
    AccountModified = 2,
    Privacy = 3,
    Mfa = 4,
    DataExport = 5,
    ThirdPartyLogin = 6,
    Password = 7,
    Username = 8,
    Email = 9,
}

impl TryFrom<i16> for AccountActivityType {
    type Error = ();

    fn try_from(v: i16) -> Result<Self, Self::Error> {
        match v {
            1 => Ok(AccountActivityType::AccountCreation),
            2 => Ok(AccountActivityType::AccountModified),
            3 => Ok(AccountActivityType::Privacy),
            4 => Ok(AccountActivityType::Mfa),
            5 => Ok(AccountActivityType::DataExport),
            6 => Ok(AccountActivityType::ThirdPartyLogin),
            7 => Ok(AccountActivityType::Password),
            8 => Ok(AccountActivityType::Username),
            9 => Ok(AccountActivityType::Email),
            _ => Err(()),
        }
    }
}
