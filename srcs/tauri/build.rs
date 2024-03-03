use std::{env, process::Command};

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let offline_mode = env::var("SQLX_OFFLINE");
  if !offline_mode.is_ok_and(|val| val.parse::<bool>().unwrap()) {
    Command::new("sqlx")
      .args(["database", "setup", "--database-url=sqlite:dev.db"])
      .output()
      .unwrap();
  }
  tauri_build::build();
  println!("cargo:rerun-if-changed=migrations/");
  Ok(())
}
