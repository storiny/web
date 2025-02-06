use super::{
    awareness,
    awareness::{
        Awareness,
        AwarenessUpdate,
    },
};
use thiserror::Error;
use tracing::warn;
use yrs::{
    encoding::read,
    updates::{
        decoder::{
            Decode,
            Decoder,
        },
        encoder::{
            Encode,
            Encoder,
        },
    },
    ReadTxn,
    StateVector,
    Transact,
    Update,
};

/// The maximum size (in bytes) of the individual incoming awareness update. Awareness updates
/// should normally never overflow this limit unless the peer is sending malformed updates, in
/// which case we simply reject them.
const MAX_AWARENESS_PAYLOAD_SIZE: usize = 1_000_000; // 1 megabyte

/// Tag id for [Message::Sync].
pub const MSG_SYNC: u8 = 0;

/// Tag id for [Message::Awareness].
pub const MSG_AWARENESS: u8 = 1;

/// Tag id for [Message::Auth].
pub const MSG_AUTH: u8 = 2;

/// Tag id for [Message::AwarenessQuery].
pub const MSG_QUERY_AWARENESS: u8 = 3;

/// Tag id for [Message::Internal].
pub const MSG_INTERNAL: u8 = 4;

/// Tag id for authentication denied message.
pub const PERMISSION_DENIED: u8 = 0;

/// Tag id for authentication granted message.
pub const PERMISSION_GRANTED: u8 = 1;

/// Tag id for [SyncMessage::SyncStep1].
pub const MSG_SYNC_STEP_1: u8 = 0;

/// Tag id for [SyncMessage::SyncStep2].
pub const MSG_SYNC_STEP_2: u8 = 1;

/// Tag id for [SyncMessage::Update].
pub const MSG_SYNC_UPDATE: u8 = 2;

/// A message instance.
#[derive(Debug, Clone, Eq, PartialEq)]
pub enum Message {
    /// The sync message variant. Contains the [SyncMessage] variant.
    Sync(SyncMessage),
    /// The authentication message variant. Contains the reason for denying the authentication, if
    /// any.
    Auth(Option<String>),
    /// The awareness query message variant.
    AwarenessQuery,
    /// The awareness message variant. Contains the binary awareness update payload.
    Awareness(AwarenessUpdate),
    /// The internal message variant. Contains the reason payload.
    Internal(String),
    /// The custom message variant. Contains a tuple of the tag ID of the message with its binary
    /// payload.
    Custom(u8, Vec<u8>),
}

impl Encode for Message {
    /// Encodes a [Message] using the provided encoder.
    ///
    /// * `encoder` - The encoder to use for encoding the message.
    fn encode<E: Encoder>(&self, encoder: &mut E) {
        match self {
            Message::Sync(msg) => {
                encoder.write_var(MSG_SYNC);
                msg.encode(encoder);
            }
            Message::Auth(reason) => {
                encoder.write_var(MSG_AUTH);

                if let Some(reason) = reason {
                    encoder.write_var(PERMISSION_DENIED);
                    encoder.write_string(reason.as_str());
                } else {
                    encoder.write_var(PERMISSION_GRANTED);
                }
            }
            Message::AwarenessQuery => {
                encoder.write_var(MSG_QUERY_AWARENESS);
            }
            Message::Awareness(update) => {
                encoder.write_var(MSG_AWARENESS);
                encoder.write_buf(update.encode_v1())
            }
            Message::Internal(message) => {
                encoder.write_var(MSG_INTERNAL);
                encoder.write_string(message.as_str());
            }
            Message::Custom(tag, data) => {
                encoder.write_u8(*tag);
                encoder.write_buf(data);
            }
        }
    }
}

impl Decode for Message {
    /// Decodes a [Message] using the provided decoder.
    ///
    /// * `decoder` - The decoder to use for decoding the message.
    fn decode<D: Decoder>(decoder: &mut D) -> Result<Self, read::Error> {
        let tag: u8 = decoder.read_var()?;

        match tag {
            MSG_SYNC => {
                let msg = SyncMessage::decode(decoder)?;
                Ok(Message::Sync(msg))
            }
            MSG_AWARENESS => {
                let data = decoder.read_buf()?;
                let update = AwarenessUpdate::decode_v1(data)?;
                Ok(Message::Awareness(update))
            }
            MSG_AUTH => {
                let reason = if decoder.read_var::<u8>()? == PERMISSION_DENIED {
                    Some(decoder.read_string()?.to_string())
                } else {
                    None
                };

                Ok(Message::Auth(reason))
            }
            MSG_QUERY_AWARENESS => Ok(Message::AwarenessQuery),
            MSG_INTERNAL => {
                let data = decoder.read_string()?;
                Ok(Message::Internal(data.to_string()))
            }
            tag => {
                let data = decoder.read_buf()?;
                Ok(Message::Custom(tag, data.to_vec()))
            }
        }
    }
}

