use lazy_static::lazy_static;
use markdown::{
    to_html_with_options,
    CompileOptions,
    Constructs,
    Options,
    ParseOptions,
};
use regex::{
    Captures,
    Regex,
    Replacer,
};

lazy_static! {
    static ref USERNAME_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"@(?<username>[\w_]{3,24})").unwrap()
    };
    static ref TAG_REGEX: Regex = {
        #[allow(clippy::unwrap_used)]
        Regex::new(r"#(?<tag>[a-z0-9-]{1,32})").unwrap()
    };
}

/// The source of the markdown string. Decides how the markdown is parsed and rendered into
/// the HTML string and which features are enabled for the specific source.
pub enum MarkdownSource<'a> {
    /// The markdown variant for user bio.
    Bio(&'a str),
    /// The markdown variant for response (comment or reply).
    Response(&'a str),
}

// Mentions
struct MentionReplacer;

impl Replacer for MentionReplacer {
    fn replace_append(&mut self, caps: &Captures<'_>, dst: &mut String) {
        let username = &caps["username"];
        dst.push_str(format!(r#"<a data-mention href="/{username}">@{username}</a>"#).as_str());
    }
}

// Tags
struct TagReplacer;

impl Replacer for TagReplacer {
    fn replace_append(&mut self, caps: &Captures<'_>, dst: &mut String) {
        let tag = &caps["tag"];
        dst.push_str(format!(r#"<a data-tag href="/tag/{tag}">#{tag}</a>"#).as_str());
    }
}

/// Parses and renders markdown string to HTML string.
///
/// * `md_source` - The markdown source string.
pub fn md_to_html(md_source: MarkdownSource) -> String {
    let mut html = match md_source {
        MarkdownSource::Bio(md_str) => {
            let options = Options {
                parse: ParseOptions {
                    constructs: Constructs {
                        attention: true,
                        autolink: false,
                        block_quote: false,
                        character_escape: true,
                        character_reference: false,
                        code_indented: false,
                        code_fenced: false,
                        code_text: false,
                        definition: false,
                        frontmatter: false,
                        gfm_autolink_literal: true,
                        gfm_footnote_definition: false,
                        gfm_label_start_footnote: false,
                        gfm_strikethrough: true,
                        gfm_table: false,
                        gfm_task_list_item: false,
                        hard_break_escape: false,
                        hard_break_trailing: false,
                        heading_atx: false,
                        heading_setext: false,
                        html_flow: false,
                        html_text: false,
                        label_start_image: false,
                        label_start_link: false,
                        label_end: false,
                        list_item: false,
                        math_flow: false,
                        math_text: false,
                        mdx_esm: false,
                        mdx_expression_flow: false,
                        mdx_expression_text: false,
                        mdx_jsx_flow: false,
                        mdx_jsx_text: false,
                        thematic_break: false,
                    },
                    gfm_strikethrough_single_tilde: true,
                    math_text_single_dollar: false,
                    mdx_expression_parse: None,
                    mdx_esm_parse: None,
                },
                compile: CompileOptions {
                    allow_dangerous_html: false,
                    allow_dangerous_protocol: false,
                    default_line_ending: Default::default(),
                    gfm_footnote_label: None,
                    gfm_footnote_label_tag_name: None,
                    gfm_footnote_label_attributes: None,
                    gfm_footnote_back_label: None,
                    gfm_footnote_clobber_prefix: None,
                    gfm_task_list_item_checkable: false,
                    gfm_tagfilter: false,
                },
            };

            // Does not panic unless using MDX.
            to_html_with_options(md_str, &options).unwrap_or_default()
        }
        MarkdownSource::Response(md_str) => {
            let options = Options {
                parse: ParseOptions {
                    constructs: Constructs {
                        attention: true,
                        autolink: true,
                        block_quote: false,
                        character_escape: true,
                        gfm_autolink_literal: true,
                        gfm_footnote_definition: false,
                        gfm_label_start_footnote: false,
                        gfm_strikethrough: true,
                        gfm_table: false,
                        gfm_task_list_item: false,
                        hard_break_escape: false,
                        hard_break_trailing: false,
                        heading_atx: false,
                        heading_setext: false,
                        html_flow: false,
                        html_text: false,
                        label_start_image: false,
                        label_start_link: false,
                        label_end: false,
                        list_item: false,
                        math_flow: false,
                        math_text: false,
                        mdx_esm: false,
                        mdx_expression_flow: false,
                        mdx_expression_text: false,
                        mdx_jsx_flow: false,
                        mdx_jsx_text: false,
                        code_text: true,
                        definition: false,
                        code_indented: false,
                        code_fenced: false,
                        character_reference: false,
                        frontmatter: false,
                        thematic_break: false,
                    },
                    gfm_strikethrough_single_tilde: true,
                    math_text_single_dollar: false,
                    mdx_expression_parse: None,
                    mdx_esm_parse: None,
                },
                compile: CompileOptions {
                    allow_dangerous_html: false,
                    allow_dangerous_protocol: false,
                    default_line_ending: Default::default(),
                    gfm_footnote_label: None,
                    gfm_footnote_label_tag_name: None,
                    gfm_footnote_label_attributes: None,
                    gfm_footnote_back_label: None,
                    gfm_footnote_clobber_prefix: None,
                    gfm_task_list_item_checkable: false,
                    gfm_tagfilter: false,
                },
            };

            // Does not panic unless using MDX.
            to_html_with_options(md_str, &options).unwrap_or_default()
        }
    };

    html = USERNAME_REGEX
        .replace_all(html.as_str(), MentionReplacer)
        .to_string();

    html = TAG_REGEX
        .replace_all(html.as_str(), TagReplacer)
        .to_string();

    html
}

#[cfg(test)]
mod tests {
    use super::*;

    const MD_TEXT: &str = r#"# H1
## H2
### H3
#### H4
##### H5
###### H6

## Text Formatting

- **Bold text** is created with double asterisks or double underscores.
- *Italic text* is created with single asterisks or single underscores.
- ~~Strikethrough text~~ is created with double tildes.
- @mention, @no, @this_mention_text_is_too_large, @inv-alid
- #tag, #this-tag-text-is-too-long-to-render, #inval_id

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

    #[test]
    fn can_convert_md_to_html_for_bio() {
        let html = r#"<p># H1
## H2
### H3
#### H4
##### H5
###### H6</p>
<p>## Text Formatting</p>
<p>- <strong>Bold text</strong> is created with double asterisks or double underscores.
- <em>Italic text</em> is created with single asterisks or single underscores.
- <del>Strikethrough text</del> is created with double tildes.
- <a data-mention href="/mention">@mention</a>, @no, <a data-mention href="/this_mention_text_is_too">@this_mention_text_is_too</a>_large, <a data-mention href="/inv">@inv</a>-alid
- <a data-tag href="/tag/tag">#tag</a>, <a data-tag href="/tag/this-tag-text-is-too-long-to-ren">#this-tag-text-is-too-long-to-ren</a>der, <a data-tag href="/tag/inval">#inval</a>_id</p>
<p>## Lists</p>
<p>1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3</p>
<p>- Unordered list item
- Unordered list item
- Unordered list item</p>
<p>## Links</p>
<p>Create [links](<a href="https://www.storiny.com">https://www.storiny.com</a>) like this.</p>
<p>## Images</p>
<p>Embed images ![Alt text](image-url) like this:</p>
<p>![Image alt](<a href="https://example.com/some_image.svg">https://example.com/some_image.svg</a>)</p>
<p>## Code</p>
<p>Inline code can be created with backticks like `code`.</p>
<p>Create code blocks by wrapping the code in triple backticks:</p>
<p>```rust
fn main() {
println!(&quot;Hello&quot;);
}
```</p>
<p>## Raw HTML</p>
<p>&lt;img alt=&quot;raw html image&quot; src=&quot;<a href="https://example.com/image.png">https://example.com/image.png</a>&quot; /&gt;</p>
"#;

        assert_eq!(md_to_html(MarkdownSource::Bio(MD_TEXT)), html);
    }

    #[test]
    fn can_convert_md_to_html_for_response() {
        let html = r#"<p># H1
## H2
### H3
#### H4
##### H5
###### H6</p>
<p>## Text Formatting</p>
<p>- <strong>Bold text</strong> is created with double asterisks or double underscores.
- <em>Italic text</em> is created with single asterisks or single underscores.
- <del>Strikethrough text</del> is created with double tildes.
- <a data-mention href="/mention">@mention</a>, @no, <a data-mention href="/this_mention_text_is_too">@this_mention_text_is_too</a>_large, <a data-mention href="/inv">@inv</a>-alid
- <a data-tag href="/tag/tag">#tag</a>, <a data-tag href="/tag/this-tag-text-is-too-long-to-ren">#this-tag-text-is-too-long-to-ren</a>der, <a data-tag href="/tag/inval">#inval</a>_id</p>
<p>## Lists</p>
<p>1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3</p>
<p>- Unordered list item
- Unordered list item
- Unordered list item</p>
<p>## Links</p>
<p>Create [links](<a href="https://www.storiny.com">https://www.storiny.com</a>) like this.</p>
<p>## Images</p>
<p>Embed images ![Alt text](image-url) like this:</p>
<p>![Image alt](<a href="https://example.com/some_image.svg">https://example.com/some_image.svg</a>)</p>
<p>## Code</p>
<p>Inline code can be created with backticks like <code>code</code>.</p>
<p>Create code blocks by wrapping the code in triple backticks:</p>
<p><code>rust fn main() {     println!(&quot;Hello&quot;); } </code></p>
<p>## Raw HTML</p>
<p>&lt;img alt=&quot;raw html image&quot; src=&quot;<a href="https://example.com/image.png">https://example.com/image.png</a>&quot; /&gt;</p>
"#;

        assert_eq!(md_to_html(MarkdownSource::Response(MD_TEXT)), html);
    }
}
