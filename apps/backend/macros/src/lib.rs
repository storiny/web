use proc_macro::TokenStream;
use quote::{
    format_ident,
    quote,
};

/// Macro to use on tests to add the setup/teardown functionality.
#[proc_macro_attribute]
pub fn test_context(attr: TokenStream, item: TokenStream) -> TokenStream {
    let context_type = syn::parse_macro_input!(attr as syn::Ident);
    let input = syn::parse_macro_input!(item as syn::ItemFn);

    let ret = &input.sig.output;
    let name = &input.sig.ident;
    let arguments = &input.sig.inputs;
    let inner_body = &input.block;
    let attrs = &input.attrs;

    let wrapped_name = format_ident!("__test_context_wrapped_{}", name);

    let outer_body = quote! {
        {
            use futures::FutureExt;
            let mut ctx = <#context_type as crate::test_utils::TestContext>::setup().await;
            let wrapped_ctx = &mut ctx;
            let result = async move {
                std::panic::AssertUnwindSafe(
                    #wrapped_name(wrapped_ctx)
                ).catch_unwind().await
            }.await;
            <#context_type as crate::test_utils::TestContext>::teardown(ctx).await;
            match result {
                Ok(returned_value) => returned_value,
                Err(err) => {
                    std::panic::resume_unwind(err);
                }
            }
        }
    };

    let async_tag = quote! { async };
    let result = quote! {
        #(#attrs)*
        #async_tag fn #name() #ret #outer_body

        #async_tag fn #wrapped_name(#arguments) #ret #inner_body
    };

    result.into()
}
