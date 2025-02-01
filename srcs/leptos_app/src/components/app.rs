use leptos::prelude::*;

use super::background::Background;
use super::controls::Controls;

#[component]
pub fn App() -> impl IntoView {
  view! {
    <Background />
    <main class="absolute h-full w-full">
      <Controls />
    </main>
  }
}
