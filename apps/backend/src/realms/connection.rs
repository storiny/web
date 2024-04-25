use super::{
    awareness::Awareness,
    protocol::{
        Error,
        Message as ProtocolMessage,
        RealmProtocol,
        SyncMessage,
    },
};
use futures_core::Stream;
use futures_util::stream::{
    SplitSink,
    SplitStream,
};
use std::{
    pin::Pin,
    sync::Arc,
    task::{
        Context,
        Poll,
    },
};
use tokio::sync::RwLock;
use warp::ws::{
    Message,
    WebSocket,
};
use yrs::{
    updates::decoder::Decode,
    Update,
};

/// A warp websocket sink wrapper, that implements futures `Sink` in a way, that makes it
/// compatible with the [super::protocol::RealmProtocol].
#[repr(transparent)]
#[derive(Debug)]
pub struct RealmSink(SplitSink<WebSocket, Message>);

impl From<SplitSink<WebSocket, Message>> for RealmSink {
    fn from(sink: SplitSink<WebSocket, Message>) -> Self {
        RealmSink(sink)
    }
}

impl From<RealmSink> for SplitSink<WebSocket, Message> {
    fn from(val: RealmSink) -> Self {
        val.0
    }
}

impl futures_util::Sink<Vec<u8>> for RealmSink {
    type Error = Error;

    fn poll_ready(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        match Pin::new(&mut self.0).poll_ready(cx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Other(e.into()))),
            Poll::Ready(_) => Poll::Ready(Ok(())),
        }
    }

    fn start_send(mut self: Pin<&mut Self>, item: Vec<u8>) -> Result<(), Self::Error> {
        if let Err(e) = Pin::new(&mut self.0).start_send(Message::binary(item)) {
            Err(Error::Other(e.into()))
        } else {
            Ok(())
        }
    }

    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        match Pin::new(&mut self.0).poll_flush(cx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Other(e.into()))),
            Poll::Ready(_) => Poll::Ready(Ok(())),
        }
    }

    fn poll_close(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        match Pin::new(&mut self.0).poll_close(cx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(Err(e)) => Poll::Ready(Err(Error::Other(e.into()))),
            Poll::Ready(_) => Poll::Ready(Ok(())),
        }
    }
}

/// A warp websocket stream wrapper, that implements futures `Stream` in a way, that makes it
/// compatible with the [super::protocol::RealmProtocol].
#[derive(Debug)]
pub struct RealmStream(SplitStream<WebSocket>);

impl From<SplitStream<WebSocket>> for RealmStream {
    fn from(stream: SplitStream<WebSocket>) -> Self {
        RealmStream(stream)
    }
}

impl From<RealmStream> for SplitStream<WebSocket> {
    fn from(val: RealmStream) -> Self {
        val.0
    }
}

impl Stream for RealmStream {
    type Item = Result<Vec<u8>, Error>;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        match Pin::new(&mut self.0).poll_next(cx) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(None) => Poll::Ready(None),
            Poll::Ready(Some(res)) => match res {
                Ok(item) => Poll::Ready(Some(Ok(item.into_bytes()))),
                Err(e) => Poll::Ready(Some(Err(Error::Other(e.into())))),
            },
        }
    }
}

