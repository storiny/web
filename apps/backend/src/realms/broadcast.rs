use super::{
    awareness::AwarenessRef,
    connection::handle_message,
    protocol::{
        Error,
        Message,
        MSG_SYNC,
        MSG_SYNC_UPDATE,
    },
};
use futures_util::{
    SinkExt,
    StreamExt,
};
use std::sync::Arc;
use tokio::{
    select,
    sync::{
        broadcast::{
            channel,
            error::SendError,
            Receiver,
            Sender,
        },
        Mutex,
    },
    task::JoinHandle,
};
use tracing::{
    trace,
    warn,
};
use yrs::{
    encoding::write::Write,
    updates::{
        decoder::Decode,
        encoder::{
            Encode,
            Encoder,
            EncoderV1,
        },
    },
};

/// A broadcast group can be used to propagate updates produced by yrs [yrs::Doc] and [Awareness]
/// structures in a binary form that conforms to a sync protocol.
///
/// New receivers can subscribe to a broadcasting group via [BroadcastGroup::subscribe] method.
#[allow(dead_code)]
pub struct BroadcastGroup {
    awareness_sub: yrs::Subscription,
    doc_sub: yrs::Subscription,
    awareness_ref: AwarenessRef,
    sender: Sender<Vec<u8>>,
    receiver: Receiver<Vec<u8>>,
    awareness_updater: JoinHandle<()>,
}

unsafe impl Send for BroadcastGroup {}
unsafe impl Sync for BroadcastGroup {}

impl BroadcastGroup {
    /// Creates a new [BroadcastGroup] instance over the provided `awareness` instance. All changes
    /// triggered by this awareness structure or its underlying document will be propagated to
    /// all subscribers which have been registered via [BroadcastGroup::subscribe] method.
    ///
    /// The overflow of the incoming events that needs to be propagates will be buffered up to the
    /// provided `buffer_capacity` size.
    ///
    /// * `awareness` - The doc awareness.
    /// * `buffer_capacity` - The buffer capacity for the overflowing events.
    pub async fn new(
        awareness: AwarenessRef,
        buffer_capacity: usize,
    ) -> Result<Self, atomic_refcell::BorrowMutError> {
        let (sender, receiver) = channel(buffer_capacity);
        let awareness_clone = Arc::downgrade(&awareness);
        let mut lock = awareness.write().await;
        let sink = sender.clone();

        let doc_sub = {
            lock.doc_mut().observe_update_v1(move |_, event| {
                // We manually construct the message here to avoid update data copying.
                let mut encoder = EncoderV1::new();
                encoder.write_var(MSG_SYNC);
                encoder.write_var(MSG_SYNC_UPDATE);
                encoder.write_buf(&event.update);

                let msg = encoder.to_vec();

                if sink.send(msg).is_err() {
                    // Current broadcast group is being closed
                }
            })?
        };

        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
        let sink = sender.clone();

        let awareness_sub = lock.on_update(move |event| {
            let added = event.added();
            let updated = event.updated();
            let removed = event.removed();
            let mut changed = Vec::with_capacity(added.len() + updated.len() + removed.len());
            changed.extend_from_slice(added);
            changed.extend_from_slice(updated);
            changed.extend_from_slice(removed);

            if tx.send(changed).is_err() {
                warn!("failed to send awareness update");
            }
        });

        drop(lock);

        let awareness_updater = tokio::task::spawn(async move {
            while let Some(changed_clients) = rx.recv().await {
                if let Some(awareness) = awareness_clone.upgrade() {
                    let awareness = awareness.read().await;

                    match awareness.update_with_clients(changed_clients) {
                        Ok(update) => {
                            if sink.send(Message::Awareness(update).encode_v1()).is_err() {
                                warn!("could not broadcast the awareness update");
                            }
                        }
                        Err(err) => {
                            warn!("error while computing awareness update: {err:?}")
                        }
                    }
                } else {
                    return;
                }
            }
        });

        Ok(BroadcastGroup {
            awareness_ref: awareness,
            awareness_updater,
            sender,
            receiver,
            awareness_sub,
            doc_sub,
        })
    }

    /// Returns a reference to the underlying [Awareness] instance.
    pub fn awareness(&self) -> &AwarenessRef {
        &self.awareness_ref
    }

