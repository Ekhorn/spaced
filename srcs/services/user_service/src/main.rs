use axum::{routing::post, Router};
use clap::Parser;
use sqlx::PgPool;
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::{filter::LevelFilter, EnvFilter};

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
  init_logging();

  let args = Args::parse();

  let db_pool = PgPool::connect(&args.database_host).await?;

  sqlx::migrate!("../../../migrations").run(&db_pool).await?;

  let app = Router::new()
    .route("/api/user/register", post(handlers::register_email))
    .route("/api/user/refresh", post(handlers::refresh_token))
    .route("/api/user/login", post(handlers::email_login))
    .with_state(db_pool);

  let address = format!("{}:{}", args.host, args.port);
  info!("Server starting on http://{}", address);
  let listener = TcpListener::bind(address).await?;
  axum::serve(listener, app).await?;

  Ok(())
}

fn init_logging() {
  let env_filter = EnvFilter::builder()
    .with_default_directive(LevelFilter::INFO.into())
    .from_env_lossy();

  tracing_subscriber::fmt()
    .with_target(true)
    .with_level(true)
    .with_env_filter(env_filter)
    .init();
}