/// Handles an incoming message from a connection.
///
/// * `awareness` - The awareness instance.
/// * `message` - The incoming message.
/// * `read_only` - If `true`, ignores the sync-step-2 and update messages for peers having only the
///   read-only permission.
pub async fn handle_message(
    awareness: &Arc<RwLock<Awareness>>,
    message: ProtocolMessage,
    read_only: bool,
) -> Result<Option<ProtocolMessage>, Error> {
    match message {
        ProtocolMessage::Sync(msg) => match msg {
            SyncMessage::SyncStep1(state_vector) => {
                let awareness = awareness.read().await;
                RealmProtocol.handle_sync_step1(&awareness, state_vector)
            }
            SyncMessage::SyncStep2(update) => {
                if read_only {
                    Ok(None)
                } else {
                    let mut awareness = awareness.write().await;
                    RealmProtocol.handle_sync_step2(&mut awareness, Update::decode_v1(&update)?)
                }
            }
            SyncMessage::Update(update) => {
                if read_only {
                    Ok(None)
                } else {
                    let mut awareness = awareness.write().await;
                    RealmProtocol.handle_update(&mut awareness, Update::decode_v1(&update)?)
                }
            }
        },
        ProtocolMessage::Auth(reason) => {
            let awareness = awareness.read().await;
            RealmProtocol.handle_auth(&awareness, reason)
        }
        ProtocolMessage::AwarenessQuery => {
            let awareness = awareness.read().await;
            RealmProtocol.handle_awareness_query(&awareness)
        }
        ProtocolMessage::Awareness(update) => {
            let mut awareness = awareness.write().await;
            RealmProtocol.handle_awareness_update(&mut awareness, update)
        }
        ProtocolMessage::Custom(tag, data) => {
            let mut awareness = awareness.write().await;
            RealmProtocol.missing_handle(&mut awareness, tag, data)
        }
        // Internal messages are never received from the peers (they are only sent by the server).
        ProtocolMessage::Internal(_) => Ok(None),
    }
}

#[cfg(test)]
mod test {
    use super::{
        super::{
            awareness::Awareness,
            broadcast::BroadcastGroup,
            protocol::MessageReader,
        },
        *,
    };
    use crate::realms::awareness::AwarenessRef;
    use futures_util::{
        ready,
        stream::{
            SplitSink,
            SplitStream,
        },
        SinkExt,
        Stream,
        StreamExt,
    };
    use serde::{
        Deserialize,
        Serialize,
    };
    use std::{
        future::Future,
        marker::PhantomData,
        net::SocketAddr,
        pin::Pin,
        str::FromStr,
        sync::{
            Arc,
            Weak,
        },
        task::{
            Context,
            Poll,
        },
        time::Duration,
    };
    use tokio::{
        net::TcpStream,
        spawn,
        sync::{
            Mutex,
            Notify,
            RwLock,
        },
        task,
        task::JoinHandle,
        time::{
            sleep,
            timeout,
        },
    };
    use tokio_tungstenite::{
        tungstenite::Message,
        MaybeTlsStream,
        WebSocketStream,
    };
    use warp::{
        ws::{
            WebSocket,
            Ws,
        },
        Filter,
        Rejection,
        Reply,
        Sink,
    };
    use yrs::{
        encoding::read::Cursor,
        updates::{
            decoder::DecoderV1,
            encoder::{
                Encode,
                Encoder,
                EncoderV1,
            },
        },
        Doc,
        GetString,
        Subscription,
        Text,
        Transact,
    };

    /// The connection handler over a pair of message streams, which implements an awareness and
    /// update exchange protocol.
    ///
    /// This connection implements Future pattern and can be awaited upon in order for a caller to
    /// recognize whether underlying websocket connection has been finished gracefully or abruptly.
    #[derive(Debug)]
    struct Connection<Sink, Stream> {
        processing_loop: JoinHandle<Result<(), Error>>,
        awareness: AwarenessRef,
        inbox: Arc<Mutex<Sink>>,
        _stream: PhantomData<Stream>,
    }

    impl<Sink, Stream, E> Connection<Sink, Stream>
    where
        Sink: SinkExt<Vec<u8>, Error = E> + Send + Sync + Unpin + 'static,
        E: Into<Error> + Send + Sync,
    {
        #[allow(dead_code)]
        async fn send(&self, msg: Vec<u8>) -> Result<(), Error> {
            let mut inbox = self.inbox.lock().await;

            match inbox.send(msg).await {
                Ok(_) => Ok(()),
                Err(err) => Err(err.into()),
            }
        }

        #[allow(dead_code)]
        async fn close(self) -> Result<(), E> {
            let mut inbox = self.inbox.lock().await;
            inbox.close().await
        }

        fn sink(&self) -> Weak<Mutex<Sink>> {
            Arc::downgrade(&self.inbox)
        }
    }

