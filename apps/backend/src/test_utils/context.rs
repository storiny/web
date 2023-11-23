/// The trait to implement setup/teardown functionality for async tests.
#[async_trait::async_trait]
pub trait TestContext
where
    Self: Sized,
{
    /// Creates the context. This is run once before each test that uses the context.
    async fn setup() -> Self;
    /// Performs any additional cleanup of the context besides the ones that are already provided by
    /// the normal "drop" semantics.
    async fn teardown(self) {}
}
