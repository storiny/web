use nanoid::nanoid;

static RECOVERY_CODE_LENGTH: usize = 8;

/// Generates a unique set of 10 random 8-character recovery codes.
pub fn generate_recovery_codes() -> Result<[String; 10], ()> {
    let character_set: [char; 16] = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f',
    ];
    let mut recovery_codes: Vec<String> = vec![];

    // Generate recovery codes.
    while recovery_codes.len() < 10 {
        let mut next_recovery_code = nanoid!(RECOVERY_CODE_LENGTH, &character_set).to_string();
        let mut generate_attempts = 0;

        // Make sure the recovery code is unique in the set.
        while recovery_codes.contains(&next_recovery_code) {
            // This case should be rare.
            if generate_attempts >= 100 {
                return Err(());
            }

            generate_attempts += 1;
            next_recovery_code = nanoid!(RECOVERY_CODE_LENGTH, &character_set).to_string();
        }

        recovery_codes.push(next_recovery_code);
    }

    recovery_codes.try_into().map_err(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_generate_recovery_codes() {
        let recovery_codes = generate_recovery_codes();

        assert!(recovery_codes.is_ok());
        assert_eq!(recovery_codes.unwrap().len(), 10);
    }
}
