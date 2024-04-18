use candle_core::{shape::Dim, Device, IndexOp, Tensor};
use std::env;

fn main() {
  let model = std::path::PathBuf::from("srcs/example/mnist-12.onnx")
    .canonicalize()
    .unwrap();
  let image = std::path::PathBuf::from("srcs/example/example.png")
    .canonicalize()
    .unwrap();

  println!("{:?}", env::current_dir());
  // let image = load_image224(image).unwrap();
  let tensor = Tensor::from_slice(&[0.0f32; 28 * 28], (1, 28, 28), &Device::Cpu).unwrap(); // Example: 1D tensor with 28*28 elements
  let reshaped_tensor = tensor.reshape(&[1, 1, 28, 28]).unwrap();

  println!("{:?}", reshaped_tensor);
  // let image = image.unsqueeze(0).unwrap();
  println!("{:?}", reshaped_tensor);

  let model = candle_onnx::read_file(model).unwrap();

  println!("{}", model.model_version);
  println!("{:?}", model.metadata_props);
  let graph = model.graph.as_ref().unwrap();
  let mut inputs = std::collections::HashMap::new();
  inputs.insert(graph.input[0].name.to_string(), reshaped_tensor);
  let mut outputs = candle_onnx::simple_eval(&model, inputs).unwrap();
  let output = outputs.remove(&graph.output[0].name).unwrap();

  let prs = output.i(0).unwrap().to_vec1::<f32>().unwrap();

  // Sort the predictions and take the top 5
  let mut top: Vec<_> = prs.iter().enumerate().collect();
  top.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap());
  let top = top.into_iter().take(5).collect::<Vec<_>>();

  // Print the top predictions
  for &(i, p) in &top {
    println!("{:50}: {:.2}%", i, p * 100.0);
  }
}
