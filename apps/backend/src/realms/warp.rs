use futures_util::StreamExt;
use std::sync::Arc;
use tokio::{
    signal::unix::{
        signal,
        SignalKind,
    },
    sync::{
        Mutex,
        RwLock,
    },
};
use warp::{
    ws::{
        WebSocket,
        Ws,
    },
    Filter,
    Rejection,
    Reply,
};
use y_sync::{
    awareness::Awareness,
    net::BroadcastGroup,
};
use yrs::{
    Doc,
    Text,
    Transact,
};
use yrs_warp::{
    ws::{
        WarpSink,
        WarpStream,
    },
    AwarenessRef,
};

pub async fn start() {
    // We're using a single static document shared among all the peers.
    let awareness: AwarenessRef = {
        let doc = Doc::new();
        //         {
        //             // pre-initialize code mirror document with some text
        //             let txt = doc.get_or_insert_text("codemirror");
        //             let mut txn = doc.transact_mut();
        //             txt.push(
        //                 &mut txn,
        //                 r#"function hello() {
        //   console.log('hello world');
        // }"#,
        //             );
        //         }
        Arc::new(RwLock::new(Awareness::new(doc)))
    };

    // open a broadcast group that listens to awareness and document updates
    // and has a pending message buffer of up to 32 updates
    let bcast = Arc::new(BroadcastGroup::new(awareness.clone(), 32).await);

    let ws = warp::any()
        .and(warp::ws())
        .and(warp::any().map(move || bcast.clone()))
        .and_then(ws_handler);

    let mut stream = signal(SignalKind::terminate()).unwrap();

    let (_, server) =
        warp::serve(ws).bind_with_graceful_shutdown(([0, 0, 0, 0], 8081), async move {
            stream.recv().await;
        });

    tokio::task::spawn(server);
}

async fn ws_handler(ws: Ws, bcast: Arc<BroadcastGroup>) -> Result<impl Reply, Rejection> {
    Ok(ws.on_upgrade(move |socket| peer(socket, bcast)))
}

async fn peer(ws: WebSocket, bcast: Arc<BroadcastGroup>) {
    let (sink, stream) = ws.split();
    let sink = Arc::new(Mutex::new(WarpSink::from(sink)));
    let stream = WarpStream::from(stream);
    let sub = bcast.subscribe(sink, stream);
    match sub.completed().await {
        Ok(_) => println!("broadcasting for channel finished successfully"),
        Err(e) => eprintln!("broadcasting for channel finished abruptly: {}", e),
    }
}
