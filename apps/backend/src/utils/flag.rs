use crate::constants::user_flag::UserFlag;

/// The user flag object.
#[derive(Debug)]
pub struct Flag {
    flags: u32,
}

/// The flag mask.
#[derive(Debug)]
pub enum Mask {
    /// The single flag mark variant. It can only hold a single user flag.
    Single(UserFlag),
    /// The multiple flag mask variant. It can hold an array of user flags.
    Multiple(Vec<UserFlag>),
}

impl Flag {
    /// Ctor
    ///
    /// * `flags` - User flags.
    pub fn new(flags: u32) -> Self {
        Self { flags }
    }

    /// Adds a new flag to the existing flags.
    ///
    /// * `flag` - The new flag to add.
    pub fn add_flag(&mut self, flag: UserFlag) {
        if self.flags & (flag as u32) != 0 {
            return;
        }

        self.flags |= flag as u32;
    }

    /// Removes a flag from the existing flags.
    ///
    /// * `flag` - The flag to remove.
    pub fn remove_flag(&mut self, flag: UserFlag) {
        if self.flags & (flag as u32) == 0 {
            return;
        }

        self.flags &= !(flag as u32);
    }

    /// Predicate method for determining the existence of a flag or mask among the existing flags.
    ///
    /// * `mask` - Flag or mask.
    /// * `all` - Whether to check against all of the flags.
    /// * `inverse` - Whether or not to check if the user has the flags.
    fn test_flag(&self, mask: &Mask, all: bool, inverse: bool) -> bool {
        let flag_mask = match mask {
            Mask::Single(single_flag) => *single_flag as u32,
            Mask::Multiple(multipleflags) => self.get_mask(multipleflags),
        };

        let mut result: bool;

        if all {
            result = (self.flags & flag_mask) == flag_mask;
        } else {
            result = (self.flags & flag_mask) != 0;
        }

        if inverse {
            result = !result;
        }

        result
    }

    /// Predicate method for determining whether any of the specified flags exist among the flags.
    ///
    /// * `mask` - Mask to check.
    pub fn has_any_of(&self, mask: Mask) -> bool {
        self.test_flag(&mask, false, false)
    }

    /// Predicate method for determining whether all the flags exist among the existing flags.
    ///
    /// * `mask` - Mask to check.
    pub fn has_all_of(&self, mask: Mask) -> bool {
        self.test_flag(&mask, true, false)
    }

    /// Predicate method for determining whether any of the specified flags do not exist among the
    /// flags.
    ///
    /// * `mask` - Mask to check.
    pub fn not_any_of(&self, mask: Mask) -> bool {
        self.test_flag(&mask, false, true)
    }

    /// Predicate method for determining whether all the flags do not exist among the existing
    /// flags.
    ///
    /// * `mask` - Mask to check.
    pub fn not_all_of(&self, mask: Mask) -> bool {
        self.test_flag(&mask, true, true)
    }

    /// Predicate method for determining whether there are no flags.
    pub fn none(&self) -> bool {
        self.flags == 0
    }

    /// Returns all the flags.
    pub fn get_flags(&self) -> u32 {
        self.flags
    }

    /// Returns the mask for multiple flags.
    ///
    /// * `flags` - Flags
    fn get_mask(&self, flags: &Vec<UserFlag>) -> u32 {
        let mut mask = 0;

        for flag in flags {
            mask += *flag as u32;
        }

        mask
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_return_true_for_none_method_if_there_are_not_flags() {
        let flags = Flag::new(0);
        assert!(flags.none());
    }

    #[test]
    fn can_add_a_new_flag() {
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::Staff);
        assert_eq!(flags.get_flags(), UserFlag::Staff as u32);
    }

    #[test]
    fn can_remove_an_existing_flag() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        assert_eq!(flags.get_flags(), UserFlag::Staff as u32);
        flags.remove_flag(UserFlag::Staff);
        assert_eq!(flags.get_flags(), 0);
    }

    #[test]
    fn can_skip_removing_a_non_existent_flag() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        assert_eq!(flags.get_flags(), UserFlag::Staff as u32);
        flags.remove_flag(UserFlag::Verified);
        assert_eq!(flags.get_flags(), UserFlag::Staff as u32);
    }

    #[test]
    fn can_add_multiple_flags() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        flags.add_flag(UserFlag::Verified);
        assert_eq!(
            flags.get_flags(),
            UserFlag::Staff as u32 + UserFlag::Verified as u32
        );
    }

    #[test]
    fn can_remove_a_single_flag_from_multiple_flags() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        flags.add_flag(UserFlag::Verified);
        assert_eq!(
            flags.get_flags(),
            UserFlag::Staff as u32 + UserFlag::Verified as u32
        );

        flags.remove_flag(UserFlag::Verified);
        assert_eq!(flags.get_flags(), UserFlag::Staff as u32);
    }

    #[test]
    fn can_return_true_for_a_single_existent_flag() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        assert!(flags.has_any_of(Mask::Single(UserFlag::Staff)));
        assert!(!flags.has_any_of(Mask::Single(UserFlag::Verified)));
    }

    #[test]
    fn can_return_true_for_any_of_the_existent_flag() {
        let mut flags = Flag::new(0);
        flags.add_flag(UserFlag::Staff);
        assert!(flags.has_any_of(Mask::Multiple(vec![UserFlag::Staff, UserFlag::EarlyUser])));
    }

    #[test]
    fn can_return_true_for_a_list_of_existent_flags() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        flags.add_flag(UserFlag::Verified);

        assert!(flags.has_all_of(Mask::Multiple(vec![UserFlag::Staff, UserFlag::Verified])));
        assert!(!flags.has_all_of(Mask::Multiple(vec![
            UserFlag::Staff,
            UserFlag::Verified,
            UserFlag::EarlyUser
        ])));
    }

    #[test]
    fn can_return_true_for_a_single_non_existent_flag() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        assert!(flags.not_any_of(Mask::Single(UserFlag::Verified)));
        assert!(!flags.not_any_of(Mask::Single(UserFlag::Staff)));
    }

    #[test]
    fn can_return_true_for_any_of_the_non_existent_flag() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        assert!(flags.not_any_of(Mask::Multiple(vec![
            UserFlag::Verified,
            UserFlag::EarlyUser
        ])));
    }

    #[test]
    fn can_return_true_for_a_list_of_non_existent_flags() {
        let mut flags = Flag::new(0);

        flags.add_flag(UserFlag::Staff);
        flags.add_flag(UserFlag::Verified);

        assert!(!flags.not_all_of(Mask::Multiple(vec![UserFlag::Staff, UserFlag::Verified])));
        assert!(flags.not_all_of(Mask::Multiple(vec![
            UserFlag::Staff,
            UserFlag::Verified,
            UserFlag::EarlyUser
        ])));
    }
}