    /// Broadcasts a user message to all the active subscribers. Returns an error if message could
    /// not have been broadcasted.
    ///
    /// * `message` - The message value to broadcast.
    pub fn broadcast(&self, message: Vec<u8>) -> Result<(), SendError<Vec<u8>>> {
        self.sender.send(message)?;
        Ok(())
    }

    /// Broadcasts an internal message to all the active subscribers.
    ///
    /// * `message` - The message value to broadcast.
    pub fn broadcast_internal_message(&self, message: &str) -> Result<(), SendError<Vec<u8>>> {
        let update = Message::Internal(message.to_string()).encode_v1();
        self.broadcast(update)?;

        Ok(())
    }

    /// Subscribes a new connection - represented by `sink`/`stream` pair implementing a futures
    /// Sink and Stream protocols - to the current broadcast group.
    ///
    /// Returns a subscription structure, which can be dropped in order to unsubscribe or awaited
    /// via [Subscription::completed] method in order to complete of its own volition (due to an
    /// internal connection error or closed connection).
    ///
    /// * `sink` - The sink part.
    /// * `stream` - The stream part.
    /// * `read_only` - If `true`, subscribes with read-only configuration. Messages that modify the
    ///   document from this peer will be ignored.
    pub fn subscribe<Sink, Stream, E>(
        &self,
        sink: Arc<Mutex<Sink>>,
        mut stream: Stream,
        read_only: bool,
    ) -> Subscription
    where
        Sink: SinkExt<Vec<u8>> + Send + Sync + Unpin + 'static,
        Stream: StreamExt<Item = Result<Vec<u8>, E>> + Send + Sync + Unpin + 'static,
        <Sink as futures_util::Sink<Vec<u8>>>::Error: std::error::Error + Send + Sync,
        E: std::error::Error + Send + Sync + 'static,
    {
        let sink_task = {
            let sink = sink.clone();
            let mut receiver = self.sender.subscribe();

            tokio::spawn(async move {
                while let Ok(message) = receiver.recv().await {
                    let mut sink = sink.lock().await;

                    if let Err(error) = sink.send(message).await {
                        trace!("subscription: failed to send the sync message");
                        return Err(Error::Other(Box::new(error)));
                    }
                }

                Ok(())
            })
        };

        let stream_task = {
            let awareness = self.awareness().clone();

            tokio::spawn(async move {
                while let Some(res) = stream.next().await {
                    let data = res.map_err(Box::new).map_err(|error| Error::Other(error))?;
                    let message = Message::decode_v1(&data)?;

                    if let Some(reply) = handle_message(&awareness, message, read_only).await? {
                        let mut sink = sink.lock().await;

                        sink.send(reply.encode_v1())
                            .await
                            .map_err(Box::new)
                            .map_err(|error| Error::Other(error))?;
                    }
                }

                Ok(())
            })
        };

        Subscription {
            sink_task,
            stream_task,
        }
    }
}

impl Drop for BroadcastGroup {
    fn drop(&mut self) {
        self.awareness_updater.abort();
    }
}

/// A subscription structure returned from [BroadcastGroup::subscribe], which represents a
/// subscribed connection. It can be dropped in order to unsubscribe or awaited via
/// [Subscription::completed] method in order to complete of its own volition (due to an internal
/// connection error or closed connection).
#[derive(Debug)]
pub struct Subscription {
    sink_task: JoinHandle<Result<(), Error>>,
    stream_task: JoinHandle<Result<(), Error>>,
}

impl Subscription {
    /// Consumes the current subscription, waiting for it to complete. If an underlying connection
    /// was closed because of failure, an error which caused it to happen will be returned.
    ///
    /// This method doesn't invoke the close procedure. If we need that, we need to drop the current
    /// subscription instead.
    pub async fn completed(self) -> Result<(), Error> {
        let res = select! {
            r1 = self.sink_task => r1?,
            r2 = self.stream_task => r2?,
        };

        res
    }
}