/// A sync message instance.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SyncMessage {
    /// The sync-step-1 message variant. Contains the [StateVector] from the remote peer.
    SyncStep1(StateVector),
    /// The sync-step-2 message variant. Contains a binary update having the missing data for the
    /// peer.
    SyncStep2(Vec<u8>),
    /// The update message variant. Contains the binary update payload.
    Update(Vec<u8>),
}

impl Encode for SyncMessage {
    /// Encodes a [SyncMessage] using the provided encoder.
    ///
    /// * `encoder` - The encoder to use for encoding the message.
    fn encode<E: Encoder>(&self, encoder: &mut E) {
        match self {
            SyncMessage::SyncStep1(sv) => {
                encoder.write_var(MSG_SYNC_STEP_1);
                encoder.write_buf(sv.encode_v1());
            }
            SyncMessage::SyncStep2(u) => {
                encoder.write_var(MSG_SYNC_STEP_2);
                encoder.write_buf(u);
            }
            SyncMessage::Update(u) => {
                encoder.write_var(MSG_SYNC_UPDATE);
                encoder.write_buf(u);
            }
        }
    }
}

impl Decode for SyncMessage {
    /// Decodes a [SyncMessage] using the provided decoder.
    ///
    /// * `decoder` - The decoder to use for decoding the message.
    fn decode<D: Decoder>(decoder: &mut D) -> Result<Self, read::Error> {
        let tag: u8 = decoder.read_var()?;

        match tag {
            MSG_SYNC_STEP_1 => {
                let buf = decoder.read_buf()?;
                let sv = StateVector::decode_v1(buf)?;
                Ok(SyncMessage::SyncStep1(sv))
            }
            MSG_SYNC_STEP_2 => {
                let buf = decoder.read_buf()?;
                Ok(SyncMessage::SyncStep2(buf.into()))
            }
            MSG_SYNC_UPDATE => {
                let buf = decoder.read_buf()?;
                Ok(SyncMessage::Update(buf.into()))
            }
            _ => Err(read::Error::UnexpectedValue),
        }
    }
}

/// # Core Yjs defines two message types:
///
/// - `SyncStep1`: Includes the state set of the sending client. When received, the client should
/// reply with YjsSyncStep2.
///
/// - `SyncStep2`: Includes all missing structs and the complete delete
/// set. When received, the client is assured that it received all information from the remote
/// client.
///
/// The client should initiate the connection with SyncStep1. When the server receives SyncStep1, it
/// should reply with SyncStep2 immediately followed by SyncStep1. The client replies with SyncStep2
/// when it receives SyncStep1. Optionally the server may send a SyncDone after it received
/// SyncStep2, so the client knows that the sync is finished.
///
/// # Construction of a message:
///
/// `[message_type: var_uint, message definition]`
#[derive(Debug, Copy, Clone, Default)]
pub struct RealmProtocol;

impl RealmProtocol {
    /// Called whenever a new connection has been accepted. Returns an encoded list of messages to
    /// send back to initiator. This binary may contain multiple messages inside, stored one after
    /// another.
    ///
    /// * `awareness` - The awareness instance.
    /// * `encoder` - The message encoder.
    #[allow(dead_code)]
    pub fn start<E: Encoder>(&self, awareness: &Awareness, encoder: &mut E) -> Result<(), Error> {
        let (sv, update) = {
            let sv = awareness.doc().transact().state_vector();
            let update = awareness.update()?;
            (sv, update)
        };

        Message::Sync(SyncMessage::SyncStep1(sv)).encode(encoder);
        Message::Awareness(update).encode(encoder);

        Ok(())
    }

    /// Y-sync protocol sync-step-1 - given a [StateVector] of a remote side, calculate the missing
    /// updates. Returns a sync-step-2 message containing a calculated update.
    ///
    /// * `awareness` - The awareness instance.
    /// * `sv` - The state vector of the remote client.
    pub fn handle_sync_step1(
        &self,
        awareness: &Awareness,
        sv: StateVector,
    ) -> Result<Option<Message>, Error> {
        let update = awareness.doc().transact().encode_state_as_update_v1(&sv);
        Ok(Some(Message::Sync(SyncMessage::SyncStep2(update))))
    }

    /// Handles reply for a sync-step-1 sent from this replica previously. By default, just apply
    /// an update to the current `awareness` document instance.
    ///
    /// * `awareness` - The awareness instance.
    /// * `update` - The binary update payload.
    pub fn handle_sync_step2(
        &self,
        awareness: &mut Awareness,
        update: Update,
    ) -> Result<Option<Message>, Error> {
        let mut txn = awareness.doc().transact_mut();
        txn.apply_update(update);

        Ok(None)
    }

