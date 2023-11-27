use super::warp as wp;
use crate::config::get_app_config;

pub async fn start_realms_server() -> std::io::Result<()> {
    let config = get_app_config().expect("Unable to load the environment configuration");
    let host = config.realms_host.to_string();
    let port = config.realms_port.clone().parse::<u16>().unwrap();

    log::info!(
        "{}",
        format!("Starting realms server at http://{}:{}", &host, &port)
    );

    wp::start().await;

    Ok(())
}
