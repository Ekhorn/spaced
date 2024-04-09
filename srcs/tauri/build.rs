use burn_import::onnx::{ModelGen, RecordType};
use std::{env, process::Command};

fn main() -> Result<(), Box<dyn std::error::Error>> {
  if cfg!(feature = "embedded-model") {
    // If the embedded-model, then model is bundled into the binary.
    ModelGen::new()
      .input("src/model/mnist.onnx")
      .out_dir("model/")
      .record_type(RecordType::Bincode)
      .embed_states(true)
      .run_from_script();
  } else {
    // If not embedded-model, then model is loaded from the file system (default).
    ModelGen::new()
      .input("src/model/mnist.onnx")
      .out_dir("model/")
      .run_from_script();
  }

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
