mod components;

use components::app::App;
use leptos::{logging, mount};

fn main() {
  console_error_panic_hook::set_once();
  logging::log!("csr mode - mounting to body");
  mount::mount_to_body(App)
}
// https://book.leptos.dev/web_sys.html#using-js-libraries-with-wasm-bindgen
