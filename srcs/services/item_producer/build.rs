use std::{env, process::Command};

extern crate prost_build;

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let mut prost_build = prost_build::Config::new();
  // Enable a protoc experimental feature.
  prost_build.protoc_arg("--experimental_allow_proto3_optional");
  prost_build.compile_protos(
    &["../../proto/item.proto", "../../proto/utils.proto"],
    &["../../proto"],
  )?;
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
  }
  Ok(())
}
