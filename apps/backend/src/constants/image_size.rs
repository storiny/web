use std::fmt;

/// Valid image widths for generating CDN URLs.
#[derive(Debug)]
pub enum ImageSize {
    W24 = 24,
    W32 = 32,
    W64 = 64,
    W128 = 128,
    W256 = 256,
    W320 = 320,
    W640 = 640,
    W860 = 860,
    W1024 = 1024,
    W1440 = 1440,
    W1920 = 1920,
    W2048 = 2048,
}

impl fmt::Display for ImageSize {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        fmt::Debug::fmt(self, f)
    }
}