    /// Handles continuous updates sent from the client. By default, just apply an update to a
    /// current `awareness` document instance.
    ///
    /// * `awareness` - The awareness instance.
    /// * `update` - The binary update payload.
    pub fn handle_update(
        &self,
        awareness: &mut Awareness,
        update: Update,
    ) -> Result<Option<Message>, Error> {
        self.handle_sync_step2(awareness, update)
    }

    /// Handles authorization message. By default, if a reason for auth denial has been provided,
    /// send back [Error::PermissionDenied].
    ///
    /// * `deny_reason` - The reason for denying the peer.
    pub fn handle_auth(
        &self,
        _: &Awareness,
        deny_reason: Option<String>,
    ) -> Result<Option<Message>, Error> {
        if let Some(reason) = deny_reason {
            Err(Error::PermissionDenied { reason })
        } else {
            Ok(None)
        }
    }

    /// Returns an [AwarenessUpdate] which is a serializable representation of the current
    /// `awareness` instance.
    ///
    /// * `awareness` - The awareness instance.
    pub fn handle_awareness_query(&self, awareness: &Awareness) -> Result<Option<Message>, Error> {
        let update = awareness.update()?;
        Ok(Some(Message::Awareness(update)))
    }

    /// Replies to an awareness query or just an incoming [AwarenessUpdate], where the current
    /// `awareness` instance is being updated with the incoming data.
    ///
    /// * `awareness` - The awareness instance.
    /// * `update` - The binary update payload.
    pub fn handle_awareness_update(
        &self,
        awareness: &mut Awareness,
        update: AwarenessUpdate,
    ) -> Result<Option<Message>, Error> {
        let update_size = update.encode_v2().len();

        if update_size < MAX_AWARENESS_PAYLOAD_SIZE {
            awareness.apply_update(update)?;
        } else {
            warn!(
                "aborted awareness update due to unexpectedly large update size: {update_size} bytes"
            );
        }

        Ok(None)
    }

    /// Custom handles. By default, returns an [Error::Unsupported].
    ///
    /// * `tag` - The update tag.
    pub fn missing_handle(
        &self,
        _: &mut Awareness,
        tag: u8,
        _data: Vec<u8>,
    ) -> Result<Option<Message>, Error> {
        Err(Error::Unsupported(tag))
    }
}

/// Since the [RealmProtocol] enables for multiple messages to be packed into a singe byte payload,
/// [MessageReader] can be used over the decoder to read these messages one by one in an iterable
/// fashion.
pub struct MessageReader<'a, D: Decoder>(&'a mut D);

impl<'a, D: Decoder> MessageReader<'a, D> {
    /// Creates a new [MessageReader] instance.
    ///
    /// * `decoder` - The decoder to use for decoding the messages.
    #[allow(dead_code)]
    pub fn new(decoder: &'a mut D) -> Self {
        MessageReader(decoder)
    }
}

impl<'a, D: Decoder> Iterator for MessageReader<'a, D> {
    type Item = Result<Message, read::Error>;

    fn next(&mut self) -> Option<Self::Item> {
        match Message::decode(self.0) {
            Ok(msg) => Some(Ok(msg)),
            Err(read::Error::EndOfBuffer(_)) => None,
            Err(error) => Some(Err(error)),
        }
    }
}

