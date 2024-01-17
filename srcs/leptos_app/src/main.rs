use leptos::prelude::*;

fn main() {
  console_error_panic_hook::set_once();
  leptos::mount::mount_to_body(|| view! { <p>"Hi there :)."</p> })
}
// https://book.leptos.dev/web_sys.html#using-js-libraries-with-wasm-bindgen
