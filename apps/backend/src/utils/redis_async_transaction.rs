/// Macro for executing a Redis transaction in an asynchronous context.
///
/// * `$conn` - Redis connection that implements the `Connection` trait.
/// * `$keys` - Array of keys to watch during the transaction.
/// * `$body` - Body of the transaction to be executed.
#[macro_export]
macro_rules! async_transaction {
    ($conn:expr, $keys:expr, $body:expr) => {
        loop {
            redis::cmd("WATCH").arg($keys).query_async($conn).await?;

            if let Some(response) = $body {
                redis::cmd("UNWATCH").query_async($conn).await?;
                break response;
            }
        }
    };
}
