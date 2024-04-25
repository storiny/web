use std::fmt;

/// Valid image widths for generating CDN URLs.
#[derive(Debug, Copy, Clone)]
pub enum ImageSize {
    W64 = 64,
    W128 = 128,
    W320 = 320,
    W640 = 640,
    W960 = 960,
    W1200 = 1200,
    W1440 = 1440,
    W1920 = 1920,
    W2440 = 2440,
}

impl fmt::Display for ImageSize {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let value = *self as u32;
        fmt::Debug::fmt(&value, f)
    }
}
