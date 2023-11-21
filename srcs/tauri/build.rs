fn main() -> Result<(), Box<dyn std::error::Error>> {
  tonic_build::configure()
    .protoc_arg("--experimental_allow_proto3_optional")
    .compile(
      &["../proto/utils.proto", "../proto/item.proto"],
      &["../proto"],
    )?;
  tauri_build::build();
  Ok(())
}
