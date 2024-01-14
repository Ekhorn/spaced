use axum::{routing::post, Router};
use clap::Parser;
use sqlx::PgPool;
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing::info;

mod auth;
mod handlers;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(long, env, default_value_t = String::from("localhost"))]
  host: String,
  #[arg(long, env, default_value_t = 8081)]
  port: u16,

  #[arg(long, env, default_value_t = String::from("postgres://admin:password@localhost:5432/spaced"))]
  database_host: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  utils::init_logging();

  let args = Args::parse();

  let db_pool = PgPool::connect(&args.database_host).await?;

  sqlx::migrate!("../../../migrations").run(&db_pool).await?;

  let app = Router::new()
    .route("/api/user/register", post(handlers::register_email))
    .route("/api/user/refresh", post(handlers::refresh_token))
    .route("/api/user/login", post(handlers::email_login))
    .layer(TraceLayer::new_for_http())
    .with_state(db_pool);

  let address = format!("{}:{}", args.host, args.port);
  info!("Server starting on http://{}", address);
  let listener = TcpListener::bind(address).await?;
  axum::serve(listener, app).await?;

  Ok(())
}
