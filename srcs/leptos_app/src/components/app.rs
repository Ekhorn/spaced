use leptos::prelude::*;

use super::background::Background;
use super::container::Container;
use super::controls::Controls;
use super::viewport::Viewport;

#[derive(Debug, Clone)]
pub struct Item {
  pub id: i64,
  pub x: i64,
  pub y: i64,
  pub w: i64,
  pub h: i64,
  pub editor: String,
  pub schema: Option<String>,
  pub shared: Option<String>,
}

#[component]
pub fn App() -> impl IntoView {
  let (items, set_items) = signal(vec![
    Item {
      id: 1,
      x: 30,
      y: 90,
      w: 30,
      h: 30,
      editor: "".to_string(),
      schema: Some("".to_string()),
      shared: Some("".to_string()),
    },
    Item {
      id: 2,
      x: 30,
      y: 30,
      w: 30,
      h: 30,
      editor: "".to_string(),
      schema: Some("".to_string()),
      shared: Some("".to_string()),
    },
  ]);

  view! {
    <Viewport>
      <Background />
      <main class="absolute h-full w-full">
        <Controls />
        <For
          each=move || items.get()
          key=|state| state.id
          let:child
          >
            <Container props=child />
        </For>
      </main>
    </Viewport>
  }
}