    impl<Sink, Stream, E> Connection<Sink, Stream>
    where
        Stream: StreamExt<Item = Result<Vec<u8>, E>> + Send + Sync + Unpin + 'static,
        Sink: SinkExt<Vec<u8>, Error = E> + Send + Sync + Unpin + 'static,
        E: Into<Error> + Send + Sync,
    {
        /// Wraps an incoming [WebSocket] connection and supplied [Awareness] accessor into a new
        /// connection handler capable of exchanging realm messages.
        ///
        /// While the creation of new [WarpConn] always succeeds, a connection itself can possibly
        /// fail while processing incoming input/output. This can be detected by awaiting
        /// for returned [WarpConn] and handling the awaited result.
        ///
        /// * `awareness` - The awareness instance.
        /// * `sink` - The sink part.
        /// * `stream` - The stream part.
        pub fn new(awareness: Arc<RwLock<Awareness>>, sink: Sink, mut stream: Stream) -> Self {
            let sink = Arc::new(Mutex::new(sink));
            let inbox = sink.clone();
            let loop_sink = Arc::downgrade(&sink);
            let loop_awareness = Arc::downgrade(&awareness);

            let processing_loop: JoinHandle<Result<(), Error>> = spawn(async move {
                // At the beginning send SyncStep1 and AwarenessUpdate.
                let payload = {
                    let mut encoder = EncoderV1::new();

                    if let Some(awareness) = loop_awareness.upgrade() {
                        let awareness = awareness.read().await;
                        RealmProtocol.start(&awareness, &mut encoder)?;
                    }

                    encoder.to_vec()
                };

                if !payload.is_empty() {
                    if let Some(sink) = loop_sink.upgrade() {
                        let mut sink = sink.lock().await;

                        if let Err(error) = sink.send(payload).await {
                            return Err(error.into());
                        }
                    } else {
                        // Parent connection handler has been dropped.
                        return Ok(());
                    }
                }

                while let Some(input) = stream.next().await {
                    match input {
                        Ok(data) => {
                            if let Some(mut sink) = loop_sink.upgrade() {
                                if let Some(awareness) = loop_awareness.upgrade() {
                                    match Self::process(&awareness, &mut sink, data).await {
                                        Ok(()) => { /* Continue */ }
                                        Err(error) => return Err(error),
                                    }
                                } else {
                                    // Parent connection handler has been dropped.
                                    return Ok(());
                                }
                            } else {
                                // Parent connection handler has been dropped.
                                return Ok(());
                            }
                        }
                        Err(error) => return Err(error.into()),
                    }
                }

                Ok(())
            });

            Connection {
                processing_loop,
                awareness,
                inbox,
                _stream: PhantomData,
            }
        }

        /// Input handler.
        ///
        /// * `awareness` - The awareness instance.
        /// * `sink` - The sink part.
        /// * `input` - The binary input payload.
        async fn process(
            awareness: &Arc<RwLock<Awareness>>,
            sink: &mut Arc<Mutex<Sink>>,
            input: Vec<u8>,
        ) -> Result<(), Error> {
            let mut decoder = DecoderV1::new(Cursor::new(&input));
            let reader = MessageReader::new(&mut decoder);

            for message_result in reader {
                let message = message_result?;

                if let Some(reply) = handle_message(awareness, message, false).await? {
                    let mut sender = sink.lock().await;

                    if let Err(error) = sender.send(reply.encode_v1()).await {
                        eprintln!("failed to send back the reply");
                        return Err(error.into());
                    }
                }
            }

            Ok(())
        }

        /// Returns the underlying [Awareness] structure, that contains the client state of the
        /// connection.
        pub fn awareness(&self) -> &Arc<RwLock<Awareness>> {
            &self.awareness
        }
    }

    impl<Sink, Stream> Unpin for Connection<Sink, Stream> {}

    impl<Sink, Stream> Future for Connection<Sink, Stream> {
        type Output = Result<(), Error>;

        fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
            match Pin::new(&mut self.processing_loop).poll(cx) {
                Poll::Pending => Poll::Pending,
                Poll::Ready(Err(e)) => Poll::Ready(Err(e.into())),
                Poll::Ready(Ok(r)) => Poll::Ready(r),
            }
        }
    }

    #[derive(Serialize, Deserialize)]
    struct ConnQuery {
        /// The read-only flag for the peer.
        read_only: String,
    }

    /// Starts a warp server at the provided address.
    ///
    /// * `addr` - The socket address to start the server at.
    /// * `bcast` - The broadcast group instance.
    async fn start_server(
        addr: &str,
        bcast: Arc<BroadcastGroup>,
    ) -> Result<JoinHandle<()>, Box<dyn std::error::Error>> {
        let addr = SocketAddr::from_str(addr)?;
        let ws = warp::path("test-realm")
            .and(warp::ws())
            .and(warp::query::<ConnQuery>())
            .and(warp::any().map(move || bcast.clone()))
            .and_then(ws_handler);

        Ok(tokio::spawn(async move {
            warp::serve(ws).run(addr).await;
        }))
    }

    /// Websocket handler.
    ///
    /// * `ws` - The websocket instance.
    /// * `query` - The query parameters from the client.
    /// * `bcast` - The broadcast group instance.
    async fn ws_handler(
        ws: Ws,
        query: ConnQuery,
        bcast: Arc<BroadcastGroup>,
    ) -> Result<impl Reply, Rejection> {
        Ok(ws.on_upgrade(move |socket| peer(socket, bcast, query.read_only == "true")))
    }

    /// Realm peer handler.
    ///
    /// * `ws` - The websocket instance.
    /// * `bcast` - The broadcast group instance.
    /// * `read_only` - If `true`, subscribes the peer with read-only permissions.
    async fn peer(ws: WebSocket, bcast: Arc<BroadcastGroup>, read_only: bool) {
        let (sink, stream) = ws.split();
        let sink = Arc::new(Mutex::new(RealmSink::from(sink)));
        let stream = RealmStream::from(stream);
        let sub = bcast.subscribe(sink, stream, read_only);

        match sub.completed().await {
            Ok(_) => println!("broadcasting for channel finished successfully"),
            Err(error) => eprintln!("broadcasting for channel finished abruptly: {error:?}"),
        }
    }

    struct TungsteniteSink(SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>);

    impl Sink<Vec<u8>> for TungsteniteSink {
        type Error = Error;

        fn poll_ready(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_ready(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }

        fn start_send(mut self: Pin<&mut Self>, item: Vec<u8>) -> Result<(), Self::Error> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = sink.start_send(Message::binary(item));
            match result {
                Ok(_) => Ok(()),
                Err(e) => Err(Error::Other(Box::new(e))),
            }
        }

        fn poll_flush(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_flush(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }

        fn poll_close(
            mut self: Pin<&mut Self>,
            cx: &mut Context<'_>,
        ) -> Poll<Result<(), Self::Error>> {
            let sink = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(sink.poll_close(cx));
            match result {
                Ok(_) => Poll::Ready(Ok(())),
                Err(e) => Poll::Ready(Err(Error::Other(Box::new(e)))),
            }
        }
    }

    struct TungsteniteStream(SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>);

    impl Stream for TungsteniteStream {
        type Item = Result<Vec<u8>, Error>;

        fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
            let stream = unsafe { Pin::new_unchecked(&mut self.0) };
            let result = ready!(stream.poll_next(cx));
            match result {
                None => Poll::Ready(None),
                Some(Ok(msg)) => Poll::Ready(Some(Ok(msg.into_data()))),
                Some(Err(e)) => Poll::Ready(Some(Err(Error::Other(Box::new(e))))),
            }
        }
    }

    /// Creates a realm client.
    ///
    /// * `addr` - The address of the server.
    /// * `doc` - The document.
    /// * `read_only` - If `true`, creates a client with read-only permissions.
    async fn client(
        addr: &str,
        doc: Doc,
        read_only: bool,
    ) -> Result<Connection<TungsteniteSink, TungsteniteStream>, Box<dyn std::error::Error>> {
        let (stream, _) =
            tokio_tungstenite::connect_async(format!("{addr}?read_only={read_only}").as_str())
                .await?;
        let (sink, stream) = stream.split();
        let sink = TungsteniteSink(sink);
        let stream = TungsteniteStream(stream);

        Ok(Connection::new(
            Arc::new(RwLock::new(Awareness::new(doc))),
            sink,
            stream,
        ))
    }

    /// Creates a notifier for the document.
    ///
    /// * `doc` - The document.
    fn create_notifier(doc: &Doc) -> (Arc<Notify>, Subscription) {
        let notify = Arc::new(Notify::new());
        let sub = {
            let notify = notify.clone();
            doc.observe_update_v1(move |_, _| notify.notify_waiters())
                .unwrap()
        };

        (notify, sub)
    }

    /// Asserts text present in the document on a client.
    ///
    /// * `conn` - The client connection.
    /// * `name` - The name that holds the text structure inside the document.
    /// * `expected` - The expected value of the text structure.
    async fn assert_doc_text(
        conn: &Connection<TungsteniteSink, TungsteniteStream>,
        name: &str,
        expected: &str,
    ) {
        let awareness = conn.awareness().read().await;
        let doc = awareness.doc();
        let text = doc.get_or_insert_text(name);
        let str = text.get_string(&doc.transact());

        assert_eq!(str, expected.to_string());
    }

    const TIMEOUT: Duration = Duration::from_secs(5);

    #[tokio::test]
    async fn can_propagate_changes_introduced_by_server_to_subscribed_clients()
    -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");
        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await.unwrap();
        let _server = start_server("0.0.0.0:6600", Arc::new(bcast)).await?;

        // Client with read-write permission.

        let d1 = Doc::with_client_id(2);
        let (_n1, _sub1) = create_notifier(&d1);
        let c1 = client("ws://localhost:6600/test-realm", d1, false).await?;

        // Client with read-only permission.

        let d2 = Doc::with_client_id(3);
        let (_n2, _sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6600/test-realm", d2, true).await?;

        {
            let lock = awareness.write().await;
            text.push(&mut lock.doc().transact_mut(), "abc");
        }

        sleep(TIMEOUT).await;

        // For C1 (read-write)
        assert_doc_text(&c1, "test", "abc").await;

        // For C2 (read-only)
        assert_doc_text(&c2, "test", "abc").await;

        Ok(())
    }

    #[tokio::test]
    async fn can_send_the_initial_state_to_a_subscribed_client()
    -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");

        text.push(&mut doc.transact_mut(), "abc");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await.unwrap();
        let _server = start_server("0.0.0.0:6601", Arc::new(bcast)).await?;

        // Client with read-write permission.

        let d1 = Doc::new();
        let (_n1, _sub1) = create_notifier(&d1);
        let c1 = client("ws://localhost:6601/test-realm", d1, false).await?;

        // Client with read-only permission.

        let d2 = Doc::new();
        let (_n2, _sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6601/test-realm", d2, true).await?;

        sleep(TIMEOUT).await;

        // For C1 (read-write)
        assert_doc_text(&c1, "test", "abc").await;

        // For C2 (read-only)
        assert_doc_text(&c2, "test", "abc").await;

        Ok(())
    }

    #[tokio::test]
    async fn can_propagate_changes_from_one_client_to_others()
    -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        doc.get_or_insert_text("test");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await.unwrap();
        let _server = start_server("0.0.0.0:6602", Arc::new(bcast)).await?;

        let d1 = Doc::with_client_id(2);
        let c1 = client("ws://localhost:6602/test-realm", d1, false).await?;

        // By default, changes made on document on the client side are not propagated automatically.
        let _observer = {
            let sink = c1.sink();
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();

            doc.observe_update_v1(move |_, event| {
                let update = event.update.to_owned();

                if let Some(sink) = sink.upgrade() {
                    task::spawn(async move {
                        let message =
                            ProtocolMessage::Sync(SyncMessage::Update(update)).encode_v1();
                        let mut sink = sink.lock().await;

                        sink.send(message).await.unwrap();
                    });
                }
            })
            .unwrap()
        };

        // Client with read-write permission.

        let d2 = Doc::with_client_id(3);
        let (_n2, _sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6602/test-realm", d2, false).await?;

        // Client with read-only permission.

        let d3 = Doc::with_client_id(4);
        let (_n3, _sub3) = create_notifier(&d3);
        let c3 = client("ws://localhost:6602/test-realm", d3, true).await?;

        {
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "def");
        }

        sleep(TIMEOUT).await;

        // For C2 (read-write)
        assert_doc_text(&c2, "test", "def").await;

        // For C3 (read-only)
        assert_doc_text(&c3, "test", "def").await;

        Ok(())
    }

    #[tokio::test]
    async fn should_not_propagate_changes_from_a_read_only_client_to_others()
    -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        doc.get_or_insert_text("test");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await.unwrap();
        let _server = start_server("0.0.0.0:6603", Arc::new(bcast)).await?;

        let d1 = Doc::with_client_id(2);
        let c1 = client("ws://localhost:6603/test-realm", d1, true).await?;

        // By default, changes made on document on the client side are not propagated automatically.
        let _observer = {
            let sink = c1.sink();
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();

            doc.observe_update_v1(move |_, event| {
                let update = event.update.to_owned();

                if let Some(sink) = sink.upgrade() {
                    task::spawn(async move {
                        let message =
                            ProtocolMessage::Sync(SyncMessage::Update(update)).encode_v1();
                        let mut sink = sink.lock().await;

                        sink.send(message).await.unwrap();
                    });
                }
            })
            .unwrap()
        };

        let d2 = Doc::with_client_id(3);
        let (_n2, _sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6603/test-realm", d2, false).await?;

        {
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "def");
        }

        sleep(TIMEOUT).await;

        assert_doc_text(&c2, "test", "").await;

        Ok(())
    }

    #[tokio::test]
    async fn can_handle_a_client_failure() -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        doc.get_or_insert_text("test");

        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let bcast = BroadcastGroup::new(awareness.clone(), 10).await.unwrap();
        let _server = start_server("0.0.0.0:6604", Arc::new(bcast)).await?;

        let d1 = Doc::with_client_id(2);
        let c1 = client("ws://localhost:6604/test-realm", d1, false).await?;

        // By default, changes made on document on the client side are not propagated automatically.
        let _observer = {
            let sink = c1.sink();
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();

            doc.observe_update_v1(move |_, event| {
                let update = event.update.to_owned();

                if let Some(sink) = sink.upgrade() {
                    task::spawn(async move {
                        let message =
                            ProtocolMessage::Sync(SyncMessage::Update(update)).encode_v1();
                        let mut sink = sink.lock().await;

                        sink.send(message).await.unwrap();
                    });
                }
            })
            .unwrap()
        };

        let d2 = Doc::with_client_id(3);
        let (n2, sub2) = create_notifier(&d2);
        let c2 = client("ws://localhost:6604/test-realm", d2, false).await?;

        let d3 = Doc::with_client_id(4);
        let (n3, sub3) = create_notifier(&d3);
        let c3 = client("ws://localhost:6604/test-realm", d3, false).await?;

        {
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "abc");
        }

        sleep(TIMEOUT).await;

        assert_doc_text(&c2, "test", "abc").await;
        assert_doc_text(&c3, "test", "abc").await;

        // Drop the client, causing an abrupt ending.
        drop(c3);
        drop(n3);
        drop(sub3);

        // C2 notification subscription has been released, we need to refresh it.
        drop(n2);
        drop(sub2);

        #[allow(unused_variables)]
        let (n2, sub2) = {
            let awareness = c2.awareness().write().await;
            let doc = awareness.doc();
            create_notifier(doc)
        };

        {
            let awareness = c1.awareness().write().await;
            let doc = awareness.doc();
            let text = doc.get_or_insert_text("test");
            text.push(&mut doc.transact_mut(), "def");
        }

        timeout(TIMEOUT, n2.notified()).await.unwrap();

        assert_doc_text(&c2, "test", "abcdef").await;

        Ok(())
    }
}
