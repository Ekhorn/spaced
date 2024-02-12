use std::{env, process::Command};

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let offline_mode = env::var("SQLX_OFFLINE");
  if !offline_mode.is_ok_and(|val| val.parse::<bool>().unwrap()) {
    Command::new("sqlx")
      .args([
        "database",
        "setup",
        "--database-url=postgres://admin:password@localhost:5432/spaced",
        "--source=../migrations",
      ])
      .output()
      .unwrap();
  }
  println!("cargo:rerun-if-changed=../migrations/");
  if std::env::var("PROFILE").unwrap() != "release" {
    println!("cargo:rustc-env=DATABASE_URL=postgres://admin:password@localhost:5432/spaced");
    println!("cargo:rustc-env=JWT_SECRET=test");
  }
  Ok(())
}
