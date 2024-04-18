mod model;

use burn::{backend::NdArray, tensor::Tensor};
// use image::GrayImage;
use model::mnist::Model;

type Backend = NdArray<f32>;

fn main() {
  let image = std::path::PathBuf::from("srcs/burning/example.png")
    .canonicalize()
    .unwrap();

  let img = image::io::Reader::open(image)
    .unwrap()
    .decode()
    .unwrap()
    .resize_to_fill(28, 28, image::imageops::FilterType::Nearest)
    .to_luma32f();

  // Initialize a new model instance
  let device = <Backend as burn::tensor::backend::Backend>::Device::default();
  let model: Model<Backend> = Model::default();
  let image_data = img.into_raw().to_vec();

  // let pixel_data: Vec<u8> = image_data.iter().map(|&f| (f * 255.0) as u8).collect();
  // let img: GrayImage = GrayImage::from_raw(28, 28, pixel_data).unwrap();

  // Save the image as a PNG file
  // img.save("srcs/burning/output.png").unwrap();

  let mut input: Tensor<Backend, 4> =
    Tensor::from_floats(image_data.as_slice(), &device).reshape([1, 1, 28, 28]);

  // Normalize the input
  // input = ((input / 255) - 0.1307) / 0.3081;

  // Create a sample input tensor (zeros for demonstration)
  // let input = tensor::Tensor::<NdArray<f32>, 4>::zeros([1, 1, 28, 28], &device);

  // Perform inference
  let output = model.forward(input);

  let arg_max = output.argmax(1).into_scalar() as u8;
  println!("{:?}", arg_max);
}
