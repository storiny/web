use crate::config::get_app_config;
use actix::{
    Actor,
    StreamHandler,
};
use actix_web::{
    web,
    App,
    Error,
    HttpRequest,
    HttpResponse,
    HttpServer,
};
use actix_web_actors::ws;

struct RealmWs;

impl Actor for RealmWs {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for RealmWs {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => ctx.pong(&msg),
            Ok(ws::Message::Text(text)) => ctx.text(text),
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            _ => (),
        }
    }
}

async fn index(req: HttpRequest, stream: web::Payload) -> Result<HttpResponse, Error> {
    let resp = ws::start(RealmWs {}, &req, stream);
    println!("{:?}", resp);
    resp
}

pub async fn start_realms_server() -> std::io::Result<()> {
    let config = get_app_config().expect("Unable to load the environment configuration");
    let host = config.realms_host.to_string();
    let port = config.realms_port.clone().parse::<u16>().unwrap();

    log::info!(
        "{}",
        format!("Starting realms server at http://{}:{}", &host, &port)
    );

    HttpServer::new(|| {
        App::new()
            .wrap(
                actix_web::middleware::Logger::new("%a %t \"%r\" %s %b \"%{Referer}i\" %T")
                    .log_target("realms"),
            )
            .wrap(actix_web::middleware::Compress::default())
            .wrap(actix_web::middleware::NormalizePath::trim())
            .route("/", web::get().to(index))
    })
    .bind((host, port))?
    .run()
    .await
}
