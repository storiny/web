use proc_macro::TokenStream;
use quote::{
    format_ident,
    quote,
};
use syn::{
    punctuated::Punctuated,
    spanned::Spanned,
    token::Comma,
    FnArg,
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

    let (next_args, next_param_identifiers) = {
        if !arguments.is_empty() {
            let mut next_args: Punctuated<FnArg, Comma> = Punctuated::new();

            for (index, pair) in arguments.clone().into_pairs().enumerate() {
                // Skip the context parameter
                if index != 0 {
                    next_args.push(pair.into_value());
                }
            }

            let mut next_param_identifiers = arguments
                .clone()
                .into_iter()
                .filter_map(|arg| match arg.clone() {
                    syn::FnArg::Receiver(_) => None,
                    syn::FnArg::Typed(syn::PatType { pat, .. }) => match *pat {
                        syn::Pat::Ident(pat_ident) => Some(pat_ident.ident.to_string()),
                        _ => None,
                    },
                })
                .map(|ident| syn::Ident::new(&ident, ident.span()))
                .collect::<Vec<_>>();

            if !next_param_identifiers.is_empty() {
                // Skip the context parameter identifier
                next_param_identifiers.remove(0);
            }

            (next_args, next_param_identifiers)
        } else {
            (arguments.clone(), vec![])
        }
    };

    let wrapped_name = format_ident!("__test_context_wrapped_{}", name);

    let outer_body = quote! {
        {
            use futures::FutureExt;

            let mut ctx = <#context_type as crate::test_utils::TestContext>::setup().await;
            let wrapped_ctx = &mut ctx;

            let result = async move {
                std::panic::AssertUnwindSafe(
                    #wrapped_name(wrapped_ctx, #(#next_param_identifiers),*)
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

    let result = quote! {
        #(#attrs)*
        async fn #name(#next_args) #ret #outer_body

        async fn #wrapped_name(#arguments) #ret #inner_body
    };

    result.into()
}
