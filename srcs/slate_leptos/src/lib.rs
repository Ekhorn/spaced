use leptos::prelude::*;

#[component]
pub fn Editable() -> impl IntoView {
  view! {
    <div contenteditable=true
      on:beforeinput=|_| {}
      on:input=|_| {}
      on:blur=|_| {}
      on:click=|_| {}
      on:compositionend=|_| {}
      on:compositionupdate=|_| {}
      on:compositionstart=|_| {}
      on:copy=|_| {}
      on:cut=|_| {}
      on:dragover=|_| {}
      on:dragstart=|_| {}
      on:drop=|_| {}
      on:dragend=|_| {}
      on:focus=|_| {}
      on:keydown=|_| {}
      on:paste=|_| {}
      >test</div>
  }
}

// use leptos::logging;
// use wasm_bindgen::prelude::*;

// #[wasm_bindgen(module = "/slate.js")]
// extern "C" {
//   fn createEditor() -> String;

//   // type MyClass;

//   // #[wasm_bindgen(constructor)]
//   // fn new() -> MyClass;

//   // #[wasm_bindgen(method, getter)]
//   // fn number(this: &MyClass) -> u32;
//   // #[wasm_bindgen(method, setter)]
//   // fn set_number(this: &MyClass, number: u32) -> MyClass;
//   // #[wasm_bindgen(method)]
//   // fn render(this: &MyClass) -> String;
// }

// // // lifted from the `console_log` example
// // #[wasm_bindgen]
// // extern "C" {
// //   #[wasm_bindgen(js_namespace = console)]
// //   fn log(s: &str);
// // }

// #[wasm_bindgen(start)]
// pub fn create_editor() {
//   logging::log!("{:?}", createEditor());
//   // log(&format!("Hello from {}!", name())); // should output "Hello from Rust!"

//   // let x = MyClass::new();
//   // assert_eq!(x.number(), 42);
//   // x.set_number(10);
//   // log(&x.render());
// }