#[cfg(test)]
mod test {
    use super::super::{
        awareness::{
            Awareness,
            AwarenessUpdate,
            AwarenessUpdateEntry,
        },
        broadcast::BroadcastGroup,
        protocol::{
            Error,
            Message,
            SyncMessage,
        },
    };
    use futures_util::{
        ready,
        SinkExt,
        StreamExt,
    };
    use std::{
        collections::HashMap,
        pin::Pin,
        sync::Arc,
        task::{
            Context,
            Poll,
        },
    };
    use tokio::sync::{
        Mutex,
        RwLock,
    };
    use tokio_util::sync::PollSender;
    use yrs::{
        updates::{
            decoder::Decode,
            encoder::Encode,
        },
        Doc,
        StateVector,
        Text,
        Transact,
    };

    #[derive(Debug)]
    pub struct ReceiverStream<T> {
        inner: tokio::sync::mpsc::Receiver<T>,
    }

    impl<T> ReceiverStream<T> {
        /// Creates a new [ReceiverStream] instance.
        pub fn new(recv: tokio::sync::mpsc::Receiver<T>) -> Self {
            Self { inner: recv }
        }
    }

    impl<T> futures_util::Stream for ReceiverStream<T> {
        type Item = Result<T, Error>;

        fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
            match ready!(self.inner.poll_recv(cx)) {
                None => Poll::Ready(None),
                Some(v) => Poll::Ready(Some(Ok(v))),
            }
        }
    }

    /// Creates a test channel with the provided capacity.
    ///
    /// * `channel` - The channel capacity.
    fn test_channel(capacity: usize) -> (PollSender<Vec<u8>>, ReceiverStream<Vec<u8>>) {
        let (tx, rx) = tokio::sync::mpsc::channel::<Vec<u8>>(capacity);
        let tx = PollSender::new(tx);
        let rx = ReceiverStream::new(rx);

        (tx, rx)
    }

    #[tokio::test]
    async fn can_broadcast_changes() -> Result<(), Box<dyn std::error::Error>> {
        let doc = Doc::with_client_id(1);
        let text = doc.get_or_insert_text("test");
        let awareness = Arc::new(RwLock::new(Awareness::new(doc)));
        let group = BroadcastGroup::new(awareness.clone(), 1).await.unwrap();

        let (server_sender, mut client_receiver) = test_channel(1);
        let (mut client_sender, server_receiver) = test_channel(1);
        let _ = group.subscribe(Arc::new(Mutex::new(server_sender)), server_receiver, false);

        // Check update propagation
        {
            let awareness = awareness.write().await;
            text.push(&mut awareness.doc().transact_mut(), "a");
        }

        let message = client_receiver.next().await;
        let message = message.map(|x| Message::decode_v1(&x.unwrap()).unwrap());

        assert_eq!(
            message,
            Some(Message::Sync(SyncMessage::Update(vec![
                1, 1, 1, 0, 4, 1, 4, 116, 101, 115, 116, 1, 97, 0,
            ])))
        );

        // Check the awareness update propagation.
        {
            let mut awareness = awareness.write().await;
            awareness.set_local_state(r#"{"key":"value"}"#)
        }

        let message = client_receiver.next().await;
        let message = message.map(|x| Message::decode_v1(&x.unwrap()).unwrap());

        assert_eq!(
            message,
            Some(Message::Awareness(AwarenessUpdate {
                clients: HashMap::from([(
                    1,
                    AwarenessUpdateEntry {
                        clock: 1,
                        json: r#"{"key":"value"}"#.to_string(),
                    },
                )]),
            }))
        );

        // Check the sync state request/response.
        {
            client_sender
                .send(Message::Sync(SyncMessage::SyncStep1(StateVector::default())).encode_v1())
                .await?;

            let message = client_receiver.next().await;
            let message = message.map(|x| Message::decode_v1(&x.unwrap()).unwrap());

            assert_eq!(
                message,
                Some(Message::Sync(SyncMessage::SyncStep2(vec![
                    1, 1, 1, 0, 4, 1, 4, 116, 101, 115, 116, 1, 97, 0,
                ])))
            );
        }

        // Check the internal message handler.
        {
            group.broadcast_internal_message("test").unwrap();

            let message = client_receiver.next().await;
            let message = message.map(|x| Message::decode_v1(&x.unwrap()).unwrap());

            assert_eq!(message, Some(Message::Internal("test".to_string())));
        }

        Ok(())
    }
}