/// An error type returned in response from the [RealmProtocol].
#[derive(Debug, Error)]
pub enum Error {
    /// Incoming message couldn't be deserialized.
    #[error("failed to deserialize message: {0}")]
    Decoding(#[from] read::Error),
    /// Applying incoming awareness update has failed.
    #[error("failed to process awareness update: {0}")]
    AwarenessEncoding(#[from] awareness::Error),
    /// An incoming authorization request has been denied.
    #[error("permission denied to access: {reason}")]
    PermissionDenied { reason: String },
    /// Thrown whenever an unknown message tag has been sent.
    #[error("unsupported message tag identifier: {0}")]
    Unsupported(u8),
    /// Thrown in case of I/O errors.
    #[error("IO error: {0}")]
    IO(#[from] std::io::Error),
    /// Custom dynamic kind of error, usually related to a warp internal error message.
    #[error("internal failure: {0}")]
    Other(#[from] Box<dyn std::error::Error + Send + Sync>),
}

impl From<tokio::task::JoinError> for Error {
    fn from(value: tokio::task::JoinError) -> Self {
        Error::Other(value.into())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use std::collections::HashMap;
    use yrs::{
        encoding::read::Cursor,
        updates::{
            decoder::{
                Decode,
                DecoderV1,
            },
            encoder::{
                Encode,
                EncoderV1,
            },
        },
        Doc,
        GetString,
        ReadTxn,
        StateVector,
        Text,
        Transact,
    };

    #[test]
    fn can_encode_and_decode_messages() {
        let doc = Doc::new();
        let txt = doc.get_or_insert_text("text");

        txt.push(&mut doc.transact_mut(), "hello world");

        let mut awareness = Awareness::new(doc);

        awareness.set_local_state(
            serde_json::json!({
                "user": {
                    "name": "Test user",
                    "username": "test_user",
                    "color": "#000000"
                }
            })
            .to_string(),
        );

        let messages = [
            Message::Sync(SyncMessage::SyncStep1(
                awareness.doc().transact().state_vector(),
            )),
            Message::Sync(SyncMessage::SyncStep2(
                awareness
                    .doc()
                    .transact()
                    .encode_state_as_update_v1(&StateVector::default()),
            )),
            Message::Awareness(awareness.update().unwrap()),
            Message::Auth(Some("reason".to_string())),
            Message::AwarenessQuery,
            Message::Internal("internal_reason".to_string()),
        ];

        for message in messages {
            let encoded = message.encode_v1();
            let decoded = Message::decode_v1(&encoded)
                .unwrap_or_else(|_| panic!("failed to decode {:?}", message));

            assert_eq!(decoded, message);
        }
    }

    #[test]
    fn can_initialize_protocol() {
        let awareness = Awareness::default();
        let mut encoder = EncoderV1::new();

        RealmProtocol.start(&awareness, &mut encoder).unwrap();

        let data = encoder.to_vec();
        let mut decoder = DecoderV1::new(Cursor::new(&data));
        let mut reader = MessageReader::new(&mut decoder);

        assert_eq!(
            reader.next().unwrap().unwrap(),
            Message::Sync(SyncMessage::SyncStep1(StateVector::default()))
        );
        assert_eq!(
            reader.next().unwrap().unwrap(),
            Message::Awareness(awareness.update().unwrap())
        );
        assert!(reader.next().is_none());
    }

    #[test]
    fn can_handle_sync_steps() {
        let mut a1 = Awareness::new(Doc::with_client_id(1));
        let mut a2 = Awareness::new(Doc::with_client_id(2));

        let expected = {
            let txt = a1.doc_mut().get_or_insert_text("test");
            let mut txn = a1.doc_mut().transact_mut();
            txt.push(&mut txn, "hello");
            txn.encode_state_as_update_v1(&StateVector::default())
        };

        let result = RealmProtocol
            .handle_sync_step1(&a1, a2.doc().transact().state_vector())
            .unwrap();

        assert_eq!(
            result,
            Some(Message::Sync(SyncMessage::SyncStep2(expected)))
        );

        if let Some(Message::Sync(SyncMessage::SyncStep2(u))) = result {
            let result2 = RealmProtocol
                .handle_sync_step2(&mut a2, Update::decode_v1(&u).unwrap())
                .unwrap();

            assert!(result2.is_none());
        }

        let txt = a2.doc().transact().get_text("test").unwrap();
        assert_eq!(txt.get_string(&a2.doc().transact()), "hello".to_owned());
    }

    #[test]
    fn can_handle_sync_step_update() {
        let mut a1 = Awareness::new(Doc::with_client_id(1));
        let mut a2 = Awareness::new(Doc::with_client_id(2));

        let data = {
            let txt = a1.doc_mut().get_or_insert_text("test");
            let mut txn = a1.doc_mut().transact_mut();
            txt.push(&mut txn, "hello");
            txn.encode_update_v1()
        };

        let result = RealmProtocol
            .handle_update(&mut a2, Update::decode_v1(&data).unwrap())
            .unwrap();

        assert!(result.is_none());

        let txt = a2.doc().transact().get_text("test").unwrap();
        assert_eq!(txt.get_string(&a2.doc().transact()), "hello".to_owned());
    }

    #[test]
    fn can_handle_awareness_sync() {
        let mut a1 = Awareness::new(Doc::with_client_id(1));
        let mut a2 = Awareness::new(Doc::with_client_id(2));

        a1.set_local_state("{x:3}");
        let result = RealmProtocol.handle_awareness_query(&a1).unwrap();

        assert_eq!(result, Some(Message::Awareness(a1.update().unwrap())));

        if let Some(Message::Awareness(u)) = result {
            let result = RealmProtocol.handle_awareness_update(&mut a2, u).unwrap();
            assert!(result.is_none());
        }

        assert_eq!(a2.clients(), &HashMap::from([(1, "{x:3}".to_owned())]));
    }
}
