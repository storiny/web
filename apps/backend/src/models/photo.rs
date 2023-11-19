use serde::{
    Deserialize,
    Serialize,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct PhotoSource {
    pub medium: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Photo {
    pub id: i64,
    pub width: u32,
    pub height: u32,
    pub src: PhotoSource,
    pub url: String,
    pub alt: Option<String>,
    pub avg_color: Option<String>,
    pub photographer: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PexelsResponse {
    pub photos: Vec<Photo>,
}
