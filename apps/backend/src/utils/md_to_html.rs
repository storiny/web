use pulldown_cmark::{html, Event, Options, Parser, Tag};

/// Source of the markdown string. Controls how the markdown is parsed and rendered into
/// the HTML string and which features are enabled for the specific source.
pub enum MarkdownSource<'a> {
    /// Markdown for user bio
    Bio(&'a str),
    /// Markdown for response (comment or reply)
    Response(&'a str),
}

/// Parses and renders markdown string to HTML string.
///
/// * `md_source` - The markdown source string.
pub fn md_to_html(md_source: MarkdownSource) -> String {
    let mut options = Options::empty();
    let mut html_buf = String::new();

    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);

    match md_source {
        MarkdownSource::Bio(md_str) => {
            let parser = Parser::new_ext(md_str, options)
                .map(|event| match event {
                    Event::Html(html) => Event::Text(html),
                    _ => event,
                })
                .filter(|event| match event {
                    Event::Start(Tag::Paragraph) | Event::End(Tag::Paragraph) => true,
                    Event::Start(Tag::Emphasis) | Event::End(Tag::Emphasis) => true,
                    Event::Start(Tag::Strikethrough) | Event::End(Tag::Strikethrough) => true,
                    Event::Start(Tag::Strong) | Event::End(Tag::Strong) => true,
                    Event::Start(Tag::Link(..)) | Event::End(Tag::Link(..)) => true,
                    _ => false,
                });
            html::push_html(&mut html_buf, parser);

            html_buf
        }
        MarkdownSource::Response(md_str) => {
            let parser = Parser::new_ext(md_str, options)
                .into_iter()
                .map(|event| match event {
                    Event::Html(html) => Event::Text(html),
                    _ => event,
                });
            html::push_html(&mut html_buf, parser);

            html_buf
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_convert_md_to_html_for_bio() {
        let md = r#"
# H1
## H2
### H3
#### H4
##### H5
###### H6

## Text Formatting

- **Bold text** is created with double asterisks or double underscores.
- *Italic text* is created with single asterisks or single underscores.
- ~~Strikethrough text~~ is created with double tildes.

## Lists

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

- Unordered list item
- Unordered list item
- Unordered list item

## Links

Create [links](https://www.storiny.com) like this.

## Images

Embed images ![Alt text](image-url) like this:

![Image alt](https://example.com/some_image.svg)

## Code

Inline code can be created with backticks like `code`.

Create code blocks by wrapping the code in triple backticks:

```rust
fn main() {
    println!("Hello");
}
```

## Raw HTML

<img alt="raw html image" src="https://example.com/image.png" />
        "#;

        let html = md_to_html(MarkdownSource::Bio(md));

        assert_eq!(html, "".to_string());
    }
}
