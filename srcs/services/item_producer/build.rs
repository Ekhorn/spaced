extern crate prost_build;

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let mut prost_build = prost_build::Config::new();
  // Enable a protoc experimental feature.
  prost_build.protoc_arg("--experimental_allow_proto3_optional");
  prost_build.compile_protos(
    &["../../proto/item.proto", "../../proto/utils.proto"],
    &["../../proto"],
  )?;
  Ok(())
}
